// if exports is an array, it will be the same like loading multiple files...
module.exports = require('../../../../../index').defineEventExtender({
//module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  name: 'enteredNewPerson', // optional, default is file name without extension, if name is '' it will handle all events that matches
  aggregate: 'person', // optional
  context: 'hr',         // optional
  version: 2 // optional, default is 0
}, function (evt, col, callback) {
  // col.loadViewModel()... or from somewhere else... (col.findViewModels())
  evt.extended = true;
  callback(null, evt);
});
