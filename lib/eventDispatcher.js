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
  this.definition = definition;
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
      debug('no aggregateName found');
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
   *                            `function(errs, evt, notifications){}`
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
    async.each(viewBuilders, function (viewBuilder, callback) {
      viewBuilder.denormalize(evt, function (err, notificaiton) {
        if (err) {
          debug(err);
          errs.push(err);
        }

        if (notificaiton) {
          notifications.push(notificaiton);
        }
        callback(null);
      })
    }, function () {
      if (errs.length === 0) {
        errs = null;
      }
      callback(errs, notifications);
    });
  }

};

module.exports = EventDispatcher;
