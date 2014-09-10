var viewBuilderBase = require('../../../index').viewBuilderBase;

var dummy2ViewBuilder = viewBuilderBase.extend({

  events: [
    'loaded',
    'somethingFlushed'
  ],

  collectionName: 'dummies2',

  loaded: function(data, vm, evt) {
    vm.set('loadedSet', 'loaded');
  },
  
  somethingFlushed: function(data, vm, evt) {
    vm.set('flushSet', 'flushed');
  },

});

module.exports = dummy2ViewBuilder;