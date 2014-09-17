'use strict';

var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  debug = require('debug')('denormalizer:collection');

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
  
  this.indexes = meta.indexes || [];
  
  this.modelInitValues = modelInitValues || {};
}

util.inherits(Collection, Definition);

_.extend(Collection.prototype, {

  /**
   * Injects the needed repository.
   * @param {Object} repository The repository object to inject.
   */
  useRepository: function (repository) {
    if (!repository || !_.isObject(repository)) {
      var err = new Error('Please pass a valid repository!');
      debug(err);
      throw err;
    }

    this.repository = repository.extend({
      collectionName: this.name,
      indexes: this.indexes
    });
  },

  /**
   * Add viewBuilder module.
   * @param {ViewBuilder} viewBuilder The viewBuilder module to be injected.
   */
  addViewBuilder: function (viewBuilder) {
    if (!viewBuilder || !_.isObject(viewBuilder)) {
      var err = new Error('Please inject a valid view builder object!');
      debug(err);
      throw err;
    }

    if (!viewBuilder.payload) {
      viewBuilder.payload = this.defaultPayload;
    }

    if (this.viewBuilders.indexOf(viewBuilder) < 0) {
      viewBuilder.useCollection(this);
      this.viewBuilders.push(viewBuilder);
    }
  },

  /**
   * Add eventExtender module.
   * @param {EventExtender} eventExtender The eventExtender module to be injected.
   */
  addEventExtender: function (eventExtender) {
    if (!eventExtender || !_.isObject(eventExtender)) {
      var err = new Error('Please inject a valid event extender object!');
      debug(err);
      throw err;
    }

    if (this.eventExtenders.indexOf(eventExtender) < 0) {
      eventExtender.useCollection(this);
      this.eventExtenders.push(eventExtender);
    }
  },

  /**
   * Returns the viewBuilder module by query.
   * @param {Object} query The query object.
   * @returns {ViewBuilder}
   */
  getViewBuilder: function (query) {
    if (!query || !_.isObject(query)) {
      var err = new Error('Please pass a valid query object!');
      debug(err);
      throw err;
    }

    query.name = query.name || '';
    query.version = query.version || 0;
    query.aggregate = query.aggregate || null;
    query.context = query.context || null;

    return _.find(this.viewBuilders, function (vB) {
      return vB.name === query.name &&
             vB.version === query.version &&
             vB.aggregate === query.aggregate &&
             vB.context === query.context;
    });
  },

  /**
   * Returns all viewBuilder modules.
   * @returns {Array}
   */
  getViewBuilders: function () {
    return this.viewBuilders;
  },

  /**
   * Returns the eventExtender module by query.
   * @param {Object} query The query object.
   * @returns {EventExtender}
   */
  getEventExtender: function (query) {
    if (!query || !_.isObject(query)) {
      var err = new Error('Please pass a valid query object!');
      debug(err);
      throw err;
    }

    query.name = query.name || '';
    query.version = query.version || 0;
    query.aggregate = query.aggregate || null;
    query.context = query.context || null;

    return _.find(this.eventExtenders, function (evExt) {
      return evExt.name === query.name &&
        evExt.version === query.version &&
        evExt.aggregate === query.aggregate &&
        evExt.context === query.context;
    });
  },

  /**
   * Returns all eventExtener modules.
   * @returns {Array}
   */
  getEventExtenders: function () {
    return this.eventExtenders;
  },

  /**
   * Use this function to obtain a new id.
   * @param {Function} callback The function, that will be called when the this action is completed.
   *                            `function(err, id){}` id is of type String.
   */
  getNewId: function (callback) {
    this.repository.getNewId(function(err, newId) {
      if (err) {
        debug(err);
        return callback(err);
      }

      callback(null, newId);
    });
  },

  /**
   * Save the passed viewModel object in the read model.
   * @param {Object}   vm       The viewModel object.
   * @param {Function} callback The function, that will be called when the this action is completed. [optional]
   *                            `function(err){}`
   */
  saveViewModel: function (vm, callback) {
    this.repository.commit(vm, callback);
  },

  /**
   * Loads a viewModel object by id.
   * @param {String}   id       The viewModel id.
   * @param {Function} callback The function, that will be called when the this action is completed.
   *                            `function(err, vm){}` vm is of type Object
   */
  loadViewModel: function (id, callback) {
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

  /**
   * Loads a viewModel array by optional query and query options.
   * @param  {Object}   query        The query to find the viewModels. (mongodb style) [optional]
   * @param  {Object}   queryOptions The query options. (mongodb style) [optional]
   * @param  {Function} callback     The function, that will be called when the this action is completed.
   *                                 `function(err, vms){}` vms is of type Array.
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

    var self = this;

    this.repository.find(query, queryOptions, function (err, vms) {
      if (err) {
        debug(err);
        return callback(err);
      }

      vms.forEach(function (vm) {
        for (var prop in self.modelInitValues) {
          if (!vm.has(prop)) {
            vm.set(prop, self.modelInitValues[prop]);
          }
        }
      });

      callback(null, vms);
    });
  }
  
});

module.exports = Collection;
