'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
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

  meta = meta || {};

  if (!denormFn || !(_.isFunction(denormFn) && _.isString(denormFn))) {
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

  loadViewModel: function (id, callback) {
    if (this.isReplaying) {
      throw new Error('Implement this!!!');
    }
    this.collection.loadViewModel(id, callback);
  },

  saveViewModel: function (vm, callback) {
    if (this.isReplaying) {
      throw new Error('Implement this!!!');
    }
    this.collection.saveViewModel(vm, callback);
  },
  
  extractId: function (evt, callback) {
    if (this.id && dotty.exists(evt, this.id)) {
      debug('found viewmodel id in event');
      return callback(null, dotty.get(evt, this.id));
    }

    debug('not found viewmodel id in event, generate new id');
    this.collection.getNewId(callback);
  },
  
  generateNotification: function (evt, vm) {
    var notification = {};

    // event
    if (!!this.definitions.notification.meta && !!this.definitions.event.meta) {
      dotty.put(notification, this.definitions.notification.meta, dotty.get(evt, this.definitions.event.meta));
    }
    if (!!this.definitions.notification.eventId && !!this.definitions.event.id) {
      dotty.put(notification, this.definitions.notification.eventId, dotty.get(evt, this.definitions.event.id));
    }
    if (!!this.definitions.notification.eventName && !!this.definitions.event.name) {
      dotty.put(notification, this.definitions.notification.eventName, dotty.get(evt, this.definitions.event.name));
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
        self.denormFn(payload, vm);

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
  }
  
});

module.exports = ViewBuilder;
