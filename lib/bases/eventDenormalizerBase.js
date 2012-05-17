var _ = require('underscore')
  , eventEmitter = require('../eventEmitter')
  , Queue = require('../orderQueue');

var EventDenormalizer = {};
EventDenormalizer.prototype = {

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

    create: function(evt, aux, callback) {
        return this.defaultAction(evt, aux, 'create', callback);
    },

    update: function(evt, aux, callback) {
        return this.defaultAction(evt, aux, 'update', callback);
    },

    'delete': function(evt, aux, callback) {
        return this.defaultAction(evt, aux, 'delete', callback);
    },

    defaultAction: function(evt, aux, action, callback) {

        var self = this;
        aux.repository.get(evt.payload.id, function(err, vm) {
            // If the view model has just been created (i.e. it has not been
            // saved yet), and it shall be deleted, simply discard it and
            // return.
            if((vm.actionOnCommit === 'create') && (action === 'delete')) {
                return callback(null);
            }

            if(!aux.defaultQueuingStrategy(evt, vm, callback)) {
                return;
            }

            // set the next expected revision
            aux.defaultRevisionUpdateStrategy(vm, evt);

            if(action !== 'delete') {
                _.extend(vm, evt.payload);
            } else {
                vm.destroy();
            }

            aux.repository.commit(vm, function(err) {
                callback(err); // done this event

                // dequeue 
                aux.defaultDequeuingStrategy(vm);
            });
        });

    },

    _getAux: function() {
        var self = this;

        this._aux = this._aux || {
            repository: self.repository,

            queueEvent: function(id, evt) {
                self.queue.push(id, evt);
            },
            getQueuedEvents: function(id) {
                return self.queue.get(id);
            },
            removeQueuedEvent: function(id, evt) {
                self.queue.remove(id, evt);
            },

            defaultQueuingStrategy: function(evt, vm, callback) {
                if(evt.head.revision < vm._revision) { 
                    callback(null); 
                    return false;
                }
                if(evt.head.revision > vm._revision) {
                    this.queueEvent(vm.id, evt);
                    return false;
                }
                return true;
            },
            defaultDequeuingStrategy: function(vm) {
                var pendingEvents = this.getQueuedEvents(vm.id);
                if(!pendingEvents) return;

                var nextEvent = _.find(pendingEvents, function(item) {
                    return item.head.revision === vm._revision;
                });
                if(!nextEvent) return; 

                this.removeQueuedEvent(vm.id, nextEvent); // dequeue event
                self.handle(nextEvent); // handle event
            },
            defaultRevisionUpdateStrategy: function(vm, evt) {
                vm._revision = evt.head.revision + 1;
            }
        };

        return this._aux;
    },

    handle: function(evt) {

        // Map events to function names:
        // - For the event handler matching the current event, its name is returned
        // - For all other event handlers, undefined is returned
        var fnNames = _.map(this.events, function(item) {
                if (_.isString(item) && item === evt.event) {
                    return item;
                } else if (item[evt.event]) {
                    return item[evt.event];
                }
            }
        );

        // Reduce function names to function name:
        // - Replace all undefineds by an empty string
        // - Keep all non-undefined values
        //
        // NOTE: This will fail if multiple event handlers match the current event,
        //       but this is not allowed anyway, so it can only happen on error.
        var fnName = _.reduce(fnNames, function(memo, item) {
            return memo + (item || '');
        }, '');

        if(this[fnName]) {
            // Call the event handler found by map-reduce.
            this[fnName](evt, this._getAux(), function(err) {
                eventEmitter.emit('denormalized:' + evt.event, evt);
            });
        } else {
            throw(new Error('missing handle function'));
        }
       
    }

};

module.exports = {

    extend: function(obj) {
        var newObj = _.extend(_.clone(EventDenormalizer.prototype), obj);

        newObj.queue = new Queue();

        return newObj;
    }

};