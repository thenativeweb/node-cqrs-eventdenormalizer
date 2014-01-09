var expect = require('expect.js')
  , sinon = require('sinon')
  , async = require('async')
  , repository = require('viewmodel').write
  , dummyRepo
  , eventEmitter = require('../lib/eventEmitter')
  , viewBuilderBase = require('../lib/bases/viewBuilderBase')
  , Queue = require('../lib/orderQueue');

var dummyViewBuilder = viewBuilderBase.extend({

    events: [
        'dummied',
        {
            event: 'dummyCreated',
            method: 'create'
        },
        {
            event: 'dummyChanged',
            method: 'update',
            payload: 'payload'
        },
        {
            event: 'dummyDeleted',
            method: 'delete'
        },
        {
            event: 'dummySpecialized',
            method: 'update',
            viewModelId: 'payload.special.id'
        }
    ],
    collectionName: 'dummies',

    dummied: function(data, vm, evt) {
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

describe('ViewBuilderBase', function() {

    before(function(done) {
        
        repository.init(function(err) {
            dummyRepo = repository.extend({
                collectionName: dummyViewBuilder.collectionName
            });

            dummyViewBuilder.configure(function() {
                dummyViewBuilder.use(dummyRepo);
            });

            done();
        });

    });

    describe('used by a dummy viewBuilder', function() {

        describe('calling handle with an event', function() {

            afterEach(function(done) {
                cleanRepo(done);
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
                            dummyViewBuilder.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyViewBuilder.handle(evt);

                        });

                    });

                    describe('with update action', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummyChanged',
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
                            dummyViewBuilder.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyViewBuilder.handle(evt);

                        });

                    });

                    describe('with delete action', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummyDeleted',
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
                            dummyViewBuilder.handle(evt);

                        });

                        it('it should call the commit function on the repository', function(done) {

                            var spy = sinon.spy(dummyRepo, 'commit');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyRepo.commit.restore();
                                done();
                            });
                            dummyViewBuilder.handle(evt);

                        });

                    });

                    describe('having a different viewModelId', function() {

                        var evt;

                        beforeEach(function(done) {

                            dummyRepo.get('23', function(err, vm) {
                                vm.foo = 'bar';
                                dummyRepo.commit(vm, function(err) {
                                    evt = {
                                        id: '82517',
                                        event: 'dummySpecialized',
                                        payload: {
                                            special: { id: vm.id },
                                            extra: 'data'
                                        }
                                    };
                                    done();
                                });
                            });

                        });

                        it('it should have found the right viewmodel', function(done) {

                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                dummyRepo.get('23', function(err, vm) {
                                    expect(vm.extra).to.eql('data');
                                    done();
                                });
                            });
                            dummyViewBuilder.handle(evt);

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
                            dummyViewBuilder.handle(evt);

                        });

                        it('it should call the concrete function', function(done) {

                            var spy = sinon.spy(dummyViewBuilder, 'dummied');
                            eventEmitter.once('denormalized:' + evt.event, function(data) {
                                expect(spy.calledOnce).to.be.ok();
                                dummyViewBuilder.dummied.restore();
                                done();
                            });
                            dummyViewBuilder.handle(evt);

                        });

                });

            });

        });

    });

});