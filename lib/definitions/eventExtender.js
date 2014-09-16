'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('denormalizer:eventExtender');

/**
 * EventExtender constructor
 * @param {Object}             meta     Meta infos like: { name: 'name', version: 1, payload: 'some.path' }
 * @param {Function || String} evtExtFn Function handle
 *                                      `function(evt, col, callback){}`
 * @constructor
 */
function EventExtender (meta, evtExtFn) {
  Definition.call(this, meta);

  meta = meta || {};

  if (!evtExtFn || !(_.isFunction(evtExtFn))) {
    var err = new Error('extender function not injected!');
    debug(err);
    throw err;
  }

  this.version = meta.version || 0;
  this.aggregate = meta.aggregate || null;
  this.context = meta.context || null;
  this.id = meta.id || null;

  this.evtExtFn = evtExtFn;
}

util.inherits(EventExtender, Definition);

_.extend(EventExtender.prototype, {

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
   * Loads the appropriate viewmodel by id.
   * @param {String}   id       The viewmodel id.
   * @param {Function} callback The function that will be called when this action has finished
   *                            `function(err, vm){}`
   */
  loadViewModel: function (id, callback) {
    this.collection.loadViewModel(id, callback);
  },

  /**
   * Extracts the id from the event or generates a new one.
   * @param {Object}   evt      The event object.
   * @param {Function} callback The function that will be called when this action has finished
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
   * Extends the event.
   * @param {Object}   evt      The event object.
   * @param {Function} callback The function that will be called when this action has finished
   *                            `function(err, extendedEvent){}`
   */
  extend: function (evt, callback) {
    var self = this;
    
    if (this.evtExtFn.length === 3) {
      return this.evtExtFn(evt, this.collection, callback);
    }
    
    if (this.evtExtFn.length === 1) {
      return callback(null, this.evtExtFn(evt));
    }

    if (this.evtExtFn.length === 2) {
      if (!this.collection || !this.id) {
        return this.evtExtFn(evt, callback);
      }
      
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

          callback(null, self.evtExtFn(evt, vm));
        });
      });
    }
  }

});

module.exports = EventExtender;
