'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  dotty = require('dotty'),
  debug = require('debug')('denormalizer:event');

/**
 * Collection constructor
 * @param {Object} meta            Meta infos like: { name: 'name' }
 * @param {Object} modelInitValues Initialization values for model like: { emails: [] } [optional]
 * @constructor
 */
function Collection (meta, modelInitValues) {
  Definition.call(this, meta);

  meta = meta || {};
  
  this.defaultPayload = meta.defaultPayload || '';
  
  this.modelInitValues = modelInitValues || {};
}

util.inherits(Collection, Definition);

_.extend(Collection.prototype, {

  /**
   * Injects the needed eventStore.
   * @param {Object} repository The repository object to inject.
   */
  useRepository: function (repository) {
    if (!repository || !_.isObject(repository)) {
      var err = new Error('Please pass a valid repository!');
      debug(err);
      throw err;
    }

    this.repository = repository.extend({
      collectionName: this.name
    });
  },

  addViewBuilder: function (viewBuilder) {
    if (!viewBuilder || !_.isObject(viewBuilder)) {
      var err = new Error('Please inject a valid view builder object!');
      debug(err);
      throw err;
    }

    if (this.viewBuilders.indexOf(viewBuilder) < 0) {
      this.viewBuilders.push(viewBuilder);
    }
  },

  addEventExtender: function (eventExtender) {
    if (!eventExtender || !_.isObject(eventExtender)) {
      var err = new Error('Please inject a valid event extender object!');
      debug(err);
      throw err;
    }

    if (this.eventExtenders.indexOf(eventExtender) < 0) {
      this.eventExtenders.push(eventExtender);
    }
  },

  getViewBuilder: function (query) {
    
  },
  
  get: function (id, callback) {
    var self = this;
    
    this.repository.get(id, function(err, vm) {
      if (err) {
        debug(err);
        return callback(err);
      }
      
      if (!vm) {
        err = new Error('No vm object returned!');
        debug(err);
        return callback(err);
      }
      
      for (var prop in self.modelInitValues) {
        if (!vm.has(prop)) {
          vm.set(prop, self.modelInitValues[prop]);
        }
      }
      
      callback(null, vm);
    });
  },

  defaultEventExtension: function (fn) {
    if (!fn || !_.isFunction(fn)) {
      var err = new Error('Please pass a valid function!');
      debug(err);
      throw err;
    }

    if (fn.length === 1) {
      fn = _.wrap(fn, function(func, evt, col, callback) {
        callback(null, func(evt));
      });
    } else if (fn.length === 2) {
      fn = _.wrap(fn, function(func, evt, col, callback) {
        func(evt, callback);
      });
    }

    this.extendEvent = fn;

    return this;
  }
  
});

module.exports = Collection;
