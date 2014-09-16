'use strict';

var debug = require('debug')('denormalizer:revisionGuard'),
  _ = require('lodash'),
  async = require('async'),
  Queue = require('./orderQueue'),
  ConcurrencyError = require('./concurrencyError'),
  dotty = require('dotty');

/**
 * RevisionGuard constructor
 * @param {Object} options The options object.
 * @constructor
 */
function RevisionGuard (store, options) {
  options = options || {};

  var defaults = {
    queueTimeout: 1000,
    queueTimeoutMaxLoops: 3,
    revisionStart: 1
  };
  
  _.defaults(options, defaults);
  
  this.options = options;
  
  this.store = store;

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
  
  queueEvent: function (aggId, evt, callback) {
    var self = this;
    var evtId = dotty.get(evt, this.definitions.event.id);
    var revInEvt = dotty.get(evt, this.definitions.event.revision);
    
    this.queue.push(aggId, evtId, evt, callback, function (loopCount, waitAgain) {
      self.store.get(aggId, function (err, revInStore) {
        if (err) {
          debug(err);
          self.store.remove(aggId, evtId);
          return callback(err);
        }

        if (revInEvt === revInStore) {
          self.finishGuard(evt, revInStore, callback);
          return;
        }

        if (loopCount < self.options.queueTimeoutMaxLoops) {
          return waitAgain();
        }
        
        debug('event timeouted');
        // try to replay depending from id and evt...
        var info = {
          aggregateId: aggId,
          aggregateRevision: !!self.definitions.event.revision ? dotty.get(evt, self.definitions.event.revision) : undefined,
          aggregate: !!self.definitions.event.aggregate ? dotty.get(evt, self.definitions.event.aggregate) : undefined,
          context: !!self.definitions.event.context ? dotty.get(evt, self.definitions.event.context) : undefined,
          guardRevision: revInStore
        };
        self.onEventMissingHandle(info, evt);
      });
    });
  },
  
  finishGuard: function (evt, revInStore, callback) {
    var aggId = dotty.get(evt, this.definitions.event.aggregateId);
    var evtId = dotty.get(evt, this.definitions.event.id);
    
    var self = this;
    
    this.store.set(aggId, (revInStore || 0) + 1, revInStore, function (err) {
      if (err) {
        debug(err);

        if (err instanceof ConcurrencyError) {
          var retryIn = randomBetween(0, self.options.retryOnConcurrencyTimeout || 800);
          debug('retry in ' + retryIn + 'ms');
          setTimeout(function() {
            self.guard(evt, callback);
          }, retryIn);
          return;
        }

        return callback(err);
      }

      self.queue.remove(aggId, evtId);
      callback(null);
      
      var pendingEvents = self.queue.get(aggId);
      if (!pendingEvents || pendingEvents.length === 0) return;

      var nextEvent = _.find(pendingEvents, function (e) {
        var revInEvt = dotty.get(e.payload, self.definitions.event.revision);
        return revInEvt === revInStore;
      });
      if (!nextEvent) return;

      self.guard(nextEvent.payload, nextEvent.callback);
    });
  },
  
  guard: function (evt, callback) {
    if (!this.definitions.event.aggregateId || !dotty.exists(evt, this.definitions.event.aggregateId) ||
        !this.definitions.event.revision || !dotty.exists(evt, this.definitions.event.revision)) {
      var err = new Error('Please define an aggregateId!');
      debug(err);
      return callback(err);
    }
    
    var self = this;
    
    var aggId = dotty.get(evt, this.definitions.event.aggregateId);
    var revInEvt = dotty.get(evt, this.definitions.event.revision);

    function proceed (revInStore) {
      if (!revInStore) {
        debug('first revision to store');
        callback(null, function (clb) {
          self.finishGuard(evt, revInStore, clb);
        });
        return;
      }
      
      if (revInEvt < revInStore) {
        debug('event already denormalized');
        callback(null, function (clb) {
          clb(null);
        });
        return;
      }
      
      if (revInEvt > revInStore) {
        debug('queue event');
        self.queueEvent(aggId, evt, callback);
        return;
      }

      callback(null, function (clb) {
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
          
          if (loop <= 0) {
            return proceed(revInStore);
          }

          if (!revInStore && revInEvt !== 1) {
            retry(max, --loop);
            return;
          }

          proceed(revInStore);
        });
      }, randomBetween(max / 5, max));
    }
    
    this.store.get(aggId, function (err, revInStore) {
      if (err) {
        debug(err);
        return callback(err);
      }
      
      if (!revInStore && revInEvt !== 1) {
        var max = (self.options.queueTimeout * self.options.queueTimeoutMaxLoops) / 3;
        max = max < 10 ? 10 : max;
        retry(max, self.options.guardTimeoutMaxLoops);
        return;
      }

      proceed(revInStore);
    });
  }

};

module.exports = RevisionGuard;

