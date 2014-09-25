'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  async = require('async'),
  dotty = require('dotty'),
  uuid = require('node-uuid').v4,
  ConcurrencyError = require('viewmodel').ConcurrencyError,
  debug = require('debug')('denormalizer:viewBuilder');

/**
 * ViewBuilder constructor
 * @param {Object}             meta     Meta infos like: { name: 'name', version: 1, payload: 'some.path' }
 * @param {Function || String} denormFn Function handle
 *                                      `function(evtData, vm){}`
 * @constructor
 */
function ViewBuilder (meta, denormFn) {
  Definition.call(this, meta);
  
  // used for replay...
  this.workerId = uuid().toString();
  this.isReplaying = false;
  this.replayingVms = {};

  meta = meta || {};

  if (!denormFn || (!_.isFunction(denormFn) && !_.isString(denormFn))) {
    var err = new Error('denormalizer function not injected!');
    debug(err);
    throw err;
  }

  if (_.isString(denormFn) && denormFn !== 'update' && denormFn !== 'create' && denormFn !== 'delete') {
    var err = new Error('denormalizer function "' + denormFn + '" not available! Use "create", "update" or "delete"!');
    debug(err);
    throw err;
  }

  this.version = meta.version || 0;
  this.payload = meta.payload || null;
  this.aggregate = meta.aggregate || null;
  this.context = meta.context || null;
  this.id = meta.id || null;

  if (_.isString(denormFn)) {
    if (denormFn === 'delete') {
      denormFn = function (evtData, vm) {
        vm.destroy();
      };
    } else {
      denormFn = function (evtData, vm) {
        vm.set(evtData);
      };
    }
  }

  this.denormFn = denormFn;

  this.idGenerator(function () {
    return uuid().toString();
  });
}

util.inherits(ViewBuilder, Definition);

/**
 * Returns a random number between passed values of min and max.
 * @param {Number} min The minimum value of the resulting random number.
 * @param {Number} max The maximum value of the resulting random number.
 * @returns {Number}
 */
function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

_.extend(ViewBuilder.prototype, {

  /**
   * Inject idGenerator function.
   * @param   {Function}  fn The function to be injected.
   * @returns {ViewBuilder}  to be able to chain...
   */
  idGenerator: function (fn) {
    if (fn.length === 0) {
      fn = _.wrap(fn, function(func, callback) {
        callback(null, func());
      });
    }

    this.getNewId = fn;

    return this;
  },

  /**
   * Injects the needed collection.
   * @param {Object} collection The collection object to inject.
   */
  useCollection: function (collection) {
    if (!collection || !_.isObject(collection)) {
      var err = new Error('Please pass a valid collection!');
      debug(err);
      throw err;
    }

    this.collection = collection;
  },
  
  /**
   * Loads a viewModel object by id.
   * @param {String}   id       The viewModel id.
   * @param {Function} callback The function, that will be called when the this action is completed.
   *                            `function(err, vm){}` vm is of type Object
   */
  loadViewModel: function (id, callback) {
    if (this.isReplaying && this.replayingVms[id]) {
      return callback(null, this.replayingVms[id]);
    }
    
    this.collection.loadViewModel(id, callback);
  },

  /**
   * Save the passed viewModel object in the read model.
   * @param {Object}   vm       The viewModel object.
   * @param {Function} callback The function, that will be called when the this action is completed. [optional]
   *                            `function(err){}`
   */
  saveViewModel: function (vm, callback) {
    if (this.isReplaying) {
      this.replayingVms[vm.id] = vm;
      return callback(null);
    }
    
    this.collection.saveViewModel(vm, callback);
  },

  /**
   * Extracts the id from the passed event or generates a new one from read model.
   * @param {Object}   evt      The event object.
   * @param {Function} callback The function, that will be called when the this action is completed.
   *                            `function(err, id){}`
   */
  extractId: function (evt, callback) {
    if (this.id && dotty.exists(evt, this.id)) {
      debug('found viewmodel id in event');
      return callback(null, dotty.get(evt, this.id));
    }

    debug('not found viewmodel id in event, generate new id');
    this.collection.getNewId(callback);
  },

  /**
   * Generates a notification from event and viewModel.
   * @param {Object} evt The event object.
   * @param {Object} vm  The viewModel.
   * @returns {Object}
   */
  generateNotification: function (evt, vm) {
    var notification = {};

    // event
    if (!!this.definitions.notification.meta && !!this.definitions.event.meta) {
      dotty.put(notification, this.definitions.notification.meta, dotty.get(evt, this.definitions.event.meta));
    }
    if (!!this.definitions.notification.eventId && !!this.definitions.event.id) {
      dotty.put(notification, this.definitions.notification.eventId, dotty.get(evt, this.definitions.event.id));
    }
    if (!!this.definitions.notification.event && !!this.definitions.event.name) {
      dotty.put(notification, this.definitions.notification.event, dotty.get(evt, this.definitions.event.name));
    }
    if (!!this.definitions.notification.aggregateId && !!this.definitions.event.aggregateId) {
      dotty.put(notification, this.definitions.notification.aggregateId, dotty.get(evt, this.definitions.event.aggregateId));
    }
    if (!!this.definitions.notification.aggregate && !!this.definitions.event.aggregate) {
      dotty.put(notification, this.definitions.notification.aggregate, dotty.get(evt, this.definitions.event.aggregate));
    }
    if (!!this.definitions.notification.context && !!this.definitions.event.context) {
      dotty.put(notification, this.definitions.notification.context, dotty.get(evt, this.definitions.event.context));
    }
    if (!!this.definitions.notification.revision && !!this.definitions.event.revision) {
      dotty.put(notification, this.definitions.notification.revision, dotty.get(evt, this.definitions.event.revision));
    }
    dotty.put(notification, this.definitions.notification.correlationId, dotty.get(evt, this.definitions.event.correlationId));

    // vm
    dotty.put(notification, this.definitions.notification.payload, vm.toJSON());
    dotty.put(notification, this.definitions.notification.collection, this.collection.name);
    dotty.put(notification, this.definitions.notification.action, vm.actionOnCommit);
    
    return notification;
  },

  /**
   * Denormalizes an event.
   * @param {Object}   evt      The passed event.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, notification){}`
   */
  denormalize: function (evt, callback) {
    var self = this;
    this.extractId(evt, function (err, id) {
      if (err) {
        debug(err);
        return callback(err);
      }
      
      self.loadViewModel(id, function (err, vm) {
        if (err) {
          debug(err);
          return callback(err);
        }

        var payload = evt;

        if (self.payload && self.payload !== '') {
          payload = dotty.get(evt, self.payload);
        }
        
        debug('call denormalizer function');
        self.denormFn(_.cloneDeep(payload), vm);

        var notification = self.generateNotification(evt, vm);
        
        debug('generate new id for notification');
        self.getNewId(function (err, newId) {
          if (err) {
            debug(err);
            return callback(err);
          }
          
          dotty.put(notification, self.definitions.notification.id, newId);
          
          self.saveViewModel(vm, function (err) {
            if (err) {
              debug(err);

              if (err instanceof ConcurrencyError) {
                var retryIn = randomBetween(0, self.options.retryOnConcurrencyTimeout || 800);
                debug('retry in ' + retryIn + 'ms');
                setTimeout(function() {
                  self.denormalize(evt, callback);
                }, retryIn);
                return;
              }
              
              return callback(err);
            }

            callback(null, notification);
          });
        });
      });
    });
  },

  /**
   * Replays all passed events.
   * @param {Array}    evts     The passed array of events.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err){}`
   */
  replay: function (evts, callback) {
    var self = this;

    if (!evts || evts.length === 0) {
      return callback(null);
    }

    this.isReplaying = true;
    this.replayingVms = {};

    async.eachSeries(evts, function (evt, callback) {
      self.denormalize(evt, callback);
    }, function (err) {
      if (err) {
        debug(err);
        return callback(err);
      }

      var replVms = _.values(self.replayingVms);

      async.each(replVms, function (vm, callback) {
        self.collection.saveViewModel(vm, callback);
      }, function (err) {
        self.replayingVms = {};
        self.isReplaying = false;
        if (err) {
          debug(err);
        }
        callback(err);
      });
    });
  },

  /**
   * Replays in a streamed way.
   * @param {Function} fn The function that will be called with the replay function and the done function.
   *                      `function(replay, done){}`
   */
  replayStreamed: function (fn) {
    var self = this;

    var queue = [];

    this.isReplaying = true;
    this.replayingVms = {};
    
    var errs = [];
    
    var isHandling = false,
        doneCalled = false,
        doneClb = null;

    function replay (evt) {
      queue.push(evt);

      function handleNext () {
        if (queue.length > 0) {
          var e = queue.shift();
          self.denormalize(e, function (err) {
            if (err) {
              debug(err);
              errs.push(err);
            }
            
            handleNext();
          });
        } else {
          isHandling = false;
          if (doneCalled) {
            doneLater();
          }
        }
      }
      
      if (!isHandling) {
        isHandling = true;
        process.nextTick(handleNext);
      }
    }

    function done (callback) {
      if (queue.length > 0 || isHandling) {
        doneCalled = true;
        doneClb = callback;
        return;
      }

      var replVms = _.values(self.replayingVms);

      async.each(replVms, function (vm, callback) {
        self.collection.saveViewModel(vm, callback);
      }, function (err) {
        self.replayingVms = {};
        self.isReplaying = false;
        if (err) {
          debug(err);
        }
        callback(err);
      });
    }

    function doneLater() {
      if (doneCalled) {
        done(doneClb);
      }
    }

    fn(replay, done);
  }
  
});

module.exports = ViewBuilder;
