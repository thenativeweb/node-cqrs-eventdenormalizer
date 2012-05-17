//     lib/queue.js v0.1.0
//     (c) 2012 Adriano Raiano (adrai); under MIT License

var fs = require('fs')
  , _ = require('underscore');

// __initialize:__ Initiate communication with the database.
// 
// `initialize(self, options, callback)`
//
// - __self:__ The object that should be extended.
// - __options:__ The options can have information like host, port, etc. [optional]
// - __callback:__ `function(err, queue){}`
function initialize(self, options, callback) {

    if(_.isFunction(options)) {
        callback = options;
        options = { type: 'inMemory' };
    }

    self.collectionName = options.collectionName;

    var dbPath = __dirname + "/databases/" + options.type + ".js";

    var exists = fs.exists || require('path').exists;
    exists(dbPath, function (exists) {

        if (!exists) return callback('Implementation for db "' + options.type + '"" does not exist!');

        try {
            var db = require(dbPath);

            _.extend(self, db);

            self.connect(options, callback);
        } catch (err) {
            if (err.message.indexOf("Cannot find module") >= 0 && err.message.indexOf("'") > 0 && err.message.lastIndexOf("'") !== err.message.indexOf("'")) {
                var moduleName = err.message.substring(err.message.indexOf("'") + 1, err.message.lastIndexOf("'"));
                console.log('Please install "' + moduleName + '" to work with db implementation "' + options.type + '"!');
            }

            throw err;
        }

    });
    
}

function set(data) {
    if (arguments.length === 2) {
        this[arguments[0]] = arguments[1];
    } else {
        for(var m in data) {
            this[m] = data[m];
        }
    }
}

function get(attr) {
    return this[attr];
}

function destroy() {
    this.actionOnCommit = 'delete';
}

function fromViewModel(vm) {
    var obj = _.clone(vm);
    delete obj.actionOnCommit;
    delete obj.destroy;
    delete obj.commit;
    delete obj.set;
    delete obj.get;
    return obj;
}

module.exports = {

    write: {

        getNewViewModel: function(id) {
            return this.fromObject({ id: id, actionOnCommit: 'create', _revision: 1 });
        },

        fromViewModel: fromViewModel,
        
        fromObject: function(obj) {
            var self = this;
            var vm = _.clone(obj);
            vm.actionOnCommit = vm.actionOnCommit || 'update';
            vm.destroy = destroy;
            vm.commit = function(callback) {
                self.commit(this, callback);
            };
            vm.set = set;
            vm.get = get;
            return vm;
        },

        init: function(options, callback) {
            initialize(this, options, callback);
        }
        
    },

    read: {

        getNewViewModel: function(id) {
            return null;
        },

        fromViewModel: fromViewModel,
        
        fromObject: function(obj) {
            return obj;
        },

        init: function(options, callback) {
            initialize(this, options, callback);
        }
        
    }

};