var util = require('util'),
  EventEmitter = require('events').EventEmitter,
  prequire = require('parent-require'),
  _ = require('lodash'),
  uuid = require('uuid').v4;

/**
 * Guard constructor
 * @param {Object} options The options can have information like host, port, etc. [optional]
 */
function Guard(options) {
  options = options || {};

  EventEmitter.call(this);
}

util.inherits(Guard, EventEmitter);

function implementError (callback) {
  var err = new Error('Please implement this function!');
  if (callback) callback(err);
  throw err;
}

_.extend(Guard.prototype, {

  /**
   * Initiate communication with the lock.
   * @param  {Function} callback The function, that will be called when this action is completed. [optional]
   *                             `function(err, queue){}`
   */
  connect: implementError,

  /**
   * Terminate communication with the lock.
   * @param  {Function} callback The function, that will be called when this action is completed. [optional]
   *                             `function(err){}`
   */
  disconnect: implementError,

  /**
   * Use this function to obtain a new id.
   * @param  {Function} callback The function, that will be called when this action is completed.
   *                             `function(err, id){}` id is of type String.
   */
  getNewId: function (prefix, callback) {
    var id = uuid().toString();
    if (callback) callback(null, id);
  },

  /**
   * Use this function to obtain the revision by id.
   * @param {String}   id       The aggregate id.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                             `function(err, revision){}` id is of type String.
   */
  get: function (prefix, id, callback) {
    implementError(callback);
  },

  /**
   * Updates the revision number.
   * @param {String}   id          The unique id including the prefix.
   * @param {Object}   data        The data that should be stored next to the revision
   * @param {Number}   revision    The new revision number.
   * @param {Number}   oldRevision The old revision number.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err, revision){}` revision is of type Number.
   */
  set: function (prefix, id, data, revision, oldRevision, callback) {
    implementError(callback);
  },

  /**
   * Saves the last event.
   * @param {Object}   evt      The event that should be saved.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err){}`
   */
  saveLastEvent: function (prefix, evt, callback) {
    implementError(callback);
  },

  /**
   * Gets the last event.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, evt){}` evt is of type Object.
   */
  getLastEvent: function (prefix, callback) {
    implementError(callback);
  },


  /**
   * Gets the last value of each key and will invoke the callback
   * with all the handler function of which each on invokation will retrieve the
   * value of the last event from the revision guard.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err, aggregateHandleFns){}` aggregateHandleFns is of type Array.
   */
  getValueOfEachKey: function (prefix, callback = (err, aggregateHandleFns) => {}) {
    implementError(callback);
  },

  /**
   * NEVER USE THIS FUNCTION!!! ONLY FOR TESTS!
   * clears the complete store...
   * @param {Function} callback the function that will be called when this action has finished [optional]
   */
  clear: function (prefix, callback) {
    implementError(callback);
  }

});

Guard.use = function (toRequire) {
  var required;
  try {
    required = require(toRequire);
  } catch (e) {
    // workaround when `npm link`'ed for development
    required = prequire(toRequire);
  }
  return required;
};

module.exports = Guard;
