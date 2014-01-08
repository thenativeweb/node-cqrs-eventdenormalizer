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

  loadViewModel: function(id, callback) {
    this.repository.get(id, callback);
  },

  saveViewModel: function(vm, callback) {
    this.repository.commit(vm, callback);
  },

  setOptions: function(options) {
    this.options = options;
  },

  'create': function(evt, vm) {
    this.defaultAction(evt, vm, 'create');
  },

  'update': function(evt, vm) {
    this.defaultAction(evt, vm, 'update');
  },

  'delete': function(evt, vm) {
    this.defaultAction(evt, vm, 'delete');
  },

  defaultAction: function(evt, vm, action) {
    if(action !== 'delete') {
      _.extend(vm, evt.payload);
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
        } else if (item[evt.event]) {
          return item[evt.event];
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

    if(this[fnName]) {
      var vmIdPath = 'payload.id';
      if (this.viewModelIds && this.viewModelIds[evt.event]) {
        vmIdPath = this.viewModelIds[evt.event];
      }
      var vmId = dive(evt, vmIdPath);

      this.loadViewModel(vmId, function(err, vm) {
        if (err) {
          throw err;
        }

        // Call the event handler found by map-reduce.
        self[fnName](evt, vm);

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