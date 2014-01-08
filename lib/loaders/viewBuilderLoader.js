var existsSync = require('fs').existsSync || require('path').existsSync
  , eventEmitter = require('../eventEmitter')
  , utils = require('../utils')
  , _ = require('lodash');

var viewBuilderLoader = {

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
    
    load: function(p, options, callback) {

        if (!callback) {
            callback = options;
            options = { ignoreRevision: false };
        }

        var viewBuilders = [];

        if (!existsSync(p)){
            return callback(null, viewBuilders);
        }

        utils.path.dive(p, function(err, file) {
            var viewBuilder = require(file);
            viewBuilder.setOptions(options);
            viewBuilders.push(viewBuilder);

            // add repository
            var repo = viewBuilderLoader.repository.extend({
                collectionName: viewBuilder.collectionName
            });
            viewBuilder.configure(function() {
                viewBuilder.use(repo);
            });

            // event binding
            var evtNames = _.map(viewBuilder.events, function(item) {
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
                viewBuilder.handle(evt);
            }

            // bind each denormalizer event
            for(var i = 0, len = evtNames.length; i < len; i++) {
                var evtName = evtNames[i];
                eventEmitter.on('denormalize:' + evtName, action);
                eventEmitter.register('denormalize:' + evtName);
            }
        }, function() {
            callback(null, viewBuilders);
        });
    }
};

module.exports = viewBuilderLoader;