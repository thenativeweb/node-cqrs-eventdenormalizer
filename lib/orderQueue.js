var _ = require('underscore')
  , eventEmitter = require('./eventEmitter');

var Queue = function(options) {
    this.queue = {};
    this.options = options || { queueTimeout: 3000 };
};

Queue.prototype = {

    push: function(id, object) {
        if(!this.queue[id]) this.queue[id] = [];
        this.queue[id].push(object);
        var self = this;
        setTimeout(function() {
            if (_.indexOf(self.queue[id], object) >= 0) {
                eventEmitter.emit('handlingMissed:' + object.event, object, id);
            }
        }, this.options.queueTimeout);
    },

    get: function(id) {
        return this.queue[id];
    },

    remove: function(id, object) {
        if (this.queue[id]) {
            this.queue[id].splice(_.indexOf(this.queue[id], object), 1);
        }
    },

    clear: function() {
        this.queue = {};
    }

};
module.exports = Queue;