// if exports is an array, it will be the same like loading multiple files...
module.exports = require('../../../../../../index').defineViewBuilder({
//module.exports = require('cqrs-eventdenormalizer').defineViewBuilder({
//  name: 'personLeaved', // optional, default is file name without extension, if name is '' it will handle all events that matches
  aggregate: 'person', // optional
  context: 'hr',         // optional
  // version: 2, // optional, default is 0
  id: 'aggregate.id', // if not defined or not found it will generate a new viewmodel with new id
  payload: 'payload', // optional, if not defined it will pass the whole event...
  priority: 1000 // optional, default Infinity
}, function (data, vm) {
  vm.set('sp', data.special);
  this.remindMe({ that: data.special });
//}).onAfterCommit(function (evt, vm) {
  //var memories = this.getReminder();
  //console.log(memories.that); // 'important value'
  //doSomethingStrange()
//});
// or
}).onAfterCommit(function (evt, vm, callback) {
  var memories = this.getReminder();
  //console.log(memories.that); // 'important value'
  // doSomethingStrange(callback)
  callback(memories.that === 'important value' ? null : new Error('important value not set'));
});
