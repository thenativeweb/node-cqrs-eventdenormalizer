var _ = require('underscore')
  , eventEmitter = require('../eventEmitter');

var EventExtender = {};
EventExtender.prototype = {

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

    _getAux: function() {
        var self = this;

        this._aux = this._aux || {
            repository: self.repository
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
            this[fnName](evt, this._getAux(), function(err, extEvt) {
                extEvt = extEvt || evt;
                eventEmitter.emit('extended:' + extEvt.event, extEvt);
            });
        } else if(this.defaultAction) {
            // Call the event handler found by map-reduce.
            this.defaultAction(evt, this._getAux(), function(err, extEvt) {
                extEvt = extEvt || evt;
                eventEmitter.emit('extended:' + extEvt.event, extEvt);
            });
        } else {
            eventEmitter.emit('extended:' + evt.event, evt);
        }
       
    }

};

module.exports = {

    extend: function(obj) {
        return _.extend(_.clone(EventExtender.prototype), obj);
    }

};