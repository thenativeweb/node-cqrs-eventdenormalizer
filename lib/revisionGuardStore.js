var repository = require('viewmodel').write.create(),
    _ = require('lodash'),
    async = require('async');

function getStore(repo) {
  var store = {
    getRevision: function(id, callback) {
      repo.get(id, function(err, entry) {
        if (err) {
          return callback(err);
        }
        entry.revision = entry.revision || 1;
        callback(null, entry);
      });
    },
    saveRevision: function(toSave, callback) {
      repo.commit(toSave, callback);
    },
    deleteRevision: function(toDelete, callback) {
      if (toDelete.id) {
        toDelete.destroy();
        repo.commit(toDelete, callback);
      } else {
        repo.get(toDelete, function(err, entry) {
          if (err) {
            return callback(err);
          }
          entry.destroy();
          repo.commit(entry, callback);
        });
      }
    },
    clear: function(callback) {
      repo.find(function(err, entries) {
        if (err) {
          return callback(err);
        }

        async.each(entries, function(entry, callback) {
          entry.destroy();
          repo.commit(entry, callback);
        }, callback);
      });
    }
  };

  return store;
}

module.exports = {

  connect: function(options, callback) {

    if (_.isFunction(options)) {
      callback = options;
      options = {};
    }

    var defaults = {
      type: 'inMemory',
      collectionName: 'revisionguard'
    };

    _.defaults(options, defaults);

    repository.init(options, function(err) {
      if(err) {
        return callback(err);
      }

      var repo = repository.extend({
          collectionName: options.collectionName
      });

      callback(null, getStore(repo));
    });
  }

};