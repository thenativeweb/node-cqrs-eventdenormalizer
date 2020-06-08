var util = require('util'),
  Store = require('../base'),
  _ = require('lodash'),
  debug = require('debug')('denormalizer:revisionGuardStore:redis'),
  ConcurrencyError = require('../../errors/concurrencyError'),
  jsondate = require('jsondate'),
  async = require('async'),
  redis = Store.use('redis');

function Redis(options) {
  Store.call(this, options);

  var defaults = {
    host: 'localhost',
    port: 6379,
    retry_strategy: function (options) {
      return undefined;
    }//,
    // heartbeat: 60 * 1000
  };

  _.defaults(options, defaults);

  if (options.url) {
    var url = require('url').parse(options.url);
    if (url.protocol === 'redis:') {
      if (url.auth) {
        var userparts = url.auth.split(":");
        options.user = userparts[0];
        if (userparts.length === 2) {
          options.password = userparts[1];
        }
      }
      options.host = url.hostname;
      options.port = url.port;
      if (url.pathname) {
        options.db   = url.pathname.replace("/", "", 1);
      }
    }
  }

  this.options = options;
}

util.inherits(Redis, Store);

_.extend(Redis.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    this.client = new redis.createClient(options.port || options.socket, options.host, _.omit(options, 'prefix'));

    this.prefix = options.prefix;

    var calledBack = false;

    if (options.password) {
      this.client.auth(options.password, function(err) {
        if (err && !calledBack && callback) {
          calledBack = true;
          if (callback) callback(err, self);
          return;
        }
        if (err) throw err;
      });
    }

    if (options.db) {
      this.client.select(options.db);
    }

    this.client.on('end', function () {
      self.disconnect();
      self.stopHeartbeat();
    });

    this.client.on('error', function (err) {
      console.log(err);

      if (calledBack) return;
      calledBack = true;
      if (callback) callback(null, self);
    });

    this.client.on('connect', function () {
      if (options.db) {
        self.client.send_anyways = true;
        self.client.select(options.db);
        self.client.send_anyways = false;
      }

      self.emit('connect');

      if (self.options.heartbeat) {
        self.startHeartbeat();
      }

      if (calledBack) return;
      calledBack = true;
      if (callback) callback(null, self);
    });
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
          console.error((new Error ('Heartbeat timeouted after ' + gracePeriod + 'ms (redis)')).stack);
          self.disconnect();
        }
      }, gracePeriod);

      self.client.ping(function (err) {
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

    if (this.client) {
      this.client.end(true);
    }
    this.emit('disconnect');
    if (callback) callback(null, this);
  },

  getNewId: function(prefix, callback) {
    prefix = prefix || 'default';
    this.client.incr('nextItemId:' + prefix, function(err, id) {
      if (err) {
        return callback(err);
      }
      callback(null, id.toString());
    });
  },

  get: function (prefix, id, callback) {
    prefix = prefix || 'default';

    if (!id || !_.isString(id)) {
      var err = new Error('Please pass a valid id!');
      debug(err);
      return callback(err);
    }

    id = prefix + '::' + id;

    this.client.get(id, function (err, entry) {
      if (err) {
        return callback(err);
      }

      if (!entry) {
        return callback(null, null);
      }

      try {
        entry = jsondate.parse(entry.toString());
      } catch (error) {
        if (callback) callback(error);
        return;
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
      var err = new Error('Please pass a valid data object!');
      debug(err);
      return callback(err);
    }
    if (!revision || !_.isNumber(revision)) {
      var err = new Error('Please pass a valid revision!');
      debug(err);
      return callback(err);
    }

    var self = this;

    this.client.watch(id, function (err) {
      if (err) {
        return callback(err);
      }

      self.get(prefix, id, function (err, rev) {
        if (err) {
          debug(err);
          if (callback) callback(err);
          return;
        }

        if (rev && rev !== oldRevision) {
          self.client.unwatch(function (err) {
            if (err) {
              debug(err);
            }

            err = new ConcurrencyError();
            debug(err);
            if (callback) {
              callback(err);
            }
          });
          return;
        }

        id = prefix + '::' + id;
        var newData = data ? { revision, data } : { revision };
        self.client.multi([['set'].concat([id, JSON.stringify(newData)])]).exec(function (err, replies) {
          if (err) {
            debug(err);
            if (callback) {
              callback(err);
            }
            return;
          }
          if (!replies || replies.length === 0 || _.find(replies, function (r) {
            return (r !== 'OK' && r !== 1)
          })) {
            var err = new ConcurrencyError();
            debug(err);
            if (callback) {
              callback(err);
            }
            return;
          }
          if (callback) {
            callback(null);
          }
        });
      });
    });
  },

  saveLastEvent: function (prefix, evt, callback) {
    prefix = prefix || 'default';

    this.client.set(prefix + '::THE_LAST_SEEN_EVENT', JSON.stringify({ event: evt }), function (err) {
      if (callback) { callback(err); }
    });
  },

  getLastEvent: function (prefix, callback) {
    prefix = prefix || 'default';

    this.client.get(prefix + '::THE_LAST_SEEN_EVENT', function (err, entry) {
      if (err) {
        return callback(err);
      }

      if (!entry) {
        return callback(null, null);
      }

      try {
        entry = jsondate.parse(entry.toString());
      } catch (error) {
        if (callback) callback(error);
        return;
      }

      callback(null, entry.event || null);
    });
  },

  getValueOfKey: function (key, callback) {
    this.client.get(key, (err, value) => {
      if (err) {
        return callback(err);
      }

      if (!value) {
        return callback('No value for the key:' + key);
      }

      try {
        value = jsondate.parse(value.toString());
      } catch (err) {
        return callback(err);
      }

      return callback(null, { key, value });
    });
  },

  getValueOfEachKey: function (prefix, callback = (err, aggregateHandleFns) => {}) {
    prefix = prefix || 'default';

    var self = this;
    var uniqueKeys = {};
    var aggregateHandleFns = [];

    function scanRecursive(curs) {
      self.client.scan(curs, 'MATCH', prefix + '::*', function (err, res) {
        if (err) return callback(err);

        var cursor = res[0];
        var keys = res[1];

        if (err) {
          return callback(err);
        }

        function next() {
          // Check if we processed all keys from the redis store
          if (cursor === '0') {
            callback(null, aggregateHandleFns);
          } else {
            setImmediate(scanRecursive.bind(null, cursor));
          }
        }

        keys.forEach(key => {
          // don't reprocess an already handeled key
          if (!uniqueKeys[key] && key.indexOf('THE_LAST_SEEN_EVENT') === -1) {
            uniqueKeys[key] = true;
            aggregateHandleFns.push((cb) => self.getValueOfKey(key, cb));
          }
        });

        next();
      });
    }

    scanRecursive(0);
  },

  clear: function (prefix, callback) {
    prefix = prefix || 'default';

    var self = this;
    async.parallel([
      function (callback) {
        self.client.del('nextItemId:' + prefix, callback);
      },
      function (callback) {
        self.client.keys(prefix + '::*', function(err, keys) {
          if (err) {
            return callback(err);
          }
          async.each(keys, function (key, callback) {
            self.client.del(key, callback);
          }, callback);
        });
      }
    ], function (err) {
      if (err) {
        debug(err);
      }
      if (callback) callback(err);
    });
  }

});

module.exports = Redis;
