'use strict';

var debug = require('debug')('denormalizer:treeExtender'),
  _ = require('lodash');

module.exports = function (tree) {
  
  if (!tree || _.isEmpty(tree)) {
    debug('no tree injected');
  }

  return {

    getViewBuilders: function (query) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return null;
      }
      
      var res = [];

      tree.collections.forEach(function (col) {
        var vB = col.getViewBuilder(query);
        if (vB) {
          res.push(vB);
        }
      });
      
      return res;
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
      });

      tree.generalEventExtenders.forEach(function (eExt) {
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
      });

      tree.generalEventExtenders.forEach(function (eExt) {
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
      });

      tree.generalEventExtenders.forEach(function (eExt) {
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
