var expect = require('expect.js')
  , sinon = require('sinon')
  , async = require('async')
  , repository = require('viewmodel').write
  , dummyRepo
  , eventEmitter = require('../lib/eventEmitter')
  , eventDenormalizerBase = require('../lib/bases/eventDenormalizerBase')
  , Queue = require('../lib/orderQueue');

var dummyDenormalizer = eventDenormalizerBase.extend({

    events: ['dummied', {'dummyCreated': 'create'}, {'dummyChanged': 'update'}, {'dummyDeleted': 'delete'}],
    collectionName: 'dummies',

    dummied: function(evt, repository, callback) {
        callback(null);
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

describe('EventDenormalizerBase', function() {

    before(function(done) {
        
        repository.init(function(err) {
            dummyRepo = repository.extend({
                collectionName: dummyDenormalizer.collectionName
            });

            dummyDenormalizer.configure(function() {
                dummyDenormalizer.use(dummyRepo);
            });

            done();
        });

    });

    describe('used by a dummy eventDenormalizer', function() {

        describe('calling handle with an event', function() {

            afterEach(function(done) {
                cleanRepo(done);
                dummyDenormalizer.queue = new Queue({ queueTimeout: 30 });
            });

            describe('that is mapped to', function() {

                describe('a default function', function() {

                    describe('with create action', function() {

                        var evt;

                        beforeEach(function() {

                            evt = {
                                id: '82517',
                                event: 'dummyCreated',
                                head: {
                                    revision: 1
                                },
                                payload: {
                                    id: '23'
                                }
                            };

                        });

                        it('it should raise a denormalized event', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                    });

                    describe('with change action', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm._revision = 1;
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummyChanged',
                                        head: {
                                            revision: vm._revision
                                        },
                                        payload: {
                                            id: vm.id
                                        }
                                    };
                                    done();
                                });
                            });

                        });

                        it('it should raise a denormalized event', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                    });

                    describe('with delete action', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm._revision = 1;
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummyDeleted',
                                        head: {
                                            revision: vm._revision
                                        },
                                        payload: {
                                            id: vm.id
                                        }
                                    };
                                    done();
                                });
                            });

                        });

                        it('it should raise a denormalized event', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                    });

                    describe('having a change action with an event revision', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm._revision = 1;
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummyChanged',
                                        head: {
                                            revision: vm._revision
                                        },
                                        payload: {
                                            id: vm.id
                                        }
                                    };
                                    done();
                                });
                            });

                        });

                        describe('less than the expected revision', function() {

                            it('it should raise a denormalized event', function(done) {
                                evt.head.revision--;

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    done();
                                });
                                dummyDenormalizer.handle(evt);

                            });

                        });

                        describe('equal to the expected revision', function() {

                            it('it should raise a denormalized event', function(done) {

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    done();
                                });
                                dummyDenormalizer.handle(evt);

                            });

                            it('it should call the commit function on the repository', function(done) {

                                var spy = sinon.spy(dummyRepo, 'commit');
                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    expect(spy.calledOnce).to.be.ok();
                                    dummyRepo.commit.restore();
                                    done();
                                });
                                dummyDenormalizer.handle(evt);

                            });

                        });

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

                        it('it should raise a denormalized event', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                        it('it should call the concrete function', function(done) {

                            var spy = sinon.spy(dummyDenormalizer, 'dummied');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyDenormalizer.dummied.restore();
                                done();
                            });
                            dummyDenormalizer.handle(evt);

                        });

                });

            });

        });

    });

});