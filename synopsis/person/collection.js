// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-eventdenormalizer').defineCollection({
  name: 'person' // optional, default is folder name
},

// optionally, define some initialization data for new view models...
{
  emails: ['default@mycomp.org'],
  phoneNumbers: []
// }).defaultEventExtension(function (evt, col, callback) {
//   evt.receiver = [evt.meta.userId];
//   // col.get()... or from somewhere else...
//   calllback(null, evt);
// }).defaultEventExtension(function (evt) {
//   evt.receiver = [evt.meta.userId];
//   return evt;
// }).defineNotificationExtension(function (noti, col, callback) {
//   // col.get()... or from somewhere else...
//   calllback(null, noti);
// }).defineNotificationExtension(function (noti) {
//   return noti;
});
