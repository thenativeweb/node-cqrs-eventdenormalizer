var _ = require('lodash'),
    eventEmitter = require('../eventEmitter');

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

  handle: function(evt) {

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
      var vmId = dive(evt, vmIdPath);

      if (settings && settings.payload) {
        payload = settings.payload;
      }
      var data = dive(evt, payload);

      this.loadViewModel(vmId, evt, function(err, vm) {
        if (err) {
          throw err;
        }

        // Call the event handler found by map-reduce.
        self[fnName](data, vm, evt);

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
   
  }

};

module.exports = {

  extend: function(obj) {
    var newObj = _.extend(_.clone(ViewBuilder.prototype), obj);

    newObj.options = {};

    return newObj;
  }

};