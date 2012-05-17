var path = require('path')
  , eventEmitter = require('../eventEmitter')
  , utils = require('../utils')
  , _ = require('underscore');

var eventDenormalizerLoader = {

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

        var eventDenormalizers = [];

        if (!path.existsSync(p)){
            return callback(null, eventDenormalizers);
        }

        utils.path.dive(p, function(err, file) {
            var eventDenormalizer = require(file);
            eventDenormalizers.push(eventDenormalizer);

            // add repository
            var repo = eventDenormalizerLoader.repository.extend({
                collectionName: eventDenormalizer.collectionName
            });
            eventDenormalizer.configure(function() {
                eventDenormalizer.use(repo);
            });

            // event binding
            var evtNames = _.map(eventDenormalizer.events, function(item) {
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
                eventDenormalizer.handle(evt); 
            }

            // bind each denormalizer event
            for(var i = 0, len = evtNames.length; i < len; i++) {
                var evtName = evtNames[i];
                eventEmitter.on('denormalize:' + evtName, action);
            }
        }, function() {
            callback(null, eventDenormalizers);
        });
    }
};

module.exports = eventDenormalizerLoader;