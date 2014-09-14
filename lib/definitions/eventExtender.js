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
  }

});

module.exports = EventExtender;
