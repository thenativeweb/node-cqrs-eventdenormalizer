// or only with callback (async) (this event extender could be saved collection independent)
module.exports = require('../../../../index').defineEventExtender({
//module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  name: '', // optional, default is file name without extension, if name is '' it will handle all events that matches
//  aggregate: 'employee', // optional
//  context: 'hr',         // optional
  version: -1 // optional, default is 0, if -1 every version is accepted
}, function (evt, callback) {
  evt.extendedDefault = true;
  callback(null, evt);
});