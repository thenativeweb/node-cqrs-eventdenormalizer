// if exports is an array, it will be the same like loading multiple files...
module.exports = require('../../../../../../index').defineViewBuilder({
//module.exports = require('cqrs-eventdenormalizer').defineViewBuilder({
  name: 'enteredNewPerson', // optional, default is file name without extension, if name is '' it will handle all events that matches
  aggregate: 'person', // optional
  context: 'hr',         // optional
  version: 2, // optional, default is 0
  id: 'aggregate.id', // if not defined or not found it will generate a new viewmodel with new id
  payload: 'payload', // optional, if not defined it will pass the whole event...
  priority: 10 // optional, default Infinity
}, function (data, vm) { // instead of function you can define a string with default handling ('create', 'update', 'delete')
  vm.set('firstname', data.firstname);
  vm.set('lastname', data.lastname);
  var ho = { obj: { test: 'a' } };
  vm.set('ref', ho);
  vm.set('copy', ho);
});
