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
  this.options = options || {};
}

RevisionGuard.prototype = {

  

};

module.exports = RevisionGuard;

