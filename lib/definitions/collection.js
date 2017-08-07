'use strict';
var Definition = require('../definitionBase'),
  util = require('util'),
  _ = require('lodash'),
  uuid = require('uuid').v4,
  async = require('async'),
  viewmodel = require('viewmodel'),
  sift = require('sift'),
  flatten = require('flat'),
  debug = require('debug')('denormalizer:collection');
/**
 * Collection constructor
 * @param {Object} meta            Meta infos like: { name: 'name' }
 * @param {Object} modelInitValues Initialization values for model like: { emails: [] } [optional]
 * @constructor
 */
function Collection (meta, modelInitValues) {
  Definition.call(this, meta);
  // used for replay...
  this.workerId = uuid().toString();
  this.isReplaying = false;
  this.replayingVms = {};
  this.replayingVmsToDelete = {};
  meta = meta || {};
  this.repositorySettings = meta.repositorySettings || {};
  this.defaultPayload = meta.defaultPayload || '';
  this.indexes = meta.indexes || [];
  this.noReplay = !!meta.noReplay || false;
  this.modelInitValues = modelInitValues || {};
  this.viewBuilders = [];
  this.eventExtenders = [];
  this.preEventExtenders = [];
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

    var extendObject = {
      collectionName: this.name,
      indexes: this.indexes,
    };

    if (repository.repositoryType && this.repositorySettings[repository.repositoryType]) {
      extendObject.repositorySettings = {};
      extendObject.repositorySettings[repository.repositoryType] = this.repositorySettings[repository.repositoryType];
    }

    this.repository = repository.extend(extendObject);
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
    if (viewBuilder.payload === null || viewBuilder.payload === undefined) {
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
   * Add preEventExtender module.
   * @param {PreEventExtender} preEventExtender The preEventExtender module to be injected.
   */
  addPreEventExtender: function (preEventExtender) {
    if (!preEventExtender || !_.isObject(preEventExtender)) {
      var err = new Error('Please inject a valid event extender object!');
      debug(err);
      throw err;
    }
    if (this.preEventExtenders.indexOf(preEventExtender) < 0) {
      preEventExtender.useCollection(this);
      this.preEventExtenders.push(preEventExtender);
    }
  },
  /**
   * Returns the viewBuilder module by query.
   * @param {Object} query The query object. [optional] If not passed, all viewBuilders will be returned.
   * @returns {Array}
   */
  getViewBuilders: function (query) {
    if (!query || !_.isObject(query)) {
      return this.viewBuilders;
    }
    query.name = query.name || '';
    query.version = query.version || 0;
    query.aggregate = query.aggregate || null;
    query.context = query.context || null;
    var found = _.filter(this.viewBuilders, function (vB) {
      return vB.name === query.name &&
            (vB.version === query.version || vB.version === -1) &&
            (vB.aggregate === query.aggregate) &&
            (vB.context === query.context);
    });
    if (found.length !== 0) {
      return found;
    }
    found = _.filter(this.viewBuilders, function (vB) {
      return vB.name === query.name &&
        (vB.version === query.version || vB.version === -1) &&
        (vB.aggregate === query.aggregate) &&
        (vB.context === query.context || !query.context);
    });
    if (found.length !== 0) {
      return found;
    }
    found = _.filter(this.viewBuilders, function (vB) {
      return vB.name === query.name &&
        (vB.version === query.version || vB.version === -1) &&
        (vB.aggregate === query.aggregate || !query.aggregate) &&
        (vB.context === query.context || !query.context);
    });
    if (found.length !== 0) {
      return found;
    }
    return _.filter(this.viewBuilders, function (vB) {
      return vB.name === '' &&
        (vB.version === query.version || vB.version === -1) &&
        (vB.aggregate === query.aggregate || !query.aggregate) &&
        (vB.context === query.context || !query.context);
    });
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
    var found = _.find(this.eventExtenders, function (evExt) {
      return evExt.name === query.name &&
        (evExt.version === query.version || evExt.version === -1) &&
        (evExt.aggregate === query.aggregate) &&
        (evExt.context === query.context);
    });
    if (found) {
      return found;
    }
    found = _.find(this.eventExtenders, function (evExt) {
      return evExt.name === query.name &&
        (evExt.version === query.version || evExt.version === -1) &&
        (evExt.aggregate === query.aggregate || !query.aggregate || !evExt.aggregate) &&
        (evExt.context === query.context);
    });
    if (found) {
      return found;
    }
    found = _.find(this.eventExtenders, function (evExt) {
      return evExt.name === query.name &&
        (evExt.version === query.version || evExt.version === -1) &&
        (evExt.aggregate === query.aggregate || !query.aggregate || !evExt.aggregate) &&
        (evExt.context === query.context || !query.context || !evExt.context);
    });
    if (found) {
      return found;
    }
    return _.find(this.eventExtenders, function (evExt) {
      return evExt.name === '' &&
        (evExt.version === query.version || evExt.version === -1) &&
        (evExt.aggregate === query.aggregate || !query.aggregate || !evExt.aggregate) &&
        (evExt.context === query.context || !query.context || !evExt.context);
    });
  },
  /**
   * Returns the preEventExtender module by query.
   * @param {Object} query The query object.
   * @returns {PreEventExtender}
   */
  getPreEventExtender: function (query) {
    if (!query || !_.isObject(query)) {
      var err = new Error('Please pass a valid query object!');
      debug(err);
      throw err;
    }
    query.name = query.name || '';
    query.version = query.version || 0;
    query.aggregate = query.aggregate || null;
    query.context = query.context || null;
    var found = _.find(this.preEventExtenders, function (evExt) {
      return evExt.name === query.name &&
        (evExt.version === query.version || evExt.version === -1) &&
        (evExt.aggregate === query.aggregate) &&
        (evExt.context === query.context);
    });
    if (found) {
      return found;
    }
    found = _.find(this.preEventExtenders, function (evExt) {
      return evExt.name === query.name &&
        (evExt.version === query.version || evExt.version === -1) &&
        (evExt.aggregate === query.aggregate || !query.aggregate || !evExt.aggregate) &&
        (evExt.context === query.context);
    });
    if (found) {
      return found;
    }
    found = _.find(this.preEventExtenders, function (evExt) {
      return evExt.name === query.name &&
        (evExt.version === query.version || evExt.version === -1) &&
        (evExt.aggregate === query.aggregate || !query.aggregate || !evExt.aggregate) &&
        (evExt.context === query.context || !query.context || !evExt.context);
    });
    if (found) {
      return found;
    }
    return _.find(this.preEventExtenders, function (evExt) {
      return evExt.name === '' &&
        (evExt.version === query.version || evExt.version === -1) &&
        (evExt.aggregate === query.aggregate || !query.aggregate || !evExt.aggregate) &&
        (evExt.context === query.context || !query.context || !evExt.context);
    });
  },
  /**
   * Returns all eventExtender modules.
   * @returns {Array}
   */
  getEventExtenders: function () {
    return this.eventExtenders;
  },
  /**
   * Returns all preEventExtender modules.
   * @returns {Array}
   */
  getPreEventExtenders: function () {
    return this.preEventExtenders;
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
    if (this.isReplaying) {
      vm.actionOnCommitForReplay = vm.actionOnCommit;
      // Clone the values to be sure no reference mistakes happen!
      if (vm.attributes) {
        var flatAttr = flatten(vm.attributes);
        var undefines = [];
        _.each(flatAttr, function (v, k) {
          if (v === undefined) {
            undefines.push(k);
          }
        });
        vm.attributes = vm.toJSON();
        _.each(undefines, function (k) {
          vm.set(k, undefined);
        });
      }

      this.replayingVms[vm.id] = vm;
      if (vm.actionOnCommit === 'delete') {
        delete this.replayingVms[vm.id];
        if (!this.replayingVmsToDelete[vm.id]) this.replayingVmsToDelete[vm.id] = vm;
      }
      if (vm.actionOnCommit === 'create') {
        vm.actionOnCommit = 'update';
      }
      return callback(null);
    }
    this.repository.commit(vm, callback);
  },
  /**
   * Loads a viewModel object by id.
   * @param {String}   id       The viewModel id.
   * @param {Function} callback The function, that will be called when the this action is completed.
   *                            `function(err, vm){}` vm is of type Object
   */
  loadViewModel: function (id, callback) {
    if (this.isReplaying) {
      if (this.replayingVms[id]) {
        return callback(null, this.replayingVms[id]);
      }
      if (this.replayingVmsToDelete[id]) {
        var vm = new viewmodel.ViewModel({ id: id }, this.repository);
        var clonedInitValues = _.cloneDeep(this.modelInitValues);
        for (var prop in clonedInitValues) {
          if (!vm.has(prop)) {
            vm.set(prop, clonedInitValues[prop]);
          }
        }
        this.replayingVms[vm.id] = vm;
        return callback(null, this.replayingVms[id]);
      }
    }
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
      var clonedInitValues = _.cloneDeep(self.modelInitValues);
      for (var prop in clonedInitValues) {
        if (!vm.has(prop)) {
          vm.set(prop, clonedInitValues[prop]);
        }
      }
      if (self.isReplaying) {
        if (!self.replayingVms[vm.id]) {
          self.replayingVms[vm.id] = vm;
        }
        return callback(null, self.replayingVms[vm.id]);
      }
      callback(null, vm);
    });
  },
  /**
   * Loads a viewModel object by id if exists.
   * @param {String}   id       The viewModel id.
   * @param {Function} callback The function, that will be called when the this action is completed.
   *                            `function(err, vm){}` vm is of type Object or null
   */
  loadViewModelIfExists: function (id, callback) {
    this.loadViewModel(id, function (err, vm) {
      if (err) {
        return callback(err);
      }

      if (!vm || vm.actionOnCommit === 'create') {
        return callback(null, null);
      }

      callback(null, vm);
    });
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
    var self = this;
    var localFoundVms = {};
    if (this.isReplaying) {
      var replVms = _.map(this.replayingVms, function (vm) {
        // return vm.toJSON();
        // We just read, so this is ok and faster!
        return vm.attributes;
      });
      _.each(sift(query, replVms), function (vm) {
        localFoundVms[vm.id] = self.replayingVms[vm.id];
      });
    }
    this.repository.find(query, queryOptions, function (err, vms) {
      if (err) {
        debug(err);
        return callback(err);
      }
      vms.forEach(function (vm) {
        if (localFoundVms[vm.id]) return; // optimize a bit

        var clonedInitValues = _.cloneDeep(self.modelInitValues);
        for (var prop in clonedInitValues) {
          if (!vm.has(prop)) {
            vm.set(prop, clonedInitValues[prop]);
          }
        }
      });
      if (self.isReplaying) {
        var mergedVmsFromRepo = _.map(vms, function (vm) {
          return localFoundVms[vm.id] || vm;
        });
        mergedVmsFromRepo = _.reject(mergedVmsFromRepo, function (vm) {
          return !!self.replayingVmsToDelete[vm.id];
        });
        mergedVmsFromRepo = _.union(mergedVmsFromRepo, _.values(localFoundVms));
        mergedVmsFromRepo.forEach(function (vm) {
          if (!self.replayingVms[vm.id]) {
            self.replayingVms[vm.id] = vm;
          }
        });
        return callback(null, mergedVmsFromRepo);
      }
      callback(null, vms);
    });
  },
  /**
   * Saves all replaying viewmodels.
   * @param {Function} callback The function, that will be called when the this action is completed.
   *                             `function(err){}`
   */
  saveReplayingVms: function (callback) {
    if (!this.isReplaying) {
      var err = new Error('Not in replay mode!');
      debug(err);
      return callback(err);
    }
    var replVms = _.values(this.replayingVms);
    var replVmsToDelete = _.values(this.replayingVmsToDelete);
    var self = this;

    function commit (vm, callback) {
      if (!vm.actionOnCommitForReplay) {
        return callback(null);
      }
      vm.actionOnCommit = vm.actionOnCommitForReplay;
      delete vm.actionOnCommitForReplay;
      self.repository.commit(vm, function (err) {
        if (err) {
          debug(err);
          debug(vm);
        }
        callback(err);
      });
    }

    async.series([
      function (callback) {
        async.each(replVmsToDelete, commit, callback);
      },
      function (callback) {
        async.each(replVms, commit, callback);
      }
    ], function (err) {
      if (err) {
        debug(err);
      }
      self.replayingVms = {};
      self.replayingVmsToDelete = {};
      self.isReplaying = false;
      callback(err);
    });
  }
});
module.exports = Collection;
