var viewBuilderBase = require('../../../index').viewBuilderBase;

var dummyViewBuilder = viewBuilderBase.extend({

	events: [
		'dummied',
		{
			event: 'dummyCreated',
			method: 'create',
			viewModelId: 'payload.id'
		},
		{
			event: 'dummyChanged',
			method: 'update',
			payload: 'payload'
		},
		{
			event: 'dummyDeleted',
			method: 'delete'
		},
		'dummySpezi',
		'somethingFlushed',
    {
      event: 'versioned',
      version: 1
    }
	],

  collectionName: 'dummies',

  dummied: function(data, vm, evt) {
  },

  dummySpezi: function(data, vm, evt) {
    vm.otherValue = 'value';
  },

  somethingFlushed: function(data, vm, evt) {
  },

  versioned: function(data, vm, evt) {
  },

  versioned_1: function(data, vm, evt) {
  }

});

module.exports = dummyViewBuilder;