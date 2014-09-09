// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-eventdenormalizer').defineViewBuilder({
  name: 'personCreated', // optional, default is file name without extension
  aggregate: 'employee', // optional
  context: 'hr',         // optional
  version: 2, // optional, default is 0
  collectionName: 'person', // optional, default is folder name
  viewModelId: 'payload.id',
  payload: 'payload' // optional, if not defined it will pass the whole event...
}, function (data, vm) { // instead of function you can define a string with default handling ('create', 'update', 'delete')
  vm.set(data);
});
