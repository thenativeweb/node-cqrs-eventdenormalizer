var repository = require('viewmodel').write.create(),
    _ = require('lodash'),
    async = require('async');

function getStore(repo, opt) {
  var store = {
    getRevision: function(id, callback) {
      repo.get(id, function(err, entry) {
        if (opt && opt.revisionStart !== undefined) {
          entry.revision = entry.revision || opt.revisionStart;
          callback(err, entry);
        } else {
          callback(err, entry);
        }
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

    if (options.revisionStart === undefined) {
      options.revisionStart = 1;
    }

    repository.init(options, function(err) {
      if(err) {
        return callback(err);
      }

      var repo = repository.extend({
          collectionName: options.collectionName
      });

      callback(null, getStore(repo, options));
    });
  }

};