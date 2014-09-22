'use strict';

var _ = require('lodash');

/**
 * Definition constructor
 * @param {Object} meta meta infos like: { name: 'name' }
 * @constructor
 */
function Definition (meta) {
  if (!this.name && meta) {
    this.name = meta.name;
  }

  this.options = {};

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
//      event: 'meta.event.name',            // optional, if defined theses values will be copied from the event
//      meta: 'meta'                         // optional, if defined theses values will be copied from the event (can be used to transport information like userId, etc..)
    }
  };
}

/**
 * Inject definition for notification structure.
 * @param   {Object} definition the definition to be injected
 */
Definition.prototype.defineNotification = function (definition) {
  if (!_.isObject(definition)) {
    throw new Error('Please pass in an object');
  }
  this.definitions.notification = _.defaults(definition, this.definitions.notification);
};

/**
 * Inject definition for event structure.
 * @param   {Object} definition the definition to be injected
 */
Definition.prototype.defineEvent = function (definition) {
  if (!_.isObject(definition)) {
    throw new Error('Please pass in an object');
  }
  this.definitions.event = _.defaults(definition, this.definitions.event);
  return this;
};

/**
 * Inject options.
 * @param   {Object} options the options to be injected
 */
Definition.prototype.defineOptions = function (options) {
  if (!_.isObject(options)) {
    throw new Error('Please pass in an object');
  }
  this.options = options;
  return this;
};

module.exports = Definition;
