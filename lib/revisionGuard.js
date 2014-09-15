'use strict';

var debug = require('debug')('denormalizer:revisionGuard'),
  _ = require('lodash'),
  async = require('async'),
  revisionGuardStore = require('./revisionGuardStore'),
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
  
  guard: function (evt, callback) {
    if (!this.definitions.event.aggregateId || !dotty.exists(evt, this.definitions.event.aggregateId) ||
        !this.definitions.event.revision || !dotty.exists(evt, this.definitions.event.revision)) {
      throw new Error('Please define an aggregateId!');
    }
    
    var self = this;
    
    var aggId = dotty.get(evt, this.definitions.event.aggregateId);
    var revInEvt = dotty.get(evt, this.definitions.event.revision);
    
    this.store.get(aggId, function(err, revInStore) {
      if (err) {
        debug(err);
        return callback(err);
      }

      function proceed(rev) {
        // make the checks...
        
        callback(null, function () {
          
          // update revision in store...
          
        });
      }

      function retry(max, loop) {
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

