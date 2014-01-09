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
		'dummySpezi'
	],

  collectionName: 'dummies',

  dummied: function(data, vm, evt) {
  },

  dummySpezi: function(data, vm, evt) {
    vm.otherValue = 'value';
  }

});

module.exports = dummyViewBuilder;