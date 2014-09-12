// if exports is an array, it will be the same like loading multiple files...
module.exports = require('cqrs-eventdenormalizer').defineCollection({
  name: 'person' // optional, default is folder name
//  defaultPayload: 'payload'
},

// optionally, define some initialization data for new view models...
{
  emails: ['default@mycomp.org'],
  phoneNumbers: []
});
