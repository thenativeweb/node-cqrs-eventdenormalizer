// if exports is an array, it will be the same like loading multiple files...
module.exports = require('../../../../../../index').defineViewBuilder({
//module.exports = require('cqrs-eventdenormalizer').defineViewBuilder({
//  name: 'registeredEMailAddress', // optional, default is file name without extension, if name is '' it will handle all events that matches
  aggregate: 'person', // optional
  context: 'hr',         // optional
  version: 2, // optional, default is 0
  query: {},
  payload: 'payload', // optional, if not defined it will pass the whole event...
  priority: 100 // optional, default Infinity
}, function (data, vm) {
  vm.set('generalEmail', data.email);
});
