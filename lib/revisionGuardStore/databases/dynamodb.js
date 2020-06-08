var util = require('util'),
  Store = require('../base'),
  debug = require('debug')('denormalizer:revisionGuardStore:dynamodb'),
  ConcurrencyError = require('../../errors/concurrencyError'),
  async = require('async'),
  _ = require('lodash'),
  uuid = require('uuid').v4,
  aws = Store.use('aws-sdk'),
  collections = [];

function DynamoDB(options) {
  var awsConf = {
    region: 'ap-southeast-2',
    endpointConf: {}
  };

  if (process.env['AWS_DYNAMODB_ENDPOINT']) {
    awsConf.endpointConf = { endpoint: process.env['AWS_DYNAMODB_ENDPOINT'] };
  }

  this.options = _.defaults(options, awsConf);

  var defaults = {
    tableName: 'revision',
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 3
  };

  this.options = _.defaults(this.options, defaults);
  this.store = {};
  this.lastEvent = null;
}
util.inherits(DynamoDB, Store);

_.extend(DynamoDB.prototype, {

  connect: function(callback) {
    var self = this;
    self.client = new aws.DynamoDB(self.options.endpointConf);
    var clientDefaults = { service: self.client }
    var clientOptions = _.defaults(this.options.clientConf, clientDefaults);
    self.documentClient = new aws.DynamoDB.DocumentClient(clientOptions);
    self.isConnected = true;
    self.emit('connect');
    if (callback) callback(null, self);
  },

  disconnect: function(callback) {
    this.emit('disconnect');
    if (callback) callback(null);
  },

  get: function(prefix, id, callback) {
    prefix = prefix || 'default';

    var self = this;

    if (_.isFunction(id)) {
      callback = id;
      id = null;
    }

    if (!id) {
      id = uuid().toString();
    }
    self.checkConnection(function(err) {
      if (err) {
        return callback(err);
      }

      id = prefix + '::' + id;

      var params = {
        TableName: self.options.tableName,
        Key: {
          HashKey: id,
          RangeKey: id
        }
      };

      self.documentClient.get(params, function(err, data) {
        if (err) {
          if (callback) callback(err);
          return;
        } else {
          if (!data || !data.Item) {
            return callback(null, null)  ;
          }
          callback(null, data.Item.Revision);
        }
      });
    });
  },

  set: function (prefix, id, data, revision, oldRevision, callback) {
    prefix = prefix || 'default';

    var self = this;

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

    self.checkConnection(function(err) {
      if (err) {
        return callback(err);
      }
      var entity = {
        TableName: self.options.tableName,
        Item: {
          HashKey: id,
          RangeKey: id,
          Revision: revision
        },
        ConditionExpression: 'attribute_not_exists(HashKey) OR Revision = :oldRevision',
        ExpressionAttributeValues: {
          ':oldRevision': oldRevision
        }
      };

      if (data) {
        entity.Item.Data = data;
      }

      self.documentClient.put(entity, function(err, data) {
        if (err) {
          if (err.code == 'ConditionalCheckFailedException')
            err = new ConcurrencyError();
          return callback(err);
        }
        return callback(err);
      });
    });
  },

  saveLastEvent: function (prefix, evt, callback) {
    prefix = prefix || 'default';

    var self = this;
    self.checkConnection(function(err) {
      if (err) {
        return callback(err);
      }
      var entity = {
        TableName: self.options.tableName,
        Item: {
          HashKey: prefix + '::' + 'THE_LAST_SEEN_EVENT',
          RangeKey: prefix + '::' + 'THE_LAST_SEEN_EVENT',
          event: evt
        }
      };

      self.documentClient.put(entity, function(err, data) {
        if (err) {
          if (err.code == 'ConditionalCheckFailedException')
            err = new ConcurrencyError();
          return callback(err);
        }
        return callback(err);
      });
    });
  },

  getLastEvent: function (prefix, callback) {
    prefix = prefix || 'default';

    var self = this;
    self.checkConnection(function(err) {
      if (err) {
        return callback(err);
      }
      var params = {
        TableName: self.options.tableName,
        Key: {
          HashKey: prefix + '::' + 'THE_LAST_SEEN_EVENT',
          RangeKey: prefix + '::' + 'THE_LAST_SEEN_EVENT'
        }
      };

      self.documentClient.get(params, function(err, data) {
        if (err) {
          if (callback) callback(err);
          return;
        } else {
          if (!data || !data.Item) {
            return callback(null, null)  ;
          }
          callback(null, data.Item.event);
        }
      });
    });
  },

  checkConnection: function(callback) {
    var self = this;

    if (collections.indexOf(self.collectionName) >= 0) {
      if (callback) callback(null);
      return;
    }

    createTableIfNotExists(
      self.client,
      RevisionTableDefinition(self.options.tableName, self.options),
      function(err){
        if (err) {
          // ignore ResourceInUseException
          // as there could be multiple requests attempt to create table concurrently
          if (err.code === 'ResourceInUseException') {
            return callback(null);
          }

          return callback(err);
        }

        if (collections.indexOf(self.collectionName) < 0) {
          collections.push(self.collectionName);
        }

        return callback(null);
      }
    );
  },

  clear: function(prefix, callback) {
    prefix = prefix || 'default';

    var self = this;
    self.checkConnection(function(err) {
      if (err) {
        return callback(err);
      }

      var query = {
        TableName: self.options.tableName
      };

      self.documentClient.scan(query, function(err, entities) {
        if (err) {
          return callback(err);
        }
        async.each(
          entities.Items,
          function(entity, callback) {
            if (entity.HashKey.indexOf(prefix) >= 0) {
              return callback(null);
            }

            var params = {
              TableName: self.options.tableName,
              Key: { HashKey: entity.HashKey, RangeKey: entity.RangeKey }
            };
            self.documentClient.delete(params, function(error, response) {
              callback(error);
            });
          },
          function(error) {
            callback(error);
          }
        );
      });
    });
  }
});

var createTableIfNotExists = function(client, params, callback) {
  var exists = function(p, cbExists) {
    client.describeTable({ TableName: p.TableName }, function(err, data) {
      if (err) {
        if (err.code === 'ResourceNotFoundException') {
          cbExists(null, { exists: false, definition: p });
        } else {
          cbExists(err);
        }
      } else {
        cbExists(null, { exists: true, description: data });
      }
    });
  };

  var create = function(r, cbCreate) {
    if (!r.exists) {
      client.createTable(r.definition, function(err, data) {
        if (err) {
          cbCreate(err);
        } else {
          cbCreate(null, {
            Table: {
              TableName: data.TableDescription.TableName,
              TableStatus: data.TableDescription.TableStatus
            }
          });
        }
      });
    } else {
      cbCreate(null, r.description);
    }
  };

  var active = function(d, cbActive) {
    var status = d.Table.TableStatus;
    async.until(
      function() {
        return status === 'ACTIVE';
      },
      function(cbUntil) {
        client.describeTable({ TableName: d.Table.TableName }, function(
          err,
          data
        ) {
          if (err) {
            cbUntil(err);
          } else {
            status = data.Table.TableStatus;
            setTimeout(cbUntil, 1000);
          }
        });
      },
      function(err, r) {
        if (err) {
          return cbActive(err);
        }
        cbActive(null, r);
      }
    );
  };

  async.compose(active, create, exists)(params, function(err, result) {
    if (err) callback(err);
    else callback(null, result);
  });
};

function RevisionTableDefinition(tableName, opts) {
  var def = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'HashKey', KeyType: 'HASH' },
      { AttributeName: 'RangeKey', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'HashKey', AttributeType: 'S' },
      { AttributeName: 'RangeKey', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: opts.ReadCapacityUnits,
      WriteCapacityUnits: opts.WriteCapacityUnits
    }
  };

  return def;
}

module.exports = DynamoDB;
