// if exports is an array, it will be the same like loading multiple files...
module.exports = require('../../../../../index').defineCollection({
//module.exports = require('cqrs-eventdenormalizer').defineCollection({
//  name: 'personDetail' // optional, default is folder name
//  defaultPayload: 'payload',
//    indexes: [ // for mongodb
//      'profileId',
//      // or:
//      { profileId: 1 },
//      // or:
//      { index: {profileId: 1}, options: {} }
//    ]
},

// optionally, define some initialization data for new view models...
{
  emails: ['default@mycomp.org'],
  phoneNumbers: []
});