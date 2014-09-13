'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
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
}

util.inherits(ViewBuilder, Definition);

_.extend(ViewBuilder.prototype, {

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
  
  extractId: function (evt, callback) {
    if (this.id && dotty.exists(evt, this.id)) {
      debug('found viewmodel id in event');
      return callback(null, dotty.get(evt, this.id));
    }

    debug('not found viewmodel id in event, generate new id');
    this.collection.getNewId(callback);
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
        return callback(err);
      }
      
      self.collection.loadViewModel(id, function (err, vm) {
        if (err) {
          return callback(err);
        }

        var payload = evt;

        if (self.payload && self.payload !== '') {
          payload = dotty.get(evt, self.payload);
        }
        
        debug('call denormalizer function');
        self.denormFn(payload, vm);
        
        self.collection.saveViewModel(vm, function (err) {
          // TODO: handle concurrency error
          if (err) {
            debug(err);
            return callback(err);
          }

          var notification;

          // TODO: generate notification!!!

          callback(null, notification);
        });
      });
    });
  }
  
});

module.exports = ViewBuilder;
