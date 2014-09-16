'use strict';

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
  options = options || {};

  this.options = options;

  this.definitions = {
    event: {
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
    }
  };

  this.definitions.event = _.defaults(def, this.definitions.event);

  this.store = store;

  this.dispatcher = disp;
}

ReplayHandler.prototype = {
  
  updateRevision: function (revisionMap, callback) {
    var ids = _.keys(revisionMap);
    async.each(ids, function (id, callback) {
      self.store.get(id, function (err, rev) {
        if (err) {
          return callback(err);
        }
        self.store.set(id, revisionMap[id] + 1, rev, callback);
      });
    }, callback);
  },

  replay: function (evts, callback) {
    var self = this;
    
    var revisionMap = {},
      viewBuilderMap = {},
      groupedEvents = {};

    _.each(evts, function (evt) {
      if (!!self.definitions.event.revision && dotty.exists(evt, self.definitions.event.revision) &&
        !!self.definitions.event.aggregateId && dotty.exists(evt, self.definitions.event.aggregateId)) {
        var aggId = dotty.get(evt, self.definitions.event.aggregateId);
        revisionMap[aggId] = dotty.get(evt, self.definitions.event.revision);
      }

      var target = self.dispatcher.getTargetInformation(evt);

      var viewBuilders = self.dispatcher.tree.getViewBuilders(target);

      _.each(viewBuilders, function (vb) {
        viewBuilderMap[vb.workerId] = vb;
        groupedEvents[vb.workerId] = groupedEvents[vb.workerId] || [];
        groupedEvents[vb.workerId].push(evt);
      });
    });

    async.series([
      
      function (callback) {
        async.each(_.values(viewBuilderMap), function (vb, callback) {
          if (!groupedEvents[vb.workerId] || groupedEvents[vb.workerId].length === 0) {
            return callback(null);
          }

          vb.replay(groupedEvents[vb.id], callback);
        }, callback);
      },
      
      function (callback) {
        self.updateRevision(revisionMap, callback);
      }
      
    ], function (err) {
      if (err) {
        debug(err);
      }
      if (callback) {
        callback(err);
      }
    });
  },

  replayStreamed: function (fn) {
    var revisionMap = {},
      vbReplayStreams = {};

    var replay = function (evt) {
      if (!!self.definitions.event.revision && dotty.exists(evt, self.definitions.event.revision) &&
          !!self.definitions.event.aggregateId && dotty.exists(evt, self.definitions.event.aggregateId)) {
        var aggId = dotty.get(evt, self.definitions.event.aggregateId);
        revisionMap[aggId] = dotty.get(evt, self.definitions.event.revision);
      }

      var target = self.dispatcher.getTargetInformation(evt);

      var viewBuilders = self.dispatcher.tree.getViewBuilders(target);

      _.each(viewBuilders, function (vb) {

        if (!vbReplayStreams[vb.workerId]) {
          vb.replayStreamed(function (vbReplay, vbDone) {
            vbReplayStreams[vb.workerId] = {
              replay: vbReplay,
              done: vbDone
            };
          });
        }

        vbReplayStreams[vb.workerId].replay(evt);
      });
    };

    var done = function (callback) {
      async.series([
        function (callback) {
          async.each(_.values(vbReplayStreams), function (vbReplayStream, callback) {
            vbReplayStream.done(callback);
          }, callback);
        },
        function (callback) {
          self.updateRevision(revisionMap, callback);
        }
      ], function(err) {
        if (err) {
          debug(err);
        }
        if (callback) {
          callback(err);
        }
      });
    };

    fn(replay, done);
  }

};

module.exports = ReplayHandler;
