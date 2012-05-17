var eventDenormalizerLoader = require('./loaders/eventDenormalizerLoader')
  , eventExtenderLoader = require('./loaders/eventExtenderLoader')
  , eventDispatcher = require('./eventDispatcher')
  , eventEmitter = require('./eventEmitter')
  , EventEmitter2 = require('eventemitter2').EventEmitter2
  , _ = require('underscore')
  , async = require('async')
  , queue = require('node-queue')
  , repository = require('viewmodel').write
  , ctxEvtDen;

module.exports = ctxEvtDen = _.extend(new EventEmitter2({
        wildcard: true,
        delimiter: ':',
        maxListeners: 1000 // default would be 10!
    }), {

    initialize: function(options, callback) {

        if(_.isFunction(options)) {
            callback = options;
        }

        var defaults = {
            eventQueue: { type: 'inMemory', collectionName: 'events' },
            repository: { type: 'inMemory' }
        };

        _.defaults(options, defaults);

        eventEmitter.on('extended:*', function(evt) {
            ctxEvtDen.emit('event', evt);
        });

        eventEmitter.on('handlingMissed:*', function(evt, id) {
            ctxEvtDen.emit('handlingMissed:' + evt.event, evt, id);
        });

        async.series([

            function(callback) {
                if (!repository.isConnected) {
                    repository.init(options.repository, callback);
                } else {
                    callback(null);
                }
            },

            function(callback) {
                eventDenormalizerLoader.configure(function() {
                    this.use(repository);
                });
                eventExtenderLoader.configure(function() {
                    this.use(repository);
                });
                callback(null);
            },

            function(callback) {
                if (options.extendersPath) {
                    eventExtenderLoader.load(options.extendersPath, callback);
                } else {
                    callback(null);
                }
            },
            
            function(callback) {
                eventDenormalizerLoader.load(options.denormalizersPath, callback);
            }

        ], function(err) {
            queue.connect(options.eventQueue, function(err, eventQueue) {
                eventDispatcher.configure(function() {
                    this.use(eventQueue);
                });
                eventDispatcher.initialize({}, callback);
            });
        });

    },

    denormalize: function(evt, callback) {
        eventDispatcher.queueEvent(evt, function(err) {
            if (callback) callback(null);
        });
    }

});