var eventDenormalizerLoader = require('./loaders/eventDenormalizerLoader')
  , eventExtenderLoader = require('./loaders/eventExtenderLoader')
  , eventDispatcher = require('./eventDispatcher')
  , eventEmitter = require('./eventEmitter')
  , EventEmitter2 = require('eventemitter2').EventEmitter2
  , _ = require('lodash')
  , async = require('async')
  , queue = require('node-queue')
  , eventQueue
  , guardStore
  , repository = require('viewmodel').write.create()
  , revisionGuardStore = require('./revisionGuardStore')
  , revisionGuard = require('./revisionGuard')
  , ctxEvtDen;

module.exports = ctxEvtDen = _.extend(new EventEmitter2({
        wildcard: true,
        delimiter: ':',
        maxListeners: 1000 // default would be 10!
    }), {

    initialize: function(options, callback) {
        if (_.isFunction(options)) {
            callback = options;
        }

        var defaults = {
            eventQueue: { type: 'inMemory', collectionName: 'events' },
            repository: { type: 'inMemory' },
            revisionGuardStore: { type: 'inMemory', collectionName: 'revisionguard' },
            ignoreRevision: false,
            disableQueuing: false,
            revisionGuardQueueTimeout: 3000,
            revisionGuardQueueTimeoutMaxLoops: 3
        };

        _.defaults(options, defaults);

        eventEmitter.on('extended:*', function(evt) {
            ctxEvtDen.emit('event', evt);
        });

        eventEmitter.on('eventMissing', function(id, aggregateRevision, eventRevision, evt) {
            ctxEvtDen.emit('eventMissing', id, aggregateRevision, eventRevision, evt);
        });

        async.series([

            function(callback) {
                repository.init(options.repository, callback);
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
                eventDenormalizerLoader.load(options.denormalizersPath, { ignoreRevision: options.ignoreRevision }, callback);
            },

            function(callback) {
                if (options.disableQueuing) {
                    eventQueue = null;
                    eventDispatcher.initialize({}, callback);
                } else {
                    queue.connect(options.eventQueue, function(err, evtQueue) {
                        eventQueue = evtQueue;
                        eventDispatcher.configure(function() {
                            this.use(evtQueue);
                        });
                        eventDispatcher.initialize({}, callback);
                    });
                }
            }

        ], function(err) {
            revisionGuardStore.connect(options.revisionGuardStore, function(err, revGuardStore) {
                guardStore = revGuardStore;
                revisionGuard.configure(function() {
                    this.use(revGuardStore);
                    this.use(eventDispatcher);
                    this.use(eventQueue);
                });
                revisionGuard.initialize({
                    ignoreRevision: options.ignoreRevision,
                    queueTimeout: options.revisionGuardQueueTimeout,
                    queueTimeoutMaxLoops: options.revisionGuardQueueTimeoutMaxLoops
                }, callback);
            });
        });
    },

    denormalize: function(evt, callback) {
        var entry = {
            workers: eventEmitter.registerCount('denormalize:' + evt.event),
            event: evt
        };

        var extendersCount = eventEmitter.registerCount('extend:' + evt.event);
        if (entry.workers === 0 && extendersCount === 0) {
            return callback(null);
        }

        if (entry.workers === 0 && extendersCount > 0) {
            return callback(null);
        }

        if (!eventQueue) {
            callback(null);
            revisionGuard.guard(evt);
        } else {
            eventQueue.push(evt.id, entry, function(err) {
                callback(err);
                revisionGuard.guard(evt);
            });
        }
    },


    // TODO: Think about replay and multiple processes!!!!!!

    // TODO: replay funciton?!????!??
    replay: function(evts, callback) {}

    // TODO: for replay delete viewmodel and guardStore!!!!
    // deleteViewModel: function(collectionName, id, callback) {},
    // clearViewModels: function(collectionName, callback) {}

});