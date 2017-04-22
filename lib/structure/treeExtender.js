'use strict';

var debug = require('debug')('denormalizer:treeExtender'),
  _ = require('lodash');

module.exports = function (tree) {

  if (!tree || _.isEmpty(tree)) {
    debug('no tree injected');
  }

  return {

    getInfo: function () {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return null;
      }

      var info = {
        collections: [],
        generalEventExtenders: [],
        generalPreEventExtenders: []
      };

      tree.collections.forEach(function (col) {
        var c = { name: col.name, viewBuilders: [], eventExtenders: [], preEventExtenders: [] };

        col.viewBuilders.forEach(function (vB) {
          c.viewBuilders.push({
            name: vB.name,
            aggregate: vB.aggregate,
            context: vB.context,
            version: vB.version,
            priority: vB.priority
          });
        });

        col.eventExtenders.forEach(function (evtExt) {
          c.eventExtenders.push({
            name: evtExt.name,
            aggregate: evtExt.aggregate,
            context: evtExt.context,
            version: evtExt.version
          });
        });

        col.preEventExtenders.forEach(function (evtExt) {
          c.preEventExtenders.push({
            name: evtExt.name,
            aggregate: evtExt.aggregate,
            context: evtExt.context,
            version: evtExt.version
          });
        });

        info.collections.push(c);
      });

      tree.generalEventExtenders.forEach(function (evtExt) {
        info.generalEventExtenders.push({
          name: evtExt.name,
          aggregate: evtExt.aggregate,
          context: evtExt.context,
          version: evtExt.version
        });
      });

      tree.generalPreEventExtenders.forEach(function (evtExt) {
        info.generalPreEventExtenders.push({
          name: evtExt.name,
          aggregate: evtExt.aggregate,
          context: evtExt.context,
          version: evtExt.version
        });
      });

      return info;
    },

    getViewBuilders: function (query) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return null;
      }

      var res = [];

      tree.collections.forEach(function (col) {
        var vBs = col.getViewBuilders(query);
        res = res.concat(vBs);
      });

      res = _.sortBy(res, function(vb) {
        return vb.priority;
      });

      return res;
    },

    getCollections: function () {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return null;
      }

      return tree.collections;
    },

    getEventExtender: function (query) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return null;
      }

      var evtExt;

      for (var i = 0, len = tree.collections.length; i < len; i++) {
        var col = tree.collections[i];
        evtExt = col.getEventExtender(query);
        if (evtExt) {
          return evtExt;
        }
      }

      for (var j = 0, lenJ = tree.generalEventExtenders.length; j < lenJ; j++) {
        evtExt = tree.generalEventExtenders[j];
        if (evtExt &&
            evtExt.name === query.name &&
            (evtExt.version === query.version || evtExt.version === -1) &&
            (evtExt.aggregate === query.aggregate || !query.aggregate || ! evtExt.aggregate) &&
            (evtExt.context === query.context || !query.context || ! evtExt.context)) {
          return evtExt;
        }
      }

      for (var k = 0, lenK = tree.generalEventExtenders.length; k < lenK; k++) {
        evtExt = tree.generalEventExtenders[k];
        if (evtExt &&
            evtExt.name === '' &&
            (evtExt.version === query.version || evtExt.version === -1) &&
            (evtExt.aggregate === query.aggregate || !query.aggregate || ! evtExt.aggregate) &&
            (evtExt.context === query.context)) {
          return evtExt;
        }
      }

      for (var l = 0, lenL = tree.generalEventExtenders.length; l < lenL; l++) {
        evtExt = tree.generalEventExtenders[l];
        if (evtExt &&
          evtExt.name === '' &&
          (evtExt.version === query.version || evtExt.version === -1) &&
          (evtExt.aggregate === query.aggregate || !query.aggregate || ! evtExt.aggregate) &&
          (evtExt.context === query.context || !query.context || ! evtExt.context)) {
          return evtExt;
        }
      }

      return null;
    },

    getPreEventExtender: function (query) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return null;
      }

      var evtExt;

      for (var i = 0, len = tree.collections.length; i < len; i++) {
        var col = tree.collections[i];
        evtExt = col.getPreEventExtender(query);
        if (evtExt) {
          return evtExt;
        }
      }

      for (var j = 0, lenJ = tree.generalPreEventExtenders.length; j < lenJ; j++) {
        evtExt = tree.generalPreEventExtenders[j];
        if (evtExt &&
            evtExt.name === query.name &&
            (evtExt.version === query.version || evtExt.version === -1) &&
            (evtExt.aggregate === query.aggregate || !query.aggregate || ! evtExt.aggregate) &&
            (evtExt.context === query.context || !query.context || ! evtExt.context)) {
          return evtExt;
        }
      }

      for (var k = 0, lenK = tree.generalPreEventExtenders.length; k < lenK; k++) {
        evtExt = tree.generalPreEventExtenders[k];
        if (evtExt &&
            evtExt.name === '' &&
            (evtExt.version === query.version || evtExt.version === -1) &&
            (evtExt.aggregate === query.aggregate || !query.aggregate || ! evtExt.aggregate) &&
            (evtExt.context === query.context)) {
          return evtExt;
        }
      }

      for (var l = 0, lenL = tree.generalPreEventExtenders.length; l < lenL; l++) {
        evtExt = tree.generalPreEventExtenders[l];
        if (evtExt &&
          evtExt.name === '' &&
          (evtExt.version === query.version || evtExt.version === -1) &&
          (evtExt.aggregate === query.aggregate || !query.aggregate || ! evtExt.aggregate) &&
          (evtExt.context === query.context || !query.context || ! evtExt.context)) {
          return evtExt;
        }
      }

      return null;
    },

    defineOptions: function (options) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return this;
      }

      tree.collections.forEach(function (col) {
        col.defineOptions(options);

        col.getViewBuilders().forEach(function (vB) {
          vB.defineOptions(options);
        });

        col.getEventExtenders().forEach(function (eExt) {
          eExt.defineOptions(options);
        });

        col.getPreEventExtenders().forEach(function (eExt) {
          eExt.defineOptions(options);
        });
      });

      tree.generalEventExtenders.forEach(function (eExt) {
        eExt.defineOptions(options);
      });

      tree.generalPreEventExtenders.forEach(function (eExt) {
        eExt.defineOptions(options);
      });

      return this;
    },

    defineNotification: function (definition) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return this;
      }

      tree.collections.forEach(function (col) {
        col.defineNotification(definition);

        col.getViewBuilders().forEach(function (vB) {
          vB.defineNotification(definition);
        });

        col.getEventExtenders().forEach(function (eExt) {
          eExt.defineNotification(definition);
        });

        col.getPreEventExtenders().forEach(function (eExt) {
          eExt.defineNotification(definition);
        });
      });

      tree.generalEventExtenders.forEach(function (eExt) {
        eExt.defineNotification(definition);
      });

      tree.generalPreEventExtenders.forEach(function (eExt) {
        eExt.defineNotification(definition);
      });

      return this;
    },

    defineEvent: function (definition) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return this;
      }

      tree.collections.forEach(function (col) {
        col.defineEvent(definition);

        col.getViewBuilders().forEach(function (vB) {
          vB.defineEvent(definition);
        });

        col.getEventExtenders().forEach(function (eExt) {
          eExt.defineEvent(definition);
        });

        col.getPreEventExtenders().forEach(function (eExt) {
          eExt.defineEvent(definition);
        });
      });

      tree.generalEventExtenders.forEach(function (eExt) {
        eExt.defineEvent(definition);
      });

      tree.generalPreEventExtenders.forEach(function (eExt) {
        eExt.defineEvent(definition);
      });
      return this;
    },

    useRepository: function (repository) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return this;
      }

      tree.collections.forEach(function (col) {
        col.useRepository(repository);
      });
      return this;
    },

    idGenerator: function (getNewId) {
      if (!getNewId || !_.isFunction(getNewId)) {
        var err = new Error('Please pass a valid function!');
        debug(err);
        throw err;
      }

      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return this;
      }

      tree.collections.forEach(function (col) {
        col.getViewBuilders().forEach(function (vB) {
          vB.idGenerator(getNewId);
        });
      });
      return this;
    }

  };

};
