'use strict';

var debug = require('debug')('denormalizer'),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  uuid = require('node-uuid').v4,
  dotty = require('dotty');

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

//  this.eventStore = eventstore(options.eventStore);
//
//  this.aggregateLock = aggregatelock.create(options.aggregateLock);

  this.options = options;

  this.definitions = {
    event: {
////      correlationId: 'correlationId', // optional
      id: 'id',                       // optional
      name: 'name'                    // optional
////      aggregateId: 'aggregate.id',    // optional
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
////      payload: 'payload',             // optional
////      revision: 'revision'            // optional
//      version: 'version',             // optional
//      meta: 'meta'                    // optional, if defined theses values will be copied to the notification (can be used to transport information like userId, etc..)
    },
    notification: {
      correlationId: 'correlationId', // optional
      id: 'id',                       // optional
      name: 'name',                   // optional
      collection: 'collection',       // optional
      payload: 'payload'              // optional
//      meta: 'meta'                    // optional, if defined theses values will be copied from the event (can be used to transport information like userId, etc..)
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
      fn = _.wrap(fn, function(func, cmd, callback) {
        func(cmd);
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
      fn = _.wrap(fn, function(func, cmd, callback) {
        func(cmd);
        callback(null);
      });
    }

    this.onNotificationHandle = fn;

    return this;
  }
  
});

module.exports = Denormalizer;
