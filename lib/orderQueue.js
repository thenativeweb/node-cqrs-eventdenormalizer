'use strict';

var debug = require('debug')('denormalizer:orderQueue'),
  _ = require('lodash');

function Queue (options) {
  this.queue = {};
  this.retries = {};
  this.options = options || { queueTimeout: 3000 };
}

Queue.prototype = {

  push: function (id, objId, object, fn) {
    if(!this.queue[id]) this.queue[id] = [];
    this.queue[id].push({ id: objId, payload: object });
    if(!this.retries[id]) this.retries[id] = {};
    this.retries[id][objId] = this.retries[id][objId] || 0;
    if (fn) {
      var self = this;
      (function wait() {
        setTimeout(function() {
          var found = _.find(self.queue[id], function (o) {
            return o.id === objId;
          });
          if (found) {
            var loopCount = self.retries[id][objId]++;
            fn(loopCount, wait);
          }
        }, self.options.queueTimeout);
      })();
    }
  },

  get: function (id) {
    return this.queue[id] ? this.queue[id].payload : null;
  },

  remove: function (id, objId) {
    if (this.queue[id]) {
      _.remove(this.queue[id], function (o) {
        return o.id === objId;
      });
    }

    if (object.id && this.retries[id] && this.retries[id][objId]) {
      this.retries[id][objId] = 0;
    }
  },

  clear: function() {
    this.queue = {};
    this.retries = {};
  }

};

module.exports = Queue;
