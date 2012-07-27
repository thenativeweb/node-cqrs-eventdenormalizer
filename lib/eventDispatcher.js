var async = require('async')
  , _ = require('lodash')
  , eventEmitter = require('./eventEmitter')
  , selfExtendHandle;

module.exports = {

    configure: function(fn) {
        fn.call(this);
        return this;
    }, 

    use: function(module) {
        if (!module) return;
    
        if (module.push) {
            this.eventQueue = module;
        }
    },

    initialize: function(options, callback) {
        var self = this;

        if (!callback) callback = options;

        eventEmitter.on('extend:*', selfExtendHandle = function(evt) {
            var listeners = _.filter(eventEmitter.listeners('extend:' + evt.event), function(listener) {
                return listener !== selfExtendHandle;
            });

            if (listeners.length !== 1) {
                eventEmitter.emit('extended:' + evt.event, evt);
            }
        });

        eventEmitter.on('denormalized:*', function(evt) {
            self.eventQueue.decrement(evt.id, function(err, removed) {
                if (removed) {
                    eventEmitter.emit('extend:' + evt.event, evt);
                }
            });
        });

        this.resetWorkers(function(err) {
            self.reEmitEvents(callback);
        });
    },

    resetWorkers: function(callback) {
        var self = this;

        this.eventQueue.getAll(function(err, items) {
            async.forEach(items, function(item, cb) {
                item.data.workers = eventEmitter.listeners('denormalize:' + item.data.event.event).length;
                self.eventQueue.push(item.id, item.data, cb);
            }, callback);
        });
    },

    reEmitEvents: function(callback) {
        this.eventQueue.getAll(function(err, items) {
            async.forEach(items, function(item, cb) {
                eventEmitter.emit('denormalize:' + item.data.event.event, item.data.event);
                cb();
            }, callback);
        });
    },

    queueEvent: function(evt, callback) {

        var entry = {
            workers: eventEmitter.listeners('denormalize:' + evt.event).length,
            event: evt
        };

        var extendersCount = _.filter(eventEmitter.listeners('extend:' + evt.event), function(listener) {
            return listener !== selfExtendHandle;
        }).length;

        if (entry.workers === 0 && extendersCount === 0) {
            eventEmitter.emit('extended:' + evt.event, evt);
            return callback(null);
        }

        if (entry.workers === 0 && extendersCount > 0) {
            eventEmitter.emit('extend:' + evt.event, evt);
            return callback(null);
        }

        this.eventQueue.push(evt.id, entry, function(err) {
            eventEmitter.emit('denormalize:' + entry.event.event, entry.event);
            callback(err);
        });
    }

};