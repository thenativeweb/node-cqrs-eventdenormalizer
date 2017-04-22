'use strict';

var EventExtender = require('./eventExtender'),
  util = require('util'),
  _ = require('lodash');

/**
 * PreEventExtender constructor
 * @param {Object}             meta     Meta infos like: { name: 'name', version: 1, payload: 'some.path' }
 * @param {Function || String} evtExtFn Function handle
 *                                      `function(evt, col, callback){}`
 * @constructor
 */
function PreEventExtender (meta, evtExtFn) {
  EventExtender.call(this, meta, evtExtFn);
}

util.inherits(PreEventExtender, EventExtender);

_.extend(PreEventExtender.prototype, {});

module.exports = PreEventExtender;
