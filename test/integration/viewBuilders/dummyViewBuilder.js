var viewBuilderBase = require('../../../index').viewBuilderBase;

var dummyViewBuilder = viewBuilderBase.extend({

  events: ['dummied', {'dummyCreated': 'create'}, {'dummyChanged': 'update'}, {'dummyDeleted': 'delete'}, 'dummySpezi'],
  viewModelIds: { 'dummyCreated': 'payload.id' },
  collectionName: 'dummies',

  dummied: function(evt, vm) {
  },

  dummySpezi: function(evt, vm) {
    vm.otherValue = 'value';
  }

});

module.exports = dummyViewBuilder;