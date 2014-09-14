// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  name: 'personCreated', // optional, default is file name without extension, if name is '' it will handle all events that matches
  aggregate: 'employee', // optional
  context: 'hr',         // optional
  version: 2 // optional, default is 0
}, function (evt, col, callback) {
  // col.loadViewModel()... or from somewhere else... (col.findViewModels())
  calllback(null, evt);
});

// or only with callback (async) (this event extender could be saved collection independent)
module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  name: 'personCreated', // optional, default is file name without extension, if name is '' it will handle all events that matches
  aggregate: 'employee', // optional
  context: 'hr',         // optional
  version: 2 // optional, default is 0
}, function (evt, callback) {
  return evt;
});

// or directly load vm (sync)
module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  name: 'personCreated', // optional, default is file name without extension, if name is '' it will handle all events that matches
  aggregate: 'employee', // optional
  context: 'hr',         // optional
  version: 2, // optional, default is 0
  id: 'payload.id'
}, function (evt, vm) {
  return evt;
});

// or (sync)
module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  name: 'personCreated', // optional, default is file name without extension, if name is '' it will handle all events that matches
  aggregate: 'employee', // optional
  context: 'hr',         // optional
  version: 2, // optional, default is 0
  id: 'payload.id'
}, function (evt) {
  return evt;
});
