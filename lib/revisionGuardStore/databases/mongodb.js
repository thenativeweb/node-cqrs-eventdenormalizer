var util = require('util'),
  Store = require('../base'),
  _ = require('lodash'),
  debug = require('debug')('denormalizer:revisionGuardStore:mongodb'),
  ConcurrencyError = require('../../errors/concurrencyError'),
  mongo = Store.use('mongodb'),
  mongoVersion = Store.use('mongodb/package.json').version,
  isNew = mongoVersion.indexOf('1.') !== 0,
  ObjectID = isNew ? mongo.ObjectID : mongo.BSONPure.ObjectID;

function Mongo(options) {
  Store.call(this, options);

  var defaults = {
    host: 'localhost',
    port: 27017,
    dbName: 'readmodel',
    collectionName: 'revision'//,
    // heartbeat: 60 * 1000
  };

  _.defaults(options, defaults);

  var defaultOpt = {
    ssl: false
  };

  options.options = options.options || {};

  if (isNew) {
    defaultOpt.autoReconnect = false;
    defaultOpt.useNewUrlParser = true;
    _.defaults(options.options, defaultOpt);
  } else {
    defaultOpt.auto_reconnect = false;
    _.defaults(options.options, defaultOpt);
  }

  this.options = options;
}

util.inherits(Mongo, Store);

_.extend(Mongo.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    var connectionUrl;

    if (options.url) {
      connectionUrl = options.url;
    } else {
      var members = options.servers
        ? options.servers
        : [{host: options.host, port: options.port}];

      var memberString = _(members).map(function(m) { return m.host + ':' + m.port; });
      var authString = options.username && options.password
        ? options.username + ':' + options.password + '@'
        : '';
      var optionsString = options.authSource
        ? '?authSource=' + options.authSource
        : '';

      connectionUrl = 'mongodb://' + authString + memberString + '/' + options.dbName + optionsString;
    }

    var client;

    if (mongo.MongoClient.length === 2) {
      client = new mongo.MongoClient(connectionUrl, options.options);
      client.connect(function(err, cl) {
        if (err) {
          debug(err);
          if (callback) callback(err);
          return;
        }

        self.db = cl.db(cl.s.options.dbName);
        if (!self.db.close) {
          self.db.close = cl.close.bind(cl);
        }
        initDb();
      });
    } else {
      client = new mongo.MongoClient();
      client.connect(connectionUrl, options.options, function(err, db) {
        if (err) {
          debug(err);
          if (callback) callback(err);
          return;
        }

        self.db = db;
        initDb();
      });
    }

    function initDb() {
      self.db.on('close', function() {
        self.emit('disconnect');
        self.stopHeartbeat();
      });

      var finish = function (err) {
        self.store = self.db.collection(options.collectionName);
//        self.store.ensureIndex({ 'aggregateId': 1, date: 1 }, function() {});
        if (!err) {
          self.emit('connect');

          if (self.options.heartbeat) {
            self.startHeartbeat();
          }
        }
        if (callback) callback(err, self);
      };

      finish();
    }
  },

  stopHeartbeat: function () {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      delete this.heartbeatInterval;
    }
  },

  startHeartbeat: function () {
    var self = this;

    var gracePeriod = Math.round(this.options.heartbeat / 2);
    this.heartbeatInterval = setInterval(function () {
      var graceTimer = setTimeout(function () {
        if (self.heartbeatInterval) {
          console.error((new Error ('Heartbeat timeouted after ' + gracePeriod + 'ms (mongodb)')).stack);
          self.disconnect();
        }
      }, gracePeriod);

      self.db.command({ ping: 1 }, function (err) {
        if (graceTimer) clearTimeout(graceTimer);
        if (err) {
          console.error(err.stack || err);
          self.disconnect();
        }
      });
    }, this.options.heartbeat);
  },

  disconnect: function (callback) {
    this.stopHeartbeat();

    if (!this.db) {
      if (callback) callback(null);
      return;
    }

    this.db.close(callback || function () {});
  },

  getNewId: function(prefix, callback) {
    callback(null, new ObjectID().toString());
  },

  get: function (prefix, id, callback) {
    prefix = prefix || 'default';

    if (!id || !_.isString(id)) {
      var err = new Error('Please pass a valid id!');
      debug(err);
      return callback(err);
    }

    id = prefix + '::' + id;

    this.store.findOne({ _id: id }, function (err, entry) {
      if (err) {
        return callback(err);
      }

      if (!entry) {
        return callback(null, null);
      }

      callback(null, entry.revision || null);
    });
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

    var newData = data ? { _id: id, revision, data } : { _id: id, revision };
    this.store.update({ _id: id, revision: oldRevision }, newData, { safe: true, upsert: true }, function (err, modifiedCount) {
      if (isNew) {
        if (modifiedCount && modifiedCount.result && modifiedCount.result.n === 0) {
          err = new ConcurrencyError();
          debug(err);
          if (callback) {
            callback(err);
          }
          return;
        }
      } else {
        if (modifiedCount === 0) {
          err = new ConcurrencyError();
          debug(err);
          if (callback) {
            callback(err);
          }
          return;
        }
      }
      if (err && err.message && err.message.match(/duplicate key/i)) {
        debug(err);
        err = new ConcurrencyError();
        debug(err);
        if (callback) {
          callback(err);
        }
        return;
      }
      if (callback) { callback(err); }
    });
  },

  saveLastEvent: function (prefix, evt, callback) {
    prefix = prefix || 'default';

    this.store.save({ _id: prefix + '::THE_LAST_SEEN_EVENT', event: evt }, { safe: true }, function (err) {
      if (callback) { callback(err); }
    });
  },

  getLastEvent: function (prefix, callback) {
    prefix = prefix || 'default';

    this.store.findOne({ _id: prefix + '::THE_LAST_SEEN_EVENT' }, function (err, entry) {
      if (err) {
        return callback(err);
      }

      if (!entry) {
        return callback(null, null);
      }

      callback(null, entry.event || null);
    });
  },

  clear: function (prefix, callback) {
    // TODO: clear only for prefix
    this.store.remove({}, { safe: true }, callback);
  }

});

module.exports = Mongo;
