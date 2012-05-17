//     lib/databases/inMemory.js v0.1.0
//     (c) 2012 Adriano Raiano (adrai); under MIT License

var _ = require('underscore')
  , store = {}
  , idCounter = 0;

function deepFind(obj, pattern) {
    var found;

    if (pattern) {
        var parts = pattern.split('.');
        
        found = obj;
        for (var i in parts) {
            found = found[parts[i]];
            if (_.isArray(found)) {
                found = _.filter(found, function(item) {
                    var deepFound = deepFind(item, parts.slice(i + 1).join('.'));
                    if (deepFound) {
                        return true;
                    }
                    return false;
                });
                break;
            } 

            if (!found) {
                break;
            }
        }
    }

    return found;
}

module.exports = {

    // __connect:__ Initiate communication with the database.
    // 
    // `db.connect(options, callback)`
    //
    // - __options:__ The options can have information like host, port, etc. [optional]
    // - __callback:__ `function(err, queue){}`
    connect: function(options, callback) {
        if(_.isFunction(options)) {
            callback = options;
        }
        this.isConnected = true;
        if (callback) callback(null, this);
    },

    // __getNewId:__ Use this function to obtain a new id.
    // 
    // `repo.getNewId(callback)`
    //
    // - __callback:__ `function(err, id){}`
    getNewId: function(callback) {
        this.checkConnection();

        if (callback) callback(null, (idCounter++).toString());
    },

    // __get:__ Use this function to get the viewmodel.
    // 
    // `repo.get(id, callback)`
    //
    // - __id:__ The id to identify the viewmodel.
    // - __callback:__ `function(err, vm){}`
    get: function(id, callback) {
        this.checkConnection();

        if(_.isFunction(id)) {
            callback = id;
            id = (idCounter++).toString();
        }

        var obj = store[this.collectionName] ? store[this.collectionName][id] : undefined;
        if(!obj) {
            return callback(null, this.getNewViewModel(id));
        }

        callback(null, this.fromObject(obj));
    },

    // __find:__ Use this function to find viewmodels.
    // 
    // `repo.find(query, callback)`
    //
    // - __query:__ The query to find the viewmodels.
    // - __callback:__ `function(err, vms){}`
    find: function(query, callback) {
        this.checkConnection();

        callback = callback || query;

        // Bind to data source
        var vms = store[this.collectionName];

        // Filter for query object
        if(arguments.length === 2) {
            vms = _.filter(vms, function(vm) {
                var deepFound = deepFind(vm, _.keys(query)[0]);
                if (_.isArray(deepFound) && deepFound.length > 0) {
                    return true;
                } else if (deepFound === _.values(query)[0]) {
                    return true;
                }
                return false;
            });
        }

        var self = this;

        // Map to view models
        vms = _.map(vms, function(value) {
            return self.fromObject(value);
        });

        callback(null, vms);
    },

    // __commit:__ Use this function to commit a viewmodel.
    // 
    // `repo.commit(vm, callback)`
    //
    // - __vm:__ The viewmodel that should be commited.
    // - __callback:__ `function(err){}`
    commit: function(vm, callback) {
        this.checkConnection();

        var col = store[this.collectionName];
        if (!col) {
            col = {};
            store[this.collectionName] = col;
        }

        if(!vm.actionOnCommit) return callback(new Error());

        switch(vm.actionOnCommit) {
            case 'delete':
                delete col[vm.id];
                break;
            case 'create':
                // Intended Fall-through
            case 'update':
                col[vm.id] = this.fromViewModel(vm);
                break;
            default:
                return callback(new Error());
        }

        callback(null);
    },

    // __checkConnection:__ Use this function to check if all is initialized correctly.
    // 
    // `this.checkConnection()`
    checkConnection: function() {
    },

    // __extend:__ Use this function to extend this repository with the appropriate collectionName.
    // 
    // `repo.extend(obj)`
    //
    // - __obj:__ The object that should be extended.
    extend: function(obj) {
        return _.extend(_.clone(this), obj);
    }

};