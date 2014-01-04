var _ = require('lodash');

var Queue = function(options) {
  this.queue = {};
  this.retries = {};
  this.options = options || { queueTimeout: 3000 };
};

Queue.prototype = {

  push: function(id, object, fn) {
    if(!this.queue[id]) this.queue[id] = [];
    this.queue[id].push(object);
    if(!this.retries[id]) this.retries[id] = {};
    if (object.id) {
      this.retries[id][object.id] = this.retries[id][object.id] || 0;
    }
    if (fn) {
      var self = this;
      (function wait() {
        setTimeout(function() {
          if (_.indexOf(self.queue[id], object) >= 0) {
            var loopCount = self.retries[id][object.id]++;
            fn(loopCount, wait);
          }
        }, self.options.queueTimeout);
      })();
    }
  },

  get: function(id) {
    return this.queue[id];
  },

  remove: function(id, object) {
    if (this.queue[id]) {
      this.queue[id].splice(_.indexOf(this.queue[id], object), 1);
    }

    if (object.id && this.retries[id] && this.retries[id][object.id]) {
      this.retries[id][object.id] = 0;
    }
  },

  clear: function() {
    this.queue = {};
  }

};

module.exports = Queue;