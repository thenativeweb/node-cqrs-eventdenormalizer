var existsSync = require('fs').existsSync || require('path').existsSync
  , eventEmitter = require('../eventEmitter')
  , utils = require('../utils')
  , _ = require('lodash');

var eventExtenderLoader = {

    configure: function(fn) {
        fn.call(this);
        return this;
    }, 

    use: function(module) {
        if (!module) return;
    
        if (module.commit) {
            this.repository = module;
        }
    }, 
    
    load: function(p, callback) {

        var eventExtenders = [];

        if (!existsSync(p)){
            return callback(null, eventExtenders);
        }

        utils.path.dive(p, function(err, file) {
            var eventExtender = require(file);
            eventExtenders.push(eventExtender);

            // add repository
            var repo = eventExtenderLoader.repository.extend({
                collectionName: eventExtender.collectionName
            });
            eventExtender.configure(function() {
                eventExtender.use(repo);
            });

            // event binding
            var evtNames = _.map(eventExtender.events, function(item) {
                if (_.isString(item)) {
                    return item;
                } else {
                    // as there is only one property in the object we could take the first
                    // (if it would have more properties this could fail - cause order is not
                    // guaranteed!!!)
                    for (var i in item) {
                        if (item.hasOwnProperty(i)) {
                            return i;
                        }
                    }
                }
            });

            function action(evt) {
                eventExtender.handle(evt);
            }

            // bind each denormalizer event
            for(var i = 0, len = evtNames.length; i < len; i++) {
                var evtName = evtNames[i];
                eventEmitter.on('extend:' + evtName, action);
                eventEmitter.register('extend:' + evtName);
            }
        }, function() {
            callback(null, eventExtenders);
        });
    }
};

module.exports = eventExtenderLoader;