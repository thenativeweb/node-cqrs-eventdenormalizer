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
            evtExt.version === query.version &&
            evtExt.aggregate === query.aggregate &&
            evtExt.context === query.context) {
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

    defineCommand: function (definition) {
      if (!tree || _.isEmpty(tree)) {
        debug('no tree injected');
        return this;
      }

      tree.collections.forEach(function (col) {
        col.defineCommand(definition);

        col.getViewBuilders().forEach(function (vB) {
          vB.defineCommand(definition);
        });

        col.getEventExtenders().forEach(function (eExt) {
          eExt.defineCommand(definition);
        });
      });

      tree.generalEventExtenders.forEach(function (eExt) {
        eExt.defineCommand(definition);
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
    }

  };

};
