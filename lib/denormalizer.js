'use strict';

var debug = require('debug')('denormalizer'),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  EventDispatcher = require('./eventDispatcher'),
  uuid = require('node-uuid').v4,
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

  options.retryOnConcurrencyTimeout = options.retryOnConcurrencyTimeout || 800;

  this.repository = viewmodel.write(options.repository);

//  this.revisionGuard = revisionGuard.create(options.revisionGuard);

  this.options = options;

  this.definitions = {
    event: {
      correlationId: 'correlationId', // optional
      id: 'id',                       // optional
      name: 'name'                    // optional
//      aggregateId: 'aggregate.id',    // optional     TODO: think about aggregateDestroyed event!!!
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
////      payload: 'payload',             // optional
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
//      eventName: 'meta.event.name',        // optional, if defined theses values will be copied from the event
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

    if (fn.length === 1) {
      fn = _.wrap(fn, function(func, info, evt, callback) {
        func(info, evt);
        callback(null);
      });
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
        func(evt);
        callback(null);
      });
    }

    this.extendEvent = fn;

    return this;
  },

  /**
   * Call this function to initialize the denormalizer.
   * @param {Function} callback the function that will be called when this action has finished [optional]
   *                            `function(err){}`
   */
  init: function (callback) {

    var self = this;

    async.series([
      // load domain files...
      function (callback) {
        debug('load denormalizer files..');
        structureLoader(self.options.denormalizerPath, function (err, tree) {
          if (err) {
            return callback(err);
          }
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

            self.revisionGuard.on('connect', function () {
              self.emit('connect');
            });

            self.revisionGuard.on('disconnect', function () {
              self.emit('disconnect');
            });

            self.revisionGuard.connect(callback);
          }
        ], callback);
      },

      // inject all needed dependencies...
      function (callback) {
        debug('inject all needed dependencies...');

        self.eventDispatcher = new EventDispatcher(self.tree, self.definitions.event);
        self.tree.defineOptions(self.options)
          .defineEvent(self.definitions.event)
          .defineNotification(self.definitions.notification)
          .idGenerator(self.getNewId)
          .useRepository(self.repository);

        callback(null);
      }
    ], function (err) {
      if (err) {
        debug(err);
      }
      if (callback) { callback(err); }
    });
  },

  /**
   * Call this function to let the denormalizer handle it.
   * @param {Object}   evt      The event object
   * @param {Function} callback The function that will be called when this action has finished [optional]
   *                            `function(errs, evt, notifications){}` notifications is of type Array
   */
  handle: function (evt, callback) {
    if (!evt || !_.isObject(evt)) {
      var err = new Error('Please pass a valid event!');
      debug(err);
      throw err;
    }

    var self = this;

    this.eventDispatcher.dispatch(evt, function (errs, evt, notifications) {
      
      var extendedEvent;
      
      async.series([
        
        function (callback) {
          self.extendEvent(evt, function (extEvt) {
            extendedEvent = extEvt;
            
            var eventExtender = self.tree.getEventExtender(self.eventDispatcher.getTargetInformation(evt));

            if (!eventExtender) {
              return callback(null);
            }
            
            eventExtender.extend(extendedEvent, function (extEvt) {
              extendedEvent = extEvt;
              callback(null);
            });

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
  },

  replay: function(evts, callback) {
    
  },

  replayStreamed: function(fn) {
    
  }
  
});

module.exports = Denormalizer;
