// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  name: 'personCreated', // optional, default is file name without extension
  aggregate: 'employee', // optional
  context: 'hr',         // optional
  version: 2, // optional, default is 0
  id: 'payload.id',
  // payload: 'payload' // optional, if not defined it will pass the whole event...
}, function (evt, col, callback) {
  // col.get()... or from somewhere else...
  calllback(null, evt);
});

// or (sync)
module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  name: 'personCreated', // optional, default is file name without extension
  aggregate: 'employee', // optional
  context: 'hr',         // optional
  version: 2, // optional, default is 0
  id: 'payload.id',
  // payload: 'payload' // optional, if not defined it will pass the whole event...
}, function (evt) {
  return evt;
});
