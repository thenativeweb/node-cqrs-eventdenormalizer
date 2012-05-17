var eventDenormalizerBase = require('../../../index').eventDenormalizerBase;

var dummyDenormalizer = eventDenormalizerBase.extend({

    events: ['dummied', {'dummyCreated': 'create'}, {'dummyChanged': 'update'}, {'dummyDeleted': 'delete'}],
    collectionName: 'dummies',

    dummied: function(evt, aux, callback) {
        callback(null);
    }

});

module.exports = dummyDenormalizer;