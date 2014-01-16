var viewBuilderLoader = require('./loaders/viewBuilderLoader'),
   eventExtenderLoader = require('./loaders/eventExtenderLoader'),
   eventDispatcher = require('./eventDispatcher'),
   eventEmitter = require('./eventEmitter'),
   EventEmitter2 = require('eventemitter2').EventEmitter2,
   _ = require('lodash'),
   async = require('async'),
   queue = require('node-queue'),
   eventQueue,
   guardStore,
   viewBuilders,
   repository = require('viewmodel').write.create(),
   revisionGuardStore = require('./revisionGuardStore'),
   revisionGuard = require('./revisionGuard'),
   evtDen;

module.exports = evtDen = _.extend(new EventEmitter2({
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

    if (options.revisionGuardStore.revisionStart === undefined) {
      options.revisionGuardStore.revisionStart = 1;
    }

    eventEmitter.on('extended:*', function(evt) {
      evtDen.emit('event', evt);
    });

    eventEmitter.on('eventMissing', function(id, aggregateRevision, eventRevision, evt) {
      evtDen.emit('eventMissing', id, aggregateRevision, eventRevision, evt);
    });

    async.series([

      function(callback) {
        repository.init(options.repository, callback);
      },

      function(callback) {
        viewBuilderLoader.configure(function() {
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
        viewBuilderLoader.load(options.viewBuildersPath, { ignoreRevision: options.ignoreRevision }, function(err, vBuilders) {
          viewBuilders = vBuilders;
          callback(err);
        });
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
      // workers: eventEmitter.listeners('denormalize:' + evt.event).length,
      workers: eventEmitter.registerCount('denormalize:' + evt.event),
      event: evt
    };

    var extendersCount = eventEmitter.registerCount('extend:' + evt.event);
    if (entry.workers === 0 && extendersCount === 0) {
      eventEmitter.emit('extended:' + evt.event, evt);
      if (callback) callback(null);
      return;
    }

    if (entry.workers === 0 && extendersCount > 0) {
      eventEmitter.emit('extend:' + evt.event, evt);
      if (callback) callback(null);
      return;
    }

    if (!eventQueue) {
      if (callback) callback(null);
      revisionGuard.guard(evt);
    } else {
      eventQueue.push(evt.id, entry, function(err) {
        if (callback) callback(err);
        revisionGuard.guard(evt);
      });
    }
  },

  replay: function(evts, callback) {

    var revisionMap = {},
        groupedEvents = {};

    _.each(evts, function(evt) {
      if (evt.head && evt.head.revision) {
        revisionMap[evt.payload.id] = evt.head.revision;
      }

      var interested = _.filter(viewBuilders, function(vB) {
        return _.contains(vB.registeredEventNames, evt.event);
      });

      _.each(interested, function(inter) {
        groupedEvents[inter.id] = groupedEvents[inter.id] || [];
        groupedEvents[inter.id].push(evt);
      });
    });

    async.series([
      function(callback) {
        async.each(viewBuilders, function(viewBuilder, callback) {
          if (!groupedEvents[viewBuilder.id] || groupedEvents[viewBuilder.id].length === 0) {
            return callback(null);
          }

          viewBuilder.replay(groupedEvents[viewBuilder.id], callback);

        }, callback);
      },
      function(callback) {
        var ids = _.keys(revisionMap);
        async.each(ids, function(id, callback) {
          guardStore.getRevision(id, function(err, entry) {
            if (err) { return callback(err); }

            entry.revision = revisionMap[id] + 1;
            guardStore.saveRevision(entry, callback);
          });
        }, callback);
      }
    ], function(err) {
      if (callback) callback(err);
    });
  }

});