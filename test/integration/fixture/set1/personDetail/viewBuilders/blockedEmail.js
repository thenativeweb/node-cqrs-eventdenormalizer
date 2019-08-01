// if exports is an array, it will be the same like loading multiple files...
module.exports = require('../../../../../../index').defineViewBuilder({
  //module.exports = require('cqrs-eventdenormalizer').defineViewBuilder({
    name: 'blockedEmail', // optional, default is file name without extension, if name is '' it will handle all events that matches
    aggregate: 'person', // optional
    context: 'hr',         // optional
    version: 0, // optional, default is 0
    payload: 'payload' // optional, if not defined it will pass the whole event...
  }, function (data, vm) {
    vm.set('blocked', true);
  }).useAsQuery(function (evt) {
    return { email: evt.payload.email };
  });
  