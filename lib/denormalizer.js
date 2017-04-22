'use strict';

var debug = require('debug')('denormalizer'),
  async = require('async'),
  dotty = require('dotty'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  uuid = require('uuid').v4,
  structureLoader = require('./structure/structureLoader'),
  attachLookupFunctions = require('./structure/treeExtender'),
  EventDispatcher = require('./eventDispatcher'),
  ReplayHandler = require('./replayHandler'),
  RevisionGuard = require('./revisionGuard'),
  revisionGuardStore = require('./revisionGuardStore'),
  viewmodel = require('viewmodel');

/**
 * Denormalizer constructor
 * @param {Object} options The options.
 * @constructor
 */
function Denormalizer(options) {
  EventEmitter.call(this);

  options = options || {};

  if (!options.denormalizerPath) {
    var err = new Error('Please provide denormalizerPath in options');
    debug(err);
    throw err;
  }

  var defaults = {
    retryOnConcurrencyTimeout: 800,
    commandRejectedEventName: 'commandRejected',
    callOnAfterCommitDuringReplay: false
  };

  _.defaults(options, defaults);

  this.repository = viewmodel.write(options.repository);

  var defaultRevOpt = {
    queueTimeout: 1000,
    queueTimeoutMaxLoops: 3//,
    // startRevisionNumber: 1
  };

  options.revisionGuard = options.revisionGuard || {};

  _.defaults(options.revisionGuard, defaultRevOpt);

  this.revisionGuardStore = revisionGuardStore.create(options.revisionGuard);

  this.options = options;

  this.definitions = {
    event: {
      correlationId: 'correlationId', // optional
      id: 'id',                       // optional
      name: 'name',                   // optional
//      aggregateId: 'aggregate.id',    // optional
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
      payload: 'payload'              // optional
//      revision: 'revision'            // optional
//      version: 'version',             // optional
//      meta: 'meta'                    // optional, if defined theses values will be copied to the notification (can be used to transport information like userId, etc..)
    },
    notification: {
      correlationId: 'correlationId',      // optional, the command Id
      id: 'id',                            // optional
      action: 'name',                      // optional
      collection: 'collection',            // optional
      payload: 'payload'                   // optional
//      context: 'meta.context.name',        // optional, if defined theses values will be copied from the event
//      aggregate: 'meta.aggregate.name',    // optional, if defined theses values will be copied from the event
//      aggregateId: 'meta.aggregate.id',    // optional, if defined theses values will be copied from the event
//      revision: 'meta.aggregate.revision', // optional, if defined theses values will be copied from the event
//      eventId: 'meta.event.id',            // optional, if defined theses values will be copied from the event
//      event: 'meta.event.name',            // optional, if defined theses values will be copied from the event
//      meta: 'meta'                         // optional, if defined theses values will be copied from the event (can be used to transport information like userId, etc..)
    }
  };

  this.idGenerator(function () {
    return uuid().toString();
  });

  this.onEvent(function (evt) {
    debug('emit event:', evt);
  });

  this.onNotification(function (noti) {
    debug('emit notification:', noti);
  });

  this.onEventMissing(function (info, evt) {
    debug('missing events: ', info, evt);
  });

  this.defaultEventExtension(function (evt) {
    return evt;
  });
}

util.inherits(Denormalizer, EventEmitter);

_.extend(Denormalizer.prototype, {

  /**
   * Inject definition for event structure.
   * @param   {Object} definition the definition to be injected
   * @returns {Denormalizer} to be able to chain...
   */
  defineEvent: function (definition) {
    if (!definition || !_.isObject(definition)) {
      var err = new Error('Please pass a valid definition!');
      debug(err);
      throw err;
    }

    this.definitions.event = _.defaults(definition, this.definitions.event);
    return this;
  },

  /**
   * Inject definition for notification structure.
   * @param   {Object} definition the definition to be injected
   * @returns {Denormalizer} to be able to chain...
   */
  defineNotification: function (definition) {
    if (!definition || !_.isObject(definition)) {
      var err = new Error('Please pass a valid definition!');
      debug(err);
      throw err;
    }

    this.definitions.notification = _.defaults(definition, this.definitions.notification);
    return this;
  },

  /**
   * Inject idGenerator function.
   * @param   {Function}  fn      The function to be injected.
   * @returns {Denormalizer} to be able to chain...
   */
  idGenerator: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 1) {
      this.getNewId = fn;
      return this;
    }

    this.getNewId = function (callback) {
      callback(null, fn());
    };

    return this;
  },

  /**
   * Inject function for event notification.
   * @param   {Function} fn       the function to be injected
   * @returns {Denormalizer} to be able to chain...
   */
  onEvent: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 1) {
      fn = _.wrap(fn, function(func, evt, callback) {
        func(evt);
        callback(null);
      });
    }

    this.onEventHandle = fn;

    return this;
  },

  /**
   * Inject function for data notification.
   * @param   {Function} fn       the function to be injected
   * @returns {Denormalizer} to be able to chain...
   */
  onNotification: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 1) {
      fn = _.wrap(fn, function(func, evt, callback) {
        func(evt);
        callback(null);
      });
    }

    this.onNotificationHandle = fn;

    return this;
  },

  /**
   * Inject function for event missing handle.
   * @param   {Function} fn       the function to be injected
   * @returns {Denormalizer} to be able to chain...
   */
  onEventMissing: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    this.onEventMissingHandle = fn;

    return this;
  },

  /**
   * Inject default event extension function.
   * @param   {Function}  fn      The function to be injected.
   * @returns {Denormalizer} to be able to chain...
   */
  defaultEventExtension: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 1) {
      fn = _.wrap(fn, function(func, evt, callback) {
        callback(null, func(evt));
      });
    }

    this.extendEventHandle = fn;

    return this;
  },

  /**
   * Call this function to initialize the denormalizer.
   * @param {Function} callback the function that will be called when this action has finished [optional]
   *                            `function(err){}`
   */
  init: function (callback) {

    var self = this;

    var warnings = null;

    async.series([
      // load domain files...
      function (callback) {
        debug('load denormalizer files..');
        structureLoader(self.options.denormalizerPath, function (err, tree, warns) {
          if (err) {
            return callback(err);
          }
          warnings = warns;
          self.tree = attachLookupFunctions(tree);
          callback(null);
        });
      },

      // prepare infrastructure...
      function (callback) {
        debug('prepare infrastructure...');
        async.parallel([

          // prepare repository...
          function (callback) {
            debug('prepare repository...');

            self.repository.on('connect', function () {
              self.emit('connect');
            });

            self.repository.on('disconnect', function () {
              self.emit('disconnect');
            });

            self.repository.connect(callback);
          },

          // prepare revisionGuard...
          function (callback) {
            debug('prepare revisionGuard...');

            self.revisionGuardStore.on('connect', function () {
              self.emit('connect');
            });

            self.revisionGuardStore.on('disconnect', function () {
              self.emit('disconnect');
            });

            self.revisionGuardStore.connect(callback);
          }
        ], callback);
      },

      // inject all needed dependencies...
      function (callback) {
        debug('inject all needed dependencies...');

        self.revisionGuard = new RevisionGuard(self.revisionGuardStore, self.options.revisionGuard);
        self.revisionGuard.onEventMissing(function (info, evt) {
          self.onEventMissingHandle(info, evt);
        });

        self.eventDispatcher = new EventDispatcher(self.tree, self.definitions.event);
        self.tree.defineOptions(self.options)
          .defineEvent(self.definitions.event)
          .defineNotification(self.definitions.notification)
          .idGenerator(self.getNewId)
          .useRepository(self.repository);

        self.revisionGuard.defineEvent(self.definitions.event);

        self.replayHandler = new ReplayHandler(self.eventDispatcher, self.revisionGuardStore, self.definitions.event, self.options);

        callback(null);
      }
    ], function (err) {
      if (err) {
        debug(err);
      }
      if (callback) { callback(err, warnings); }
    });
  },

  /**
   * Returns the denormalizer information.
   * @returns {Object}
   */
  getInfo: function () {
    if (!this.tree) {
      var err = new Error('Not initialized!');
      debug(err);
      throw err;
    }

    return this.tree.getInfo();
  },

  /**
   * Call this function to extend the passed event.
   * @param {Object}   evt      The event object
   * @param {Function} callback The function that will be called when this action has finished [optional]
   *                            `function(errs, extendedEvent){}`
   */
  extendEvent: function (evt, callback) {
    var self = this;

    var extendedEvent = evt;

    this.extendEventHandle(evt, function (err, extEvt) {
      if (err) {
        debug(err);
      }

      extendedEvent = extEvt || extendedEvent;

      var eventExtender = self.tree.getEventExtender(self.eventDispatcher.getTargetInformation(evt));

      if (!eventExtender) {
        return callback(err, extendedEvent);
      }

      eventExtender.extend(extendedEvent, function (err, extEvt) {
        if (err) {
          debug(err);
        }
        extendedEvent = extEvt || extendedEvent;
        callback(err, extendedEvent);
      });

    });
  },

  /**
   * Call this function to pre extend the passed event.
   * @param {Object}   evt      The event object
   * @param {Function} callback The function that will be called when this action has finished [optional]
   *                            `function(errs, preExtendedEvent){}`
   */
  preExtendEvent: function (evt, callback) {
    var self = this;

    var extendedEvent = evt;

    var eventExtender = self.tree.getPreEventExtender(self.eventDispatcher.getTargetInformation(evt));

    if (!eventExtender) {
      return callback(null, extendedEvent);
    }

    eventExtender.extend(extendedEvent, function (err, extEvt) {
      if (err) {
        debug(err);
      }
      extendedEvent = extEvt || extendedEvent;
      callback(err, extendedEvent);
    });
  },

  /**
   * Returns true if the passed event is a command rejected event. Callbacks on its own!
   * @param {Object}   evt      The event object
   * @param {Function} callback The function that will be called when this action has finished [optional]
   *                            `function(errs, evt, notifications){}` notifications is of type Array
   * @returns {boolean}
   */
  isCommandRejected: function (evt, callback) {
    if (!evt || !_.isObject(evt)) {
      var err = new Error('Please pass a valid event!');
      debug(err);
      throw err;
    }

    var res = false;

    var self = this;

    var evtName = dotty.get(evt, this.definitions.event.name);
    var evtPayload = dotty.get(evt, this.definitions.event.payload);

    if (evtName === this.options.commandRejectedEventName &&
      evtPayload && evtPayload.reason &&
      evtPayload.reason.name === 'AggregateDestroyedError') {

      res = true;

      var info = {
        aggregateId: evtPayload.reason.aggregateId,
        aggregateRevision: evtPayload.reason.aggregateRevision,
        aggregate: !!this.definitions.event.aggregate ? dotty.get(evt, this.definitions.event.aggregate) : undefined,
        context: !!this.definitions.event.context ? dotty.get(evt, this.definitions.event.context) : undefined
      };

      if (!this.definitions.event.revision || !dotty.exists(evt, this.definitions.event.revision)) {
        this.onEventMissingHandle(info, evt);
        if (callback) {
          callback(null, evt, []);
        }
        return res;
      }

      this.revisionGuardStore.get(evtPayload.reason.aggregateId, function (err, rev) {
        if (err) {
          debug(err);
          if (callback) {
            callback([err])
          }
          return;
        }

        debug('revision in store is "' + rev + '" but domain says: "' + evtPayload.reason.aggregateRevision + '"')
        if (rev - 1 < evtPayload.reason.aggregateRevision) {
          info.guardRevision = rev;
          self.onEventMissingHandle(info, evt);
        } else if (rev - 1 > evtPayload.reason.aggregateRevision) {
          debug('strange: revision in store greater than revision in domain, replay?')
        }

        if (callback) {
          callback(null, evt, []);
        }
      });
      return res;
    }

    return res;
  },

  /**
   * Call this function to forward it to the dispatcher.
   * @param {Object}   evt      The event object
   * @param {Function} callback The function that will be called when this action has finished [optional]
   *                            `function(errs, evt, notifications){}` notifications is of type Array
   */
  dispatch: function (evt, callback) {
    var self = this;

    this.preExtendEvent(evt, function (err, preExtEvt) {
      evt = preExtEvt || evt;;

      if (err) {
        debug(err);
        if (callback) callback([errs], evt, []);
        return;
      }

      self.eventDispatcher.dispatch(evt, function (errs, notifications) {

        var extendedEvent;

        notifications = notifications || [];

        async.series([

          function (callback) {
            self.extendEvent(evt, function (err, extEvt) {
              extendedEvent = extEvt;
              callback(err);
            });
          },

          function (callback) {
            async.parallel([

              function (callback) {
                async.each(notifications, function (n, callback) {
                  if (self.onNotificationHandle) {
                    debug('publish a notification');
                    self.onNotificationHandle(n, function (err) {
                      if (err) {
                        debug(err);
                      }
                      callback(err);
                    });
                  } else {
                    callback(null);
                  }

                }, callback);
              },

              function (callback) {
                if (self.onEventHandle) {
                  debug('publish an event');
                  self.onEventHandle(extendedEvent, function (err) {
                    if (err) {
                      debug(err);
                    }
                    callback(err);
                  });
                } else {
                  callback(null);
                }
              }
            ], callback);
          }
        ], function (err) {
          if (err) {
            if (!errs) {
              errs = [err];
            } else if (_.isArray(errs)) {
              errs.unshift(err);
            }
            debug(err);
          }
          if (callback) {
            callback(errs, extendedEvent, notifications);
          }
        });
      });
    });
  },

  /**
   * Call this function to let the denormalizer handle it.
   * @param {Object}   evt      The event object
   * @param {Function} callback The function that will be called when this action has finished [optional]
   *                            `function(errs, evt, notifications){}` notifications is of type Array
   */
  handle: function (evt, callback) {
    if (!evt || !_.isObject(evt) || !dotty.exists(evt, this.definitions.event.name)) {
      var err = new Error('Please pass a valid event!');
      debug(err);
      if (callback) callback([err]);
      return;
    }

    var self = this;

    if (this.isCommandRejected(evt, callback)) {
      return;
    }

    var workWithRevisionGuard = false;
    if (!!this.definitions.event.revision && dotty.exists(evt, this.definitions.event.revision) &&
        !!this.definitions.event.aggregateId && dotty.exists(evt, this.definitions.event.aggregateId)) {
      workWithRevisionGuard = true;
    }

    if (dotty.get(evt, this.definitions.event.name) === this.options.commandRejectedEventName) {
      workWithRevisionGuard = false;
    }

    if (!workWithRevisionGuard) {
      return this.dispatch(evt, callback);
    }

    this.revisionGuard.guard(evt, function (err, done) {
      if (err) {
        debug(err);
        if (callback) {
          try {
            callback([err]);
          } catch (e) {
            debug(e);
            process.emit('uncaughtException', e);
          }
        }
        return;
      }

      self.dispatch(evt, function (errs, extendedEvt, notifications) {
        if (errs) {
          debug(errs);
          if (callback) {
            try {
              callback(errs, extendedEvt, notifications);
            } catch (e) {
              debug(e);
              process.emit('uncaughtException', e);
            }
          }
          return;
        }

        done(function (err) {
          if (err) {
            if (!errs) {
              errs = [err];
            } else if (_.isArray(errs)) {
              errs.unshift(err);
            }
            debug(err);
          }

          if (callback) {
            try {
              callback(errs, extendedEvt, notifications);
            } catch (e) {
              debug(e);
              process.emit('uncaughtException', e);
            }
          }
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
    this.replayHandler.replay(evts, callback);
  },

  /**
   * Replays in a streamed way.
   * @param {Function} fn The function that will be called with the replay function and the done function.
   *                      `function(replay, done){}`
   */
  replayStreamed: function (fn) {
    this.replayHandler.replayStreamed(fn);
  },

  /**
   * Gets the last event.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, evt){}` evt is of type Object.
   */
  getLastEvent: function (callback) {
    this.revisionGuardStore.getLastEvent(callback);
  },

  /**
   * Clears all collections and the revisionGuardStore.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err){}`
   */
  clear: function (callback) {
    this.revisionGuard.currentHandlingRevisions = {};
    this.replayHandler.clear(callback);
  }

});

module.exports = Denormalizer;
