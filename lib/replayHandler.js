var _ = require('lodash'),
		async = require('async'),
		viewBuilders,
		guardStore;

module.exports = {
	initialize: function(options, vB, gS) {
		if (!gS) {
			gS = vB;
			vB = options;
			options = {};
		}

		viewBuilders = vB;

		guardStore = gS;
	},

	replay: function(evts, callback) {

    var revisionMap = {},
        groupedEvents = {};

    _.each(evts, function(evt) {
      if (evt.head && evt.head.revision) {
        revisionMap[evt.payload.id] = evt.head.revision;
      }

      var interested = _.filter(viewBuilders, function(vB) {
        return _.contains(vB.registeredEventNames, evt.event);
      });

      _.each(interested, function(inter) {
        groupedEvents[inter.id] = groupedEvents[inter.id] || [];
        groupedEvents[inter.id].push(evt);
      });
    });

    async.series([
      function(callback) {
        async.each(viewBuilders, function(viewBuilder, callback) {
          if (!groupedEvents[viewBuilder.id] || groupedEvents[viewBuilder.id].length === 0) {
            return callback(null);
          }

          viewBuilder.replay(groupedEvents[viewBuilder.id], callback);

        }, callback);
      },
      function(callback) {
        var ids = _.keys(revisionMap);
        async.each(ids, function(id, callback) {
          guardStore.getRevision(id, function(err, entry) {
            if (err) { return callback(err); }

            entry.revision = revisionMap[id];
            guardStore.saveRevision(entry, callback);
          });
        }, callback);
      }
    ], function(err) {
      if (callback) callback(err);
    });
  },

  replayStreamed: function(fn, retryTimout) {

    var revisionMap = {},
        viewBuilderReplayStreams = {};

    var replay = function(evt) {
      if (evt.head && evt.head.revision) {
        revisionMap[evt.payload.id] = evt.head.revision;
      }

      var interested = _.filter(viewBuilders, function(vB) {
        return _.contains(vB.registeredEventNames, evt.event);
      });

      _.each(interested, function(inter) {
        if (!viewBuilderReplayStreams[inter.id]) {
          inter.replayStreamed(function(vbReplay, vbDone) {
            viewBuilderReplayStreams[inter.id] = {
              replay: vbReplay,
              done: vbDone
            };
          }, retryTimout);
        }

        viewBuilderReplayStreams[inter.id].replay(evt);
      });
    };

    var done = function(callback) {
      async.series([
        function(callback) {
          async.each(_.values(viewBuilderReplayStreams), function(viewBuilderReplayStream, callback) {
            viewBuilderReplayStream.done(callback);
          }, callback);
        },
        function(callback) {
          var ids = _.keys(revisionMap);
          async.each(ids, function(id, callback) {
            guardStore.getRevision(id, function(err, entry) {
              if (err) { return callback(err); }

              entry.revision = revisionMap[id];
              guardStore.saveRevision(entry, callback);
            });
          }, callback);
        }
      ], function(err) {
        if (callback) callback(err);
      });
    };

    fn(replay, done);
  }
};