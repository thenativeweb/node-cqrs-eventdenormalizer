var _ = require('lodash'),
    eventEmitter = require('../eventEmitter'),
    async = require('async'),
    uuid = require('node-uuid').v4;

function dive(obj, key) {
  var keys = key.split('.');
  var x = 0;
  var value = obj;
  while (keys[x]) {
    value = value && value[keys[x]];
    x++;
  }
  return value;
}

var ViewBuilder = {};
ViewBuilder.prototype = {

  configure: function(fn) {
    fn.call(this);
    return this;
  },

  use: function(module) {
    if (!module) return;

    if (module.commit) {
      this.repository = module;
    }
  },

  loadViewModel: function(id, evt, callback) {
    this.repository.get(id, callback);
  },

  saveViewModel: function(vm, callback) {
    this.repository.commit(vm, callback);
  },

  setOptions: function(options) {
    this.options = options;
  },

  'create': function(data, vm, evt) {
    this.defaultAction(data, vm, evt, 'create');
  },

  'update': function(data, vm, evt) {
    this.defaultAction(data, vm, evt, 'update');
  },

  'delete': function(data, vm, evt) {
    this.defaultAction(data, vm, evt, 'delete');
  },

  defaultAction: function(data, vm, evt, action) {
    if(action !== 'delete') {
      _.extend(vm, data);
    } else {
      vm.destroy();
    }
  },

  handle: function(evt, replay, callback) {

    var self = this;

    // Map events to function names:
    // - For the event handler matching the current event, its name is returned
    // - For all other event handlers, undefined is returned
    var fnNames = _.map(this.events, function(item) {
        if (_.isString(item) && item === evt.event) {
          return item;
        } else if (item.event && item.event === evt.event && item.method) {
          return item.method;
        } else if (item.event && item.event == evt.event) {
          return item.event;
        }
      }
    );

    // Reduce function names to function name:
    // - Replace all undefineds by an empty string
    // - Keep all non-undefined values
    //
    // NOTE: This will fail if multiple event handlers match the current event,
    //       but this is not allowed anyway, so it can only happen on error.
    var fnName = _.reduce(fnNames, function(memo, item) {
      return memo + (item || '');
    }, '');

    if (this[fnName]) {
      var vmIdPath = 'payload.id',
          payload = 'payload';

      var settings = _.find(this.events, function(item) {
        if (item.event && item.event === evt.event) {
          return item;
        }
      });

      if (settings && settings.viewModelId) {
        vmIdPath = settings.viewModelId;
      }
      var vmId = dive(evt, vmIdPath) || evt.payload.id;

      if (settings && settings.payload) {
        payload = settings.payload;
      }
      var data = dive(evt, payload) || evt.payload;

      var load = this.loadViewModel.bind(this);

      if (replay && this.replayingVms[vmId]) {
        load = function(id, evt, callback) {
          callback(null, self.replayingVms[vmId]);
        };
      }

      load(vmId, evt, function(err, vm) {
        if (err) {
          throw err;
        }

        // Call the event handler found by map-reduce.
        self[fnName](data, vm, evt);

        if (replay) {
          self.replayingVms[vmId] = vm;
          return callback(null);
        }

        self.saveViewModel(vm, function(err) {
          if (err && err.name === 'ConcurrencyError') {
            setTimeout(function() {
              self.handle(evt);
            }, 100);
            return;
          }
          if (err) {
            throw err;
          }
          eventEmitter.emit('denormalized:' + evt.event, evt);
        });
      });
    } else {
      throw new Error('missing handle function');
    }
   
  },

  replay: function(evts, callback) {

    var self = this;

    if (!evts || evts.length === 0) {
      return callback(null);
    }

    async.eachSeries(evts, function(evt, callback) {
      self.handle(evt, true, callback);
    }, function(err) {

      var replVms = _.values(self.replayingVms);

      async.each(replVms, function(vm, callback) {
        self.saveViewModel(vm, callback);
      }, function(err) {
        self.replayingVms = {};
        callback(err);
      });

    });

  },

  replayStreamed: function(fn, retryTimout) {

    var self = this;

    retryTimout = retryTimout || 10;

    var queue = [];

    var replay = function(evt) {
      queue.push(evt);

      if (queue.length === 1) {
        (function handle(e) {
          self.handle(e, true, function(err) {
            queue.splice(queue.indexOf(e), 1);

            if (queue.length > 0) {
              handle(queue[0]);
            }
          });
        })(evt);
      }
    };

    var done = function(callback) {
      (function retry() {
        if (queue.length > 0) {
          return setTimeout(retry, retryTimout);
        }

        var replVms = _.values(self.replayingVms);

        async.each(replVms, function(vm, callback) {
          self.saveViewModel(vm, callback);
        }, function(err) {
          self.replayingVms = {};
          callback(err);
        });
      })();
    };

    fn(replay, done);

  }

};

module.exports = {

  extend: function(obj) {
    var newObj = _.extend(_.clone(ViewBuilder.prototype), obj);

    newObj.id = uuid();

    newObj.replayingVms = {};

    newObj.options = {};

    newObj.registeredEventNames = _.map(newObj.events, function(item) {
      if (_.isString(item)) {
        return item;
      } else if (item.event) {
        return item.event;
      }
    });

    return newObj;
  }

};