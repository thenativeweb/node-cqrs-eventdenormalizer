'use strict';

var debug = require('debug')('denormalizer:eventDispatcher'),
  _ = require('lodash'),
  async = require('async'),
  dotty = require('dotty');

/**
 * EventDispatcher constructor
 * @param {Object} tree       The tree object.
 * @param {Object} definition The definition object.
 * @constructor
 */
function EventDispatcher (tree, definition) {
  if (!tree || !_.isObject(tree) || !_.isFunction(tree.getViewBuilders)) {
    var err = new Error('Please pass a valid tree!');
    debug(err);
    throw err;
  }

  if (!definition || !_.isObject(definition)) {
    var err = new Error('Please pass a valid command definition!');
    debug(err);
    throw err;
  }

  this.tree = tree;

  this.definition = {
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
  };

  this.definition = _.defaults(definition, this.definition);
}

EventDispatcher.prototype = {

  /**
   * Returns the target information of this event.
   * @param {Object} evt The passed event.
   * @returns {{name: 'eventName', aggregateId: 'aggregateId', version: 0, aggregate: 'aggregateName', context: 'contextName'}}
   */
  getTargetInformation: function (evt) {
    if (!evt || !_.isObject(evt)) {
      var err = new Error('Please pass a valid event!');
      debug(err);
      throw err;
    }

    var name = dotty.get(evt, this.definition.name) || '';

    var version = 0;
    if (dotty.exists(evt, this.definition.version)) {
      version = dotty.get(evt, this.definition.version);
    } else {
      debug('no version found, handling as version: 0');
    }

    var aggregate = null;
    if (dotty.exists(evt, this.definition.aggregate)) {
      aggregate = dotty.get(evt, this.definition.aggregate);
    } else {
      debug('no aggregate found');
    }

    var context = null;
    if (dotty.exists(evt, this.definition.context)) {
      context = dotty.get(evt, this.definition.context);
    } else {
      debug('no context found');
    }

    return {
      name: name,
      version: version,
      aggregate: aggregate,
      context: context
    };
  },

  /**
   * Dispatches an event.
   * @param {Object}   evt      The passed event.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(errs, notifications){}`
   */
  dispatch: function (evt, callback) {
    if (!evt || !_.isObject(evt)) {
      var err = new Error('Please pass a valid event!');
      debug(err);
      throw err;
    }

    if (!callback || !_.isFunction(callback)) {
      var err = new Error('Please pass a valid callback!');
      debug(err);
      throw err;
    }

    var target = this.getTargetInformation(evt);

    var viewBuilders = this.tree.getViewBuilders(target);

    var errs = [];
    var notifications = [];

    var foundPrioSet = _.find(viewBuilders, function (vb) {
      return vb.priority < Infinity;
    });

    var eachMethod = 'each';
    if (foundPrioSet) {
      eachMethod = 'eachSeries';
    }

    async[eachMethod].call(async, viewBuilders, function (viewBuilder, callback) {
      viewBuilder.denormalize(evt, function (err, notis) {
        if (err) {
          debug(err);
          if (!errs.push) {
            var warn = new Error('ATTENTION! Already called back!');
            debug(warn);
            console.log(warn.stack);
            return;
          }
          errs.push(err);
        }

        if (notis && notis.length > 0) {
          notifications = notifications.concat(notis);
        }
        callback(null);
      });
    }, function () {
      if (errs.length === 0) {
        errs = null;
      }
      callback(errs, _.filter(notifications, function (n) { return !!n; }));
    });
  }

};

module.exports = EventDispatcher;
