var expect = require('expect.js')
  , sinon = require('sinon')
  , async = require('async')
  , repository = require('viewmodel').write
  , dummyRepo
  , eventEmitter = require('../lib/eventEmitter')
  , eventExtenderBase = require('../lib/bases/eventExtenderBase');

var dummyExtender = eventExtenderBase.extend({

    events: ['dummied', 'dummyCreated', 'dummyChanged', 'dummyDeleted'],
    collectionName: 'dummies',

    defaultAction: function(evt, aux, callback) {
        callback(null, evt);
    },

    dummied: function(evt, aux, callback) {
        callback(null, evt);
    }

});

function cleanRepo(done) {
    dummyRepo.find(function(err, results) {
        async.forEach(results, function(item, callback) {
            item.destroy();
            dummyRepo.commit(item, callback);
        }, function(err) {
            if (!err) done();
        });
    });
}

describe('EventExtenderBase', function() {

    before(function(done) {
        
        repository.init(function(err) {
            dummyRepo = repository.extend({
                collectionName: dummyExtender.collectionName
            });

            dummyExtender.configure(function() {
                dummyExtender.use(dummyRepo);
            });

            done();
        });

    });

    describe('used by a dummy eventExtender', function() {

        describe('calling handle with an event', function() {

            afterEach(function(done) {
                cleanRepo(done);
            });

            describe('that is mapped to', function() {

                describe('a defaultAction function', function() {

                        var evt;

                        beforeEach(function() {

                            evt = {
                                id: '82517',
                                event: 'dummyCreated',
                                payload: {
                                    id: '23'
                                }
                            };

                        });

                        it('it should raise a extended event', function(done) {

                            eventEmitter.once('extended:' + evt.event, function(data) {
                                done();
                            });
                            dummyExtender.handle(evt);

                        });

                        it('it should call the defaultAction function', function(done) {

                            var spy = sinon.spy(dummyExtender, 'defaultAction');
                            eventEmitter.once('extended:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyExtender.defaultAction.restore();
                                done();
                            });
                            dummyExtender.handle(evt);

                        });

                });

                describe('a custom function', function() {

                        var evt;

                        beforeEach(function() {

                            evt = {
                                id: '82517',
                                event: 'dummied',
                                payload: {
                                    id: '23'
                                }
                            };

                        });

                        it('it should raise a extended event', function(done) {

                            eventEmitter.once('extended:' + evt.event, function(data) {
                                done();
                            });
                            dummyExtender.handle(evt);

                        });

                        it('it should call the concrete function', function(done) {

                            var spy = sinon.spy(dummyExtender, 'dummied');
                            eventEmitter.once('extended:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyExtender.dummied.restore();
                                done();
                            });
                            dummyExtender.handle(evt);

                        });

                });

            });

        });

    });

});