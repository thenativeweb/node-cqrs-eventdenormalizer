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

        if (!callback) {
            callback = options;
            options = {};
        }

        this.options = options ||  {};

        eventEmitter.on('extend:*', selfExtendHandle = function(evt) {
            // var listeners = _.filter(eventEmitter.listeners('extend:' + evt.event), function(listener) {
            //     return listener !== selfExtendHandle;
            // });

            // if (listeners.length !== 1) {
            if (eventEmitter.registerCount('extend:' + evt.event) === 0) {
                eventEmitter.emit('extended:' + evt.event, evt);
            }
        });

        eventEmitter.on('denormalized:*', function(evt) {
            if (self.eventQueue) {
                self.eventQueue.decrement(evt.id, function(err, removed) {
                    if (removed) {
                        eventEmitter.emit('extend:' + evt.event, evt);
                        eventEmitter.emit('finishedDenormalization:' + evt.event + ':' + evt.id, evt);
                    }
                });
            } else {
                eventEmitter.emit('extend:' + evt.event, evt);
                eventEmitter.emit('finishedDenormalization:' + evt.event + ':' + evt.id, evt);
            }
        });

        if (this.eventQueue) {
            this.resetWorkers(function(err) {
                self.reEmitEvents(callback);
            });
        } else {
            callback(null);
        }
    },

    resetWorkers: function(callback) {
        var self = this;

        if (this.eventQueue) {
            this.eventQueue.getAll(function(err, items) {
                async.forEach(items, function(item, cb) {
                    // item.data.workers = eventEmitter.listeners('denormalize:' + item.data.event.event).length;
                    item.data.workers = eventEmitter.registerCount('denormalize:' + item.data.event.event);
                    self.eventQueue.push(item.id, item.data, cb);
                }, callback);
            });
        } else {
            callback(null);
        }
    },

    reEmitEvents: function(callback) {
        if (this.eventQueue) {
            this.eventQueue.getAll(function(err, items) {
                async.forEach(items, function(item, cb) {
                    eventEmitter.emit('denormalize:' + item.data.event.event, item.data.event);
                    cb();
                }, callback);
            });
        } else {
            callback(null);
        }
    },

    dispatch: function(evt, callback) {

        var entry = {
            // workers: eventEmitter.listeners('denormalize:' + evt.event).length,
            workers: eventEmitter.registerCount('denormalize:' + evt.event),
            event: evt
        };

        // var extendersCount = _.filter(eventEmitter.listeners('extend:' + evt.event), function(listener) {
        //     return listener !== selfExtendHandle;
        // }).length;

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

        eventEmitter.emit('denormalize:' + entry.event.event, entry.event);
        if (callback) callback(null);
    }

};