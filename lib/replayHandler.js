var debug = require('debug')('denormalizer:replayHandler'),
  _ = require('lodash'),
  async = require('async'),
  dotty = require('dotty');

/**
 * ReplayHandler constructor
 * @param {Object} disp    The dispatcher object.
 * @param {Object} store   The store object.
 * @param {Object} def     The definition object.
 * @param {Object} options The options object.
 * @constructor
 */
function ReplayHandler (disp, store, def, options) {
  this.dispatcher = disp;

  this.store = store;

  def = def || {};

  this.definition = {
    correlationId: 'correlationId', // optional
    id: 'id',                       // optional
    name: 'name',                   // optional
//      aggregateId: 'aggregate.id',    // optional
//      context: 'context.name',        // optional
//      aggregate: 'aggregate.name',    // optional
    payload: 'payload'              // optional
//      revision: 'revision'            // optional
//      version: 'version',             // optional
//      meta: 'meta'                    // optional, if defined theses values will be copied to the notification (can be used to transport information like userId, etc..)
  };

  this.definition = _.defaults(def, this.definition);

  options = options || {};

  this.options = options;
}

ReplayHandler.prototype = {

  /**
   * Clears all collections and the revisionGuardStore.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err){}`
   */
  clear: function (callback) {
    var self = this;
    async.parallel([
      function (callback) {
        async.each(self.dispatcher.tree.getCollections(), function (col, callback) {
          if (col.noReplay) {
            return callback(null);
          }
          col.repository.clear(callback);
        }, callback);
      },
      function (callback) {
        self.store.clear(self.options.revisionGuard.prefix, callback);
      }
    ], callback);
  },

  /**
   * Returns the concatenated id (more unique)
   * @param {Object}   evt The passed eventt.
   * @returns {string}
   */
  getConcatenatedId: function (evt) {
    var concatenatedId = '';
    if (dotty.exists(evt, this.definition.context)) {
      context = dotty.get(evt, this.definition.context);
      concatenatedId = 'ctx:' + context;
    }

    if (dotty.exists(evt, this.definition.aggregate)) {
      aggregate = dotty.get(evt, this.definition.aggregate);
      concatenatedId = concatenatedId ? (concatenatedId + '::') : concatenatedId;
      concatenatedId = concatenatedId + 'agg:' + aggregate;
    }

    if (dotty.exists(evt, this.definition.aggregateId)) {
      aggregateId = dotty.get(evt, this.definition.aggregateId);
      concatenatedId = concatenatedId ? (concatenatedId + '::') : concatenatedId;
      concatenatedId = concatenatedId + 'aggId:' + aggregateId;
    }

    return concatenatedId;
  },

  /**
   * Updates the revision in the store.
   * @param {Object}   dataMap     The data from the revision guard map.
   * @param {Function} callback    The function, that will be called when this action is completed.
   *                               `function(err){}`
   */
  updateRevision: function (dataMap, callback) {
    var self = this;
    var ids = _.keys(dataMap);

    async.each(ids, function (id, callback) {
      self.store.get(self.options.revisionGuard.prefix, id, function (err, data) {
        if (err) {
          return callback(err);
        }

        var nextCalled = false;
        var rev = (data && data.revision) || data;
        var evt = dataMap[id]['evt'];
        var revInEvt = dataMap[id]['revision'];

        function next(revInEvt, oldRev, data) {
          nextCalled = true;
          self.store.set(self.options.revisionGuard.prefix, id, data, revInEvt + 1, oldRev, callback);
        }

        var onBeforeSetMiddleware = (
          self.options &&
          self.options.revisionGuard &&
          self.options.revisionGuard.middlewares &&
          self.options.revisionGuard.middlewares.onBeforeSet) || null;
        if (!onBeforeSetMiddleware) {
          next(revInEvt, rev, null);
        } else {
          onBeforeSetMiddleware(evt, next.bind(null, revInEvt, rev));
          if (nextCalled === false) {
            callback('next within the middleware onBeforeSet, never got called. You must call it.');
          }
        }
      });
    }, callback);
  },

  /**
   * Replays all passed events.
   * @param {Array}    evts     The passed array of events.
   * @param {Function} callback The function, that will be called when this action is completed.
   *                            `function(err){}`
   */
  replay: function (evts, callback) {
    this.replayStreamed(function (replay, done) {
      evts.forEach(function (evt) {
        replay(evt);
      });
      done(callback);
    });
  },

  /**
   * Replays in a streamed way.
   * @param {Function} fn The function that will be called with the replay function and the done function.
   *                      `function(replay, done){}`
   */
  replayStreamed: function (fn) {
    var self = this;

    var evtCount = 0;
    var eventQueue = [];
    var eventQueueHandling = false;

    var errs = [];
    var doneCalled = false;
    var doneClb = null;

    var dataMap = {};
    var collections = {};

    var lastEvent;

    var seenEvents = {};

    var replay = function (evt) {
      var evtId = dotty.get(evt, self.definition.id);
      lastEvent = evt;
      var concatenatedId;
      if (!!self.definition.revision && dotty.exists(evt, self.definition.revision) &&
        !!self.definition.aggregateId && dotty.exists(evt, self.definition.aggregateId)) {
        concatenatedId = self.getConcatenatedId(evt);
        dataMap[concatenatedId] = dataMap[concatenatedId] || {};
        dataMap[concatenatedId]['evt'] = evt;
        dataMap[concatenatedId]['revision'] = dotty.get(evt, self.definition.revision);
      }

      var concatenatedWithEventId = evtId;
      if (concatenatedId) concatenatedWithEventId = concatenatedId + '::' + 'evtId:' + evtId;
      if (seenEvents[concatenatedWithEventId]) return;
      seenEvents[concatenatedWithEventId] = true;

      var target = self.dispatcher.getTargetInformation(evt);

      var viewBuilders = [], foundPrioSet = false;

      _.each(self.dispatcher.tree.getViewBuilders(target), function (vb) {
        if (!vb.collection.noReplay) {
          viewBuilders.push(vb);

          if (!foundPrioSet && vb.priority < Infinity) {
            foundPrioSet = true;
          }

          if (!collections[vb.collection.workerId]) {
            vb.collection.isReplaying = true;
            collections[vb.collection.workerId] = vb.collection;
          }
        }
      });

      if (foundPrioSet) {
        _.each(viewBuilders, function (vb) {
          eventQueue.push({event: evt, viewBuilders: [vb]});
          evtCount++;
        });
      } else {
        eventQueue.push({event: evt, viewBuilders: viewBuilders});
        evtCount += viewBuilders.length;
      }

      function handleNext () {
        if (evtCount <= 0 && doneCalled) {
          doneLater();
          return;
        }

        if (eventQueue.length > 0) {
          var task = eventQueue.shift();
          var e = task.event, vbs = task.viewBuilders;

          async.series([
            function (clb) {
              var preEventExtender = self.dispatcher.tree.getPreEventExtender(self.dispatcher.getTargetInformation(e));
              if (!preEventExtender) return clb(null);
              preEventExtender.extend(e, function (err, extEvt) {
                if (err) return clb(err);
                e = extEvt || e;
                clb(null);
              });
            },
            function (clb) {
              async.each(vbs, function (vb, callback) {
                vb.denormalize(e, function (err) {
                  --evtCount;
                  if (err) {
                    debug(err);
                    errs.push(err);
                  }

                  callback();
                });
              }, clb);
            }
          ], function () {
            handleNext();
          });
        } else if (eventQueueHandling) {
          eventQueueHandling = false;
        }
      }

      if (!eventQueueHandling) {
        eventQueueHandling = true;
        process.nextTick(handleNext);
      }
    };

    function doneLater() {
      if (doneCalled) {
        done(doneClb);
      }
    }

    var done = function (callback) {
      if (evtCount > 0) {
        doneCalled = true;
        doneClb = callback;
        return;
      }

      async.parallel([
        function (callback) {
          async.each(_.values(collections), function (col, callback) {
            col.saveReplayingVms(callback);
          }, callback);
        },
        function (callback) {
          self.updateRevision(dataMap, callback);
        },
        function (callback) {
          self.store.saveLastEvent(self.options.revisionGuard.prefix, lastEvent, callback);
        }
      ], function (err) {
        seenEvents = {};

        if (err) {
          debug(err);
          errs.push(err);
        }

        if (errs.length === 0) {
          if (callback) {
            callback(null);
          }
          return;
        }

        if (callback) {
          callback(errs);
        }
      });
    };

    fn(replay, done);
  }

};

module.exports = ReplayHandler;
