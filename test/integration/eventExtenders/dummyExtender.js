var eventExtenderBase = require('../../../index').eventExtenderBase;

var dummyExtender = eventExtenderBase.extend({

    events: ['dummied', 'dummyCreated', 'dummyChanged', 'dummyDeleted'],
    collectionName: 'dummies',

    dummyCreated: function(evt, aux, callback) {
        callback(null, evt);
    },

    dummyChanged: function(evt, aux, callback) {
        callback(null, evt);
    },

    dummyDeleted: function(evt, aux, callback) {
        callback(null, evt);
    },

    dummied: function(evt, aux, callback) {
        callback(null, evt);
    }

});

module.exports = dummyExtender;