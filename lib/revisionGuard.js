'use strict';

var debug = require('debug')('denormalizer:revisionGuard'),
  _ = require('lodash'),
  async = require('async'),
  revisionGuardStore = require('./revisionGuardStore'),
  Queue = require('./orderQueue'),
  dotty = require('dotty');

/**
 * RevisionGuard constructor
 * @param {Object} options The options object.
 * @constructor
 */
function RevisionGuard (options) {
  options = options || {};

  var defaults = {
    queueTimeout: 1000,
    queueTimeoutMaxLoops: 3,
    revisionStart: 1
  };
  
  _.defaults(options, defaults);
  
  this.options = options;
  
  this.store = revisionGuardStore.create(options);

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
//      eventName: 'meta.event.name',        // optional, if defined theses values will be copied from the event
//      meta: 'meta'                         // optional, if defined theses values will be copied from the event (can be used to transport information like userId, etc..)
    }
  };

  this.queue = new Queue({ queueTimeout: this.options.queueTimeout });

  this.onEventMissing(function (info, evt) {
    debug('missing events: ', info, evt);
  });
}

/**
 * Returns a random number between passed values of min and max.
 * @param {Number} min The minimum value of the resulting random number.
 * @param {Number} max The maximum value of the resulting random number.
 * @returns {Number}
 */
function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

RevisionGuard.prototype = {

  /**
   * Inject definition for notification structure.
   * @param   {Object} definition the definition to be injected
   */
  defineNotification: function (definition) {
    if (!_.isObject(definition)) {
      throw new Error('Please pass in an object');
    }
    this.definitions.notification = _.defaults(definition, this.definitions.notification);
  },
  
  /**
   * Inject definition for event structure.
   * @param   {Object} definition the definition to be injected
   */
  defineEvent: function (definition) {
    if (!_.isObject(definition)) {
      throw new Error('Please pass in an object');
    }
    this.definitions.event = _.defaults(definition, this.definitions.event);
    return this;
  },

  /**
   * Inject function for event missing handle.
   * @param   {Function} fn       the function to be injected
   * @returns {RevisionGuard} to be able to chain...
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
  
  queueEvent: function (aggId, evt) {
    var self = this;
    this.queue.push(aggId, evt, function (loopCount, waitAgain) {
      self.retryGuard(evt, function(wouldQueue, revInStore) {
        if (wouldQueue) {
          if (loopCount < self.options.queueTimeoutMaxLoops) {
            return waitAgain();
          }
          // try to replay depending from id and evt...
          var info = {
            aggregateId: aggId,
            aggregateRevision: !!self.definitions.event.revision ? dotty.get(evt, self.definitions.event.revision) : undefined,
            aggregate: !!self.definitions.event.aggregate ? dotty.get(evt, self.definitions.event.aggregate) : undefined,
            context: !!self.definitions.event.context ? dotty.get(evt, self.definitions.event.context) : undefined,
            guardRevision: revInStore
          };
          self.onEventMissingHandle(info, evt);
        }
      });
    });
  },

  retryGuard: function (evt, callback) {
    var aggId = dotty.get(evt, this.definitions.event.aggregateId);
    var revInEvt = dotty.get(evt, this.definitions.event.revision);
    
    var self = this;
    
    this.store.get(aggId, function (err, revInStore) {
      
      if (revInEvt > revInStore) {
        return callback(true, revInStore);
      }

      self.finishGuard(evt, revInStore, callback);
    });
  },
  
  finishGuard: function (evt, revInStore, callback) {
    var aggId = dotty.get(evt, this.definitions.event.aggregateId);
    var self = this;
    this.store.set(aggId, revInStore + 1, revInStore, function (err) {
      if (err) {
        debug(err);

        if (err && err.name === 'ConcurrencyError') {
          var retryIn = randomBetween(0, self.options.retryOnConcurrencyTimeout || 800);
          debug('retry in ' + retryIn + 'ms');
          setTimeout(function() {
            self.retryGuard(evt, callback);
          }, retryIn);
          return;
        }

        return callback(err);
      }

      var pendingEvents = self.queue.get(aggId);
      if (!pendingEvents) return callback(null);

      var nextEvent = _.find(pendingEvents, function(e) {
        var revInEvt = dotty.get(e, self.definitions.event.revision);
        return revInEvt === revInStore;
      });
      if (!nextEvent) return callback(null);

      self.queue.remove(aggId, evt);
      self.guard(nextEvent); // guard event
    });
  },
  
  guard: function (evt, callback) {
    if (!this.definitions.event.aggregateId || !dotty.exists(evt, this.definitions.event.aggregateId) ||
        !this.definitions.event.revision || !dotty.exists(evt, this.definitions.event.revision)) {
      throw new Error('Please define an aggregateId!');
    }
    
    var self = this;
    
    var aggId = dotty.get(evt, this.definitions.event.aggregateId);
    var revInEvt = dotty.get(evt, this.definitions.event.revision);

    function proceed (revInStore) {
      if (revInEvt < revInStore) {
        debug('event already denormalized');
      } else if (revInEvt > revInStore) {
        debug('queue event');
        self.queueEvent(aggId ,evt);
      }

      callback(null, function (clb) {
        // update revision in store...
        self.finishGuard(evt, revInStore, clb);
      });
    }

    function retry (max, loop) {
      setTimeout(function () {
        self.store.get(aggId, function(err, revInStore) {
          if (err) {
            debug(err);
            return callback(err);
          }

          if ((revInStore || revInEvt === 1) || (loop <= 0)) {
            return proceed(revInStore);
          }
          retry(max, --loop);
        });
      }, randomBetween(max / 5, max));
    }
    
    this.store.get(aggId, function (err, revInStore) {
      if (err) {
        debug(err);
        return callback(err);
      }
      
      if (revInStore || revInEvt === 1) {
        return proceed(revInStore);
      }

      var max = (self.options.queueTimeout * self.options.queueTimeoutMaxLoops) / 3;
      if (max < 10) {
        max = 10;
      }
      retry(max, self.options.guardTimeoutMaxLoops);
    });
  }

};

module.exports = RevisionGuard;

