var _ = require('lodash'),
    Queue = require('./orderQueue'),
    eventEmitter = require('./eventEmitter');

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

module.exports = {

  _getAux: function() {
    var self = this;

    this._aux = this._aux || {

      finishGuard: function(evt, entry, callback) {
        var aux = self._getAux();

        function finish() {
          aux.revisionUpdateStrategy(entry, evt);

          self.store.saveRevision(entry, function(err) {
            if (err && err.name === 'ConcurrencyError') {
              setTimeout(function() {
                aux.retryGuard(evt);
              }, 100);
              return;
            }
            if (err) {
              throw err;
            }

            aux.dequeuingStrategy(entry);
          });
        }

        // if (eventEmitter.listeners('denormalize:' + evt.event).length === 0) {
        if (eventEmitter.registerCount('denormalize:' + evt.event) === 0) {
          finish();
        } else {
          eventEmitter.once('finishedDenormalization:' + evt.event + ':' + evt.id, finish);
        }

        self.eventDispatcher.dispatch(evt, callback);
      },

      retryGuard: function(evt, callback) {
        self.store.getRevision(evt.payload.id, function(err, entry) {
          function proceed(entry) {
            var aux = self._getAux();
            if (aux.wouldQueue(evt, entry)) {
              if (callback) callback(true, entry);
              return;
            }

            aux.finishGuard(evt, entry, callback);
          }

          if (!entry.revision && evt.head.revision !== 1) {
            var max = (self.options.queueTimeout * self.options.queueTimeoutMaxLoops) / 3;
            setTimeout(function() {
              self.store.getRevision(evt.payload.id, function(err, entry) {
                proceed(entry);
              });
            }, randomBetween(0, max));
          } else {
            proceed(entry);
          }
        });
      },

      queueEvent: function(id, evt) {
        var aux = self._getAux();

        self.queue.push(id, evt, function(loopCount, waitAgain) {
          aux.retryGuard(evt, function(err, entry) {
            if (err) {
              if (loopCount <= self.options.queueTimeoutMaxLoops) {
                return waitAgain();
              }
              // try to replay depending from id and evt...
              eventEmitter.emit('eventMissing', id, entry.revision, evt.head ? evt.head.revision : null, evt);
            }
          });
        });
      },
      getQueuedEvents: function(id) {
        return self.queue.get(id);
      },
      removeQueuedEvent: function(id, evt) {
        self.queue.remove(id, evt);
      },

      alreadyDenormalized: function(evt, callback) {
        if (!self.eventQueue) {
          if (callback) callback(null);
          return;
        }

        self.eventQueue.remove(evt.id, function(err, removed) {
          if (callback) callback(err);
        });
      },

      wouldQueue: function(evt, entry) {
        if (self.options.ignoreRevision) {
          return false;
        }

        if (!entry.revision) {
          return false;
        }
        if (evt.head && evt.head.revision < entry.revision) {
          return false;
        }
        if (evt.head && evt.head.revision > entry.revision) {
          return true;
        }
        return false;
      },
      queuingStrategy: function(evt, entry) {
        if (self.options.ignoreRevision) {
          return true;
        }

        if (!entry.revision) {
          return true;
        }
        if (evt.head && evt.head.revision < entry.revision) {
          var aux = self._getAux();
          aux.alreadyDenormalized(evt);
          return false;
        }
        if (evt.head && evt.head.revision > entry.revision) {
          this.queueEvent(entry.id, evt);
          return false;
        }
        return true;
      },
      dequeuingStrategy: function(entry) {
        var pendingEvents = this.getQueuedEvents(entry.id);
        if (!pendingEvents) return;

        var nextEvent = _.find(pendingEvents, function(item) {
          return item.head.revision === entry.revision;
        });
        if (!nextEvent) return;

        this.removeQueuedEvent(entry.id, nextEvent); // dequeue event
        self.guard(nextEvent); // guard event
      },
      revisionUpdateStrategy: function(entry, evt) {
        entry.revision = evt.head.revision + 1;
      }
    };

    return this._aux;
  },

  configure: function(fn) {
    fn.call(this);
    return this;
  },

  use: function(module) {
    if (!module) return;

    if (module.getRevision && module.saveRevision) {
      this.store = module;
    }

    if (module.dispatch) {
      this.eventDispatcher = module;
    }

    if (module.push && module.remove) {
      this.eventQueue = module;
    }
  },

  initialize: function(options, callback) {
    var self = this;

    if (!callback) {
      callback = options;
      options = {};
    }

    var defaults = {
      ignoreRevision: false,
      queueTimeout: 3000,
      queueTimeoutMaxLoops: 3,
      guardTimeoutMaxLoops: 3
    };

    _.defaults(options, defaults);

    this.options = options;

    this.queue = new Queue(options.queueTimeout);

    if (callback) callback(null);
  },

  guard: function(evt, callback) {
    var aux = this._getAux();

    var self = this;

    if (this.options.ignoreRevision || !evt.payload || !evt.payload.id || !evt.head || !evt.head.revision) {
      this.eventDispatcher.dispatch(evt, callback);
      return;
    }

    function proceed(entry) {
      if (!aux.queuingStrategy(evt, entry)) {
        if (callback) callback(null);
        return;
      }

      aux.finishGuard(evt, entry, callback);
    }

    function retry(max, loop) {
      setTimeout(function() {
        self.store.getRevision(evt.payload.id, function(err, entry) {
          if (loop <= 0) {
            proceed(entry);
          } else {
            retry(max, --loop);
          }
        });
      }, randomBetween(max / 5, max));
    }

    this.store.getRevision(evt.payload.id, function(err, entry) {
      if (!entry.revision && evt.head.revision !== 1) {
        var max = (self.options.queueTimeout * self.options.queueTimeoutMaxLoops) / 3;
        if (max < 10) {
          max = 10;
        }
        retry(max, self.options.guardTimeoutMaxLoops);
      } else {
        proceed(entry);
      }
    });
  }

};