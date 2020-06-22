var util = require('util'),
  Store = require('../base'),
  debug = require('debug')('denormalizer:revisionGuardStore:inmemory'),
  ConcurrencyError = require('../../errors/concurrencyError'),
  _ = require('lodash');

function InMemory(options) {
  Store.call(this, options);
  this.store = {};
  this.lastEvent = {};
}

util.inherits(InMemory, Store);

_.extend(InMemory.prototype, {

  connect: function (callback) {
    this.emit('connect');
    if (callback) callback(null, this);
  },

  disconnect: function (callback) {
    this.emit('disconnect');
    if (callback) callback(null);
  },

  get: function (prefix, id, callback) {
    prefix = prefix || 'default';
    if (!id || !_.isString(id)) {
      var err = new Error('Please pass a valid id!');
      debug(err);
      return callback(err);
    }

    id = prefix + '::' + id;

    var rev = (this.store[id] && this.store[id]['revision']) || null;
    callback(null, rev);
  },

  set: function (prefix, id, data, revision, oldRevision, callback) {
    prefix = prefix || 'default';

    if (!id || !_.isString(id)) {
      var err = new Error('Please pass a valid id!');
      debug(err);
      return callback(err);
    }
    if (typeof data !== 'object') {
      var err = new Error('Please pass a valid data object or null!');
      debug(err);
      return callback(err);
    }
    if (!revision || !_.isNumber(revision)) {
      var err = new Error('Please pass a valid revision!');
      debug(err);
      return callback(err);
    }

    id = prefix + '::' + id;

    if (this.store[id] && this.store[id]['revision'] && this.store[id]['revision'] !== oldRevision) {
      return callback(new ConcurrencyError());
    }


    this.store[id] = this.store[id] || {};
    this.store[id]['revision'] = revision;
    if (data) {
      this.store[id]['data'] = data;
    }

    callback(null);
  },

  saveLastEvent: function (prefix, evt, callback) {
    prefix = prefix || 'default';
    this.lastEvent[prefix] = evt;
    if (callback) callback(null);
  },

  getLastEvent: function (prefix, callback) {
    prefix = prefix || 'default';
    callback(null, this.lastEvent[prefix]);
  },

  getValueOfId: function (id, callback) {
    callback(null, { key: id, value: this.store[id] });
  },

  getValueOfEachId: function (prefix, callback = (err, aggregateHandleFns) => {}) {
    prefix = prefix || 'default';

    var self = this;
    var uniqueIds = {};
    var aggregateHandleFns = [];
    var ids = _.keys(this.store);
    ids.forEach(function (id) {
      // don't reprocess an already handeled id
      if ( !uniqueIds[id] && id.indexOf(prefix) >= 0) {
        uniqueIds[id] = true;
        aggregateHandleFns.push((cb) => self.getValueOfId(id, cb));
      }
    });

    callback(null, aggregateHandleFns);
  },

  clear: function (prefix, callback) {
    var self = this;
    prefix = prefix || 'default';

    var keys = _.keys(self.store);
    keys.forEach(function (key) {
      if (key.indexOf(prefix) >= 0) {
       self.store[key] = null;
      }
    });

    self.lastEvent[prefix] = null;

    if (callback) callback(null);
  }

});

module.exports = InMemory;
