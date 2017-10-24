'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  async = require('async'),
  dotty = require('dotty'),
  uuid = require('uuid').v4,
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
  this.payload = meta.payload === '' ? meta.payload : (meta.payload || null);
  this.aggregate = meta.aggregate || null;
  this.context = meta.context || null;
  this.id = meta.id || null;
  this.query = meta.query || null;
  this.autoCreate = meta.autoCreate === undefined || meta.autoCreate === null ? true : meta.autoCreate;
  this.priority = meta.priority || Infinity;

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

  if (denormFn.length === 2) {
    this.denormFn = function (evtData, vm, clb) {
      denormFn.call(this, evtData, vm);
      if (this.retryCalled) {
        return;
      }
      clb(null);
    };
  }

  var unwrappedDenormFn = this.denormFn;

  this.denormFn = function (evtData, vm, clb) {
    var wrappedCallback = function () {
      try {
        clb.apply(this, _.toArray(arguments));
      } catch (e) {
        debug(e);
        process.emit('uncaughtException', e);
      }
    };

    try {
      unwrappedDenormFn.call(this, evtData, vm, wrappedCallback.bind(this));
    } catch (e) {
      debug(e);
      process.emit('uncaughtException', e);
    }
  };

  this.idGenerator(function () {
    return uuid().toString();
  });

  this.defineShouldHandle(function (evt) {
    return true;
  });

  this.onAfterCommit(function (evt, vm) {});
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
    this.collection.loadViewModel(id, callback);
  },

  /**
   * Save the passed viewModel object in the read model.
   * @param {Object}   vm       The viewModel object.
   * @param {Function} callback The function, that will be called when the this action is completed. [optional]
   *                            `function(err){}`
   */
  saveViewModel: function (vm, callback) {
    this.collection.saveViewModel(vm, callback);
  },

  /**
   * Loads a viewModel array by optional query and query options.
   * @param {Object}   query        The query to find the viewModels. (mongodb style) [optional]
   * @param {Object}   queryOptions The query options. (mongodb style) [optional]
   * @param {Function} callback     The function, that will be called when the this action is completed.
   *                                `function(err, vms){}` vms is of type Array.
   */
  findViewModels: function (query, queryOptions, callback) {
    if (typeof query === 'function') {
      callback = query;
      query = {};
      queryOptions = {};
    }
    if (typeof queryOptions === 'function') {
      callback = queryOptions;
      queryOptions = {};
    }

    this.collection.findViewModels(query, queryOptions, callback);
  },

  /**
   * Extracts the id from the passed event or generates a new one from read model.
   * @param {Object}   evt      The event object.
   * @param {Function} callback The function, that will be called when the this action is completed.
   *                            `function(err, id){}`
   */
  extractId: function (evt, callback) {
    if (this.id && dotty.exists(evt, this.id)) {
      debug('[' + this.name + '] found viewmodel id in event');
      return callback(null, dotty.get(evt, this.id));
    }

    debug('[' + this.name + '] not found viewmodel id in event, generate new id');
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
      dotty.put(notification, this.definitions.notification.meta, _.cloneDeep(dotty.get(evt, this.definitions.event.meta)));
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
   * Handles denormalization for 1 viewmodel.
   * @param {Object}   vm         The viewModel.
   * @param {Object}   evt        The passed event.
   * @param {Object}   initValues The vm init values. [optional]
   * @param {Function} callback   The function, that will be called when this action is completed.
   *                              `function(err, notification){}`
   */
  handleOne: function (vm, evt, initValues, callback) {
    var self = this;

    if (!callback) {
      callback = initValues;
      initValues = null;
    }

    var payload = evt;

    if (this.payload && this.payload !== '') {
      payload = dotty.get(evt, this.payload);
    }

    if (initValues) {
      vm.set(_.cloneDeep(initValues));
    }

    var evtId = dotty.get(evt, this.definitions.event.id);

    var debugOutPut = evtId ? (', [eventId]=' + evtId) : '';
    debug('[' + this.name + ']' + debugOutPut + ' call denormalizer function');

    function retry (retryIn) {
      if (self.collection.isReplaying) {
        var debugMsg = '[' + self.name + ']' + debugOutPut + ' finishing denormalization because is replaying!';
        debug(debugMsg);
        console.log(debugMsg);
        return callback(null);
      }

      if (_.isNumber(retryIn)) {
        retryIn = randomBetween(0, retryIn);
      }

      if (_.isObject(retryIn) && _.isNumber(retryIn.from) && _.isNumber(retryIn.to)) {
        retryIn = randomBetween(retryIn.from, retryIn.to);
      }

      if (!_.isNumber(retryIn) || retryIn === 0) {
        retryIn = randomBetween(0, self.options.retryOnConcurrencyTimeout || 800);
      }

      debug('[' + self.name + ']' + debugOutPut + ' retry in ' + retryIn + 'ms');
      setTimeout(function() {
        self.loadViewModel(vm.id, function (err, vm) {
          if (err) {
            debug(err);
            return callback(err);
          }

          self.handleOne(vm, evt, initValues, callback);
        });
      }, retryIn);
    }

    var shouldBeHandled = function (cb) {
      if (self.shouldHandleRequestsOnlyEvent) return cb(null, true);
      self.shouldHandle(evt, vm, cb);
    };

    shouldBeHandled(function (err, doHandle) {
      if (err) {
        return callback(err);
      }

      if (!doHandle) {
        return callback(null, null);
      }

      var denormThis = {
        retryCalled: false,

        retry: function () {
          denormThis.retryCalled = true;

          if (arguments.length === 0) {
            return retry();
          }

          if (arguments.length === 1) {
            if (!_.isFunction(arguments[0])) {
              return retry(arguments[0]);
            }
            return retry();
          }

          retry(arguments[0]);
        },

        toRemember: null,

        remindMe: function (memories) {
          denormThis.toRemember = memories;
        },

        getReminder: function (memories) {
          return denormThis.toRemember;
        }
      };

      self.denormFn.call(denormThis, _.cloneDeep(payload), vm, function (err) {
        if (err) {
          debug(err);
          return callback(err);
        }

        var notification = self.generateNotification(evt, vm);

        debug('[' + self.name + ']' + debugOutPut + ' generate new id for notification');
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
                retry(callback);
                return;
              }

              return callback(err);
            }

            if (!self.options.callOnAfterCommitDuringReplay && self.collection.isReplaying) {
              return callback(null, notification);
            }

            self.handleAfterCommit.call(denormThis, evt, vm, function (err) {
              if (err) {
                debug(err);
                return callback(err);
              }
              callback(null, notification);
            });
          });
        });
      });
    });
  },

  /**
   * Handles denormalization with a query instead of an id.
   * @param {Object}   evt      The event object.
   * @param {Object}   query    The query object.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, notification){}`
   */
  handleQuery: function (evt, query, callback) {
    var self = this;
    this.findViewModels(query, function (err, vms) {
      if (err) {
        debug(err);
        return callback(err);
      }

      async.map(vms, function (vm, callback) {
        self.handleOne(vm, evt, function (err, notification) {
          if (err) {
            debug(err);
            return callback(err);
          }

          callback(null, notification);
        });
      }, function (err, notifications) {
        if (err) {
          debug(err);
          return callback(err);
        }

        notifications = _.filter(notifications, function (n) {
          return !!n;
        });

        callback(null, notifications);
      });
    });
  },

  /**
   * Denormalizes an event for each item passed in executeForEach function.
   * @param {Object}   evt      The passed event.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, notifications){}`
   */
  denormalizeForEach: function (evt, callback) {
    var self = this;

    this.executeDenormFnForEach(evt, function (err, res) {
      if (err) {
        debug(err);
        return callback(err);
      }

      async.each(res, function (item, callback) {
        if (item.id) {
          return callback(null);
        }
        self.collection.getNewId(function (err, newId) {
          if (err) {
            return callback(err);
          }
          item.id = newId;
          callback(null);
        });
      }, function (err) {
        if (err) {
          debug(err);
          return callback(err);
        }

        async.map(res, function (item, callback) {
          self.loadViewModel(item.id, function (err, vm) {
            if (err) {
              return callback(err);
            }

            self.handleOne(vm, evt, item, function (err, notification) {
              if (err) {
                return callback(err);
              }

              callback(null, notification);
            });
          });
        }, function (err, notis) {
          if (err) {
            debug(err);
            return callback(err);
          }

          callback(null, notis);
        });
      });
    });
  },

  /**
   * Denormalizes an event.
   * @param {Object}   evt      The passed event.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, notifications){}`
   */
  denormalize: function (evt, callback) {
    var self = this;

    function denorm() {
      if (self.executeDenormFnForEach) {
        return self.denormalizeForEach(evt, callback);
      }

      if (self.query) {
        return self.handleQuery(evt, self.query, callback);
      }

      if (!self.query && self.getQueryForThisViewBuilder) {
        self.getQueryForThisViewBuilder(evt, function (err, query) {
          if (err) {
            debug(err);
            return callback(err);
          }
          self.handleQuery(evt, query, callback);
        });
        return;
      }

      self.extractId(evt, function (err, id) {
        if (err) {
          debug(err);
          return callback(err);
        }

        self.loadViewModel(id, function (err, vm) {
          if (err) {
            debug(err);
            return callback(err);
          }

          if (vm.actionOnCommit === 'create' && !self.autoCreate) {
            return callback(null, []);
          }

          self.handleOne(vm, evt, function (err, notification) {
            if (err) {
              debug(err);
              return callback(err);
            }

            var notis = [];
            if (notification) {
              notis.push(notification);
            }

            callback(null, notis);
          });
        });
      });
    }

    if (this.shouldHandleRequestsOnlyEvent) {
      this.shouldHandle(evt, null, function (err, doHandle) {
        if (err) {
          return callback(err);
        }

        if (!doHandle) {
          return callback(null, []);
        }

        denorm();
      });
    } else {
      denorm();
    }
  },

  /**
   * Inject useAsQuery function if no query and no id found.
   * @param   {Function}  fn      The function to be injected.
   * @returns {ViewBuilder} to be able to chain...
   */
  useAsQuery: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 2) {
      this.getQueryForThisViewBuilder = fn;
      return this;
    }

    this.getQueryForThisViewBuilder = function (evt, callback) {
      callback(null, fn(evt));
    };

    var unwrappedFn = this.getQueryForThisViewBuilder;

    this.getQueryForThisViewBuilder = function (evt, clb) {
      var wrappedCallback = function () {
        try {
          clb.apply(this, _.toArray(arguments));
        } catch (e) {
          debug(e);
          process.emit('uncaughtException', e);
        }
      };

      try {
        unwrappedFn.call(this, evt, wrappedCallback);
      } catch (e) {
        debug(e);
        process.emit('uncaughtException', e);
      }
    };

    return this;
  },

  /**
   * Inject executeForEach function that will execute denormFn for all resulting objects.
   * @param   {Function}  fn      The function to be injected.
   * @returns {ViewBuilder} to be able to chain...
   */
  executeForEach: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 2) {
      this.executeDenormFnForEach = fn;
      return this;
    }

    this.executeDenormFnForEach = function (evt, callback) {
      callback(null, fn(evt));
    };

    var unwrappedFn = this.executeDenormFnForEach;

    this.executeDenormFnForEach = function (evt, clb) {
      var wrappedCallback = function () {
        try {
          clb.apply(this, _.toArray(arguments));
        } catch (e) {
          debug(e);
          process.emit('uncaughtException', e);
        }
      };

      try {
        unwrappedFn.call(this, evt, wrappedCallback);
      } catch (e) {
        debug(e);
        process.emit('uncaughtException', e);
      }
    };

    return this;
  },

  /**
   * Inject shouldHandle function.
   * @param   {Function}  fn      The function to be injected.
   * @returns {ViewBuilder} to be able to chain...
   */
  defineShouldHandle: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    this.shouldHandleRequestsOnlyEvent = fn.length === 1;

    if (fn.length === 3) {
      this.shouldHandle = fn;
      return this;
    }

    this.shouldHandle = function (evt, vm, callback) {
      callback(null, fn(evt, vm));
    };

    var unwrappedShouldHandle = this.shouldHandle;

    var self = this;

    this.shouldHandle = function (evt, vm, clb) {
      var wrappedCallback = function () {
        try {
          clb.apply(self, _.toArray(arguments));
        } catch (e) {
          debug(e);
          process.emit('uncaughtException', e);
        }
      };

      try {
        unwrappedShouldHandle.call(self, evt, vm, wrappedCallback);
      } catch (e) {
        debug(e);
        process.emit('uncaughtException', e);
      }
    };

    return this;
  },

  /**
   * Inject onAfterCommit function.
   * @param   {Function}  fn      The function to be injected.
   * @returns {ViewBuilder} to be able to chain...
   */
  onAfterCommit: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 3) {
      this.handleAfterCommit = fn;
      return this;
    }

    this.handleAfterCommit = function (evt, vm, callback) {
      callback(null, fn(evt, vm));
    };

    var unwrappedHandleAfterCommit = this.handleAfterCommit;

    this.handleAfterCommit = function (evt, vm, clb) {
      var wrappedCallback = function () {
        try {
          clb.apply(this, _.toArray(arguments));
        } catch (e) {
          debug(e);
          process.emit('uncaughtException', e);
        }
      };

      try {
        unwrappedHandleAfterCommit.call(this, evt, vm, wrappedCallback);
      } catch (e) {
        debug(e);
        process.emit('uncaughtException', e);
      }
    };

    return this;
  }

});

module.exports = ViewBuilder;
