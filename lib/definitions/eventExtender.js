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
  this.payload = meta.payload || null;
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
   * Loads a viewModel array by optional query and query options.
   * @param {Object}   query        The query to find the viewModels. (mongodb style) [optional]
   * @param {Object}   queryOptions The query options. (mongodb style) [optional]
   * @param {Function} callback     The function, that will be called when the this action is completed.
   *                                `function(err, vms){}` vms is of type Array.
   */
  findViewModels: function (query, queryOptions, callback) {
    if (typeof query === 'function') {
      callback = query;
      query = {};
      queryOptions = {};
    }
    if (typeof queryOptions === 'function') {
      callback = queryOptions;
      queryOptions = {};
    }

    this.collection.findViewModels(query, queryOptions, callback);
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

    var payload = evt;

    if (self.payload && self.payload !== '') {
      payload = dotty.get(evt, self.payload);
    }

    if (self.evtExtFn.length === 3) {
      if (self.id) {
        self.extractId(evt, function (err, id) {
          if (err) {
            debug(err);
            return callback(err);
          }

          self.loadViewModel(id, function (err, vm) {
            if (err) {
              debug(err);
              return callback(err);
            }

            try {
              self.evtExtFn(_.cloneDeep(payload), vm, function () {
                try {
                  callback.apply(this, _.toArray(arguments));
                } catch (e) {
                  debug(e);
                  process.emit('uncaughtException', e);
                }
              });
            } catch (e) {
              debug(e);
              process.emit('uncaughtException', e);
            }
          });
        });
        return;
      }

      try {
        self.evtExtFn(_.cloneDeep(payload), self.collection, function () {
          try {
            callback.apply(this, _.toArray(arguments));
          } catch (e) {
            debug(e);
            process.emit('uncaughtException', e);
          }
        });
      } catch (e) {
        debug(e);
        process.emit('uncaughtException', e);
      }
      return;
    }

    if (self.evtExtFn.length === 1) {
      try {
        var res = self.evtExtFn(evt);
        try {
          callback(null, res);
        } catch (e) {
          debug(e);
          process.emit('uncaughtException', e);
        }
      } catch (e) {
        debug(e);
        process.emit('uncaughtException', e);
      }
      return;
    }

    if (self.evtExtFn.length === 2) {
      if (!self.collection || !self.id) {
        try {
          self.evtExtFn(evt, function () {
            try {
              callback.apply(this, _.toArray(arguments));
            } catch (e) {
              debug(e);
              process.emit('uncaughtException', e);
            }
          });
        } catch (e) {
          debug(e);
          process.emit('uncaughtException', e);
        }
        return;
      }

      self.extractId(evt, function (err, id) {
        if (err) {
          debug(err);
          return callback(err);
        }

        self.loadViewModel(id, function (err, vm) {
          if (err) {
            debug(err);
            return callback(err);
          }

          try {
            var res = self.evtExtFn(_.cloneDeep(payload), vm);
            try {
              callback(null, res);
            } catch (e) {
              debug(e);
              process.emit('uncaughtException', e);
            }
          } catch (e) {
            debug(e);
            process.emit('uncaughtException', e);
          }
        });
      });
    }
  }

});

module.exports = EventExtender;
