//     lib/databases/mongoDb.js v0.1.0
//     (c) 2012 Adriano Raiano (adrai); under MIT License

var mongo = require('mongodb')
  , ObjectID = mongo.BSONPure.ObjectID
  , _ = require('underscore');

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

        var defaults = {
            host: 'localhost',
            port: 27017,
            dbName: 'context'
        };
        
        _.defaults(options, defaults);

        this.isConnected = false;
        var self = this;
        var server = new mongo.Server(options.host, options.port, {});
        new mongo.Db(options.dbName , server, {}).open(function(err, client) {
            if (err) {
                if (callback) callback(err);
            } else {
                self.client = client;
                self.isConnected = true;
                if (callback) callback(null, self);
            }        
        });

    },

    // __getNewId:__ Use this function to obtain a new id.
    // 
    // `repo.getNewId(callback)`
    //
    // - __callback:__ `function(err, id){}`
    getNewId: function(callback) {
        this.checkConnection();
        
        callback(null, new ObjectID().toString());
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
            id = new ObjectID().toString();
        }

        var self = this;

        this.collection.findOne({ _id: id }, function(err, obj) {

            if(!obj) {
                return callback(null, self.getNewViewModel(id));
            }

            callback(null, self.fromObject(obj));

        });

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
        query = arguments.length === 2 ? query: null;

        var self = this;

        this.collection.find(query).toArray(function(err, vms) {

            // Map to view models
            vms = _.map(vms, function(value) {
                return self.fromObject(value);
            });

            callback(err, vms);

        });

    },

    // __commit:__ Use this function to commit a viewmodel.
    // 
    // `repo.commit(vm, callback)`
    //
    // - __vm:__ The viewmodel that should be commited.
    // - __callback:__ `function(err){}`
    commit: function(vm, callback) {

        this.checkConnection();
        
        if(!vm.actionOnCommit) return callback(new Error());

        switch(vm.actionOnCommit) {
            case 'delete':
                this.collection.remove({ _id: vm.id }, { safe: true }, callback);
                break;
            case 'create':
                // Intended Fall-through
            case 'update':
                var obj = this.fromViewModel(vm);
                obj._id = obj.id;
                this.collection.save(obj, { safe: true }, callback);
                break;
            default:
                return callback(new Error());
        }

    },

    // __checkConnection:__ Use this function to check if all is initialized correctly.
    // 
    // `this.checkConnection()`
    checkConnection: function() {
        if(!this.collection) {
            this.collection = new mongo.Collection(this.client, this.collectionName);
        }
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