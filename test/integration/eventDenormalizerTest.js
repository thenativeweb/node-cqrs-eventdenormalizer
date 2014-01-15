var expect = require('expect.js')
  , async = require('async')
  , eventDenormalizer = require('../../lib/eventDenormalizer')
  , repository = require('viewmodel').write
  , dummyRepo
  , eventEmitter = require('../../lib/eventEmitter')
  , dummyEmitter = new (require('events').EventEmitter)();

var dummyViewBuilder = require('./viewBuilders/dummyViewBuilder'),
    dummy2ViewBuilder = require('./viewBuilders/dummy2ViewBuilder');

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

describe('EventDenormalizer', function() {

    before(function(done) {

        repository.init(function() {

            eventDenormalizer.on('event', function(evt) {
                dummyEmitter.emit('published', evt);
            });

            eventDenormalizer.initialize({
                viewBuildersPath: __dirname + '/viewBuilders',
                extendersPath: __dirname + '/eventExtenders',
                repository: { type: 'inMemory' },
                revisionGuardQueueTimeout: 500,
                revisionGuardQueueTimeoutMaxLoops: 1
            }, function(err) {
                dummyRepo = repository.extend({
                    collectionName: dummyViewBuilder.collectionName
                });
                dummy2Repo = repository.extend({
                    collectionName: dummy2ViewBuilder.collectionName
                });
                done();
            });

        });

    });

    describe('noting an event', function() {

        describe('having bad data', function() {

            it('it should acknowledge the event', function(done) {

                var evt = 'foobar';

                eventDenormalizer.denormalize(evt, function(err) {
                    expect(err).not.to.be.ok();
                    done();
                });

            });

        });

        describe('having well-formed data', function() {

            var evt;

            beforeEach(function () {
 
                evt = {
                    id: '82517',
                    event: 'dummyChanged',
                    head: {
                        revision: 1
                    },
                    payload: {
                        id: '23789123'
                    }
                };

            });

            describe('having no denormalizers', function() {

                it('it should acknowledge the event', function(done) {

                    evt.head.revision = 1;

                    eventDenormalizer.denormalize(evt, function(err) {
                        expect(err).not.to.be.ok();
                        done();
                    });

                });

            });

            describe('having any denormalizers', function() {

                beforeEach(function() {

                    eventEmitter.once('dummyChanged', function() {});

                });

                afterEach(function(done) {

                    eventEmitter.removeAllListeners('dummyChanged');
                    cleanRepo(done);

                });

                it('it should acknowledge the event', function(done) {

                    evt.head.revision = 2;

                    eventDenormalizer.denormalize(evt, function(err) {
                        expect(err).not.to.be.ok();
                        done();
                    });

                });

                describe('having a default action', function() {

                    describe('of create', function() {

                        beforeEach(function () {
             
                            evt = {
                                id: '82517',
                                event: 'dummyCreated',
                                head: {
                                    revision: 1
                                },
                                payload: {
                                    id: '23',
                                    foo: 'bar'
                                }
                            };

                        });

                        describe('and the record to be written already exists', function() {

                            beforeEach(function (done) {

                                dummyRepo.get(evt.payload.id, function(err, vm) {
                                    dummyRepo.commit(vm, done);
                                });

                            });

                            it('it should update the existing record within the view model database', function(done) {

                                evt.payload.id = '1234';

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('id', evt.payload.id);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                            it('the updated record should contain the correct data', function(done) {

                                evt.payload.id = '12345';

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('foo', evt.payload.foo);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                        });

                        describe('and the record to be written does not yet exist', function() {

                            it('it should insert a new record into the view model database', function(done) {

                                evt.payload.id = '123456';

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('id', evt.payload.id);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                            it('the newly inserted record should contain the correct data', function(done) {

                                evt.payload.id = '123457';

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('foo', evt.payload.foo);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                        });

                    });

                    describe('of update', function() {

                        beforeEach(function () {
             
                            evt = {
                                id: '82517',
                                event: 'dummyChanged',
                                head: {
                                    revision: 2
                                },
                                payload: {
                                    id: '23',
                                    foo: 'bar'
                                }
                            };

                        });

                        describe('and the record to be written already exists', function() {

                            beforeEach(function (done) {

                                dummyRepo.get(evt.payload.id, function(err, vm) {
                                    dummyRepo.commit(vm, done);
                                });

                            });

                            it('it should update the existing record within the view model database', function(done) {

                                evt.head.revision = 1;

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('id', evt.payload.id);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                            it('the updated record should contain the correct data', function(done) {

                                evt.head.revision = 2;

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('foo', evt.payload.foo);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                        });

                        describe('and the record to be written does not yet exist', function() {

                            it('it should insert a new record into the view model database', function(done) {

                                evt.head.revision = 3;

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('id', evt.payload.id);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                            it('the newly inserted record should contain the correct data', function(done) {

                                evt.head.revision = 4;

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('foo', evt.payload.foo);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                        });

                        describe('but having a viewmodel beeing updated by someone else in the meantime', function() {

                            var denorm,
                                orgFunc;

                            beforeEach(function (done) {

                                denorm = require('./viewBuilders/dummyViewBuilder');
                                orgFunc = denorm.dummySpezi;

                                denorm.dummySpezi = function(evt, vm) {
                                    vm.commit(function() {});
                                    denorm.dummySpezi = orgFunc;
                                };

                                dummyRepo.get(evt.payload.id, function(err, vm) {
                                    dummyRepo.commit(vm, done);
                                });

                            });

                            it('it should retry to rehandle the event', function(done) {

                                evt.head.revision = 5;
                                evt.event = 'dummySpezi';

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.get(data.payload.id, function(err, vm) {
                                        expect(vm).to.have.property('id', evt.payload.id);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                        });

                    });

                    describe('of delete', function() {

                        var viewModel;

                        beforeEach(function (done) {

                            evt = {
                                id: '82517',
                                event: 'dummyDeleted',
                                head: {
                                    revision: 6
                                },
                                payload: {
                                    id: '237654323567'
                                }
                            };

                            dummyRepo.get('9876', function(err, vm) {
                                dummyRepo.commit(vm, function(err) {
                                    dummyRepo.get('9876', function(err, vm) {
                                        viewModel = vm;
                                        done();
                                    });
                                });
                            });

                        });

                        describe('and the record to be deleted does not exist', function() {

                            it('it should neither insert nor update a record within the view model database', function(done) {

                                evt.head.revision = 1;

                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.find(function(err, results) {
                                        expect(results).to.have.length(1);
                                        expect(results[0].id).to.eql(viewModel.id);
                                        expect(results[0].revision).to.eql(viewModel.revision);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                        });

                        describe('and the record to be deleted exists', function() {

                            it('it should delete the existing record from the view model database', function(done) {

                                evt.head.revision = 1;
                                evt.payload.id = '9876';
                                eventEmitter.once('denormalized:' + evt.event, function(data) {
                                    dummyRepo.find(function(err, results) {
                                        expect(results).to.have.length(0);
                                        done();
                                    });
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                            });

                        });

                    });

                    describe('having an event revision', function() {

                        beforeEach(function (done) {
             
                            evt = {
                                id: '82517',
                                event: 'dummyChanged',
                                head: {
                                    revision: 1
                                },
                                payload: {
                                    id: '23',
                                    foo: 'bar'
                                }
                            };

                            dummyRepo.get(evt.payload.id, function(err, vm) {
                                dummyRepo.commit(vm, done);
                            });

                        });

                        describe('equal to the view model\'s expected revision', function() {

                            describe('having notified a previous event with the successor revision of the expected revision', function() {

                                var existingEvt,
                                    firstEvt,
                                    secondEvt;

                                beforeEach(function() {

                                    existingEvt = {
                                        id: '82517',
                                        event: 'dummyCreated',
                                        head: {
                                            revision: 1
                                        },
                                        payload: {
                                            id: '55689'
                                        }
                                    };
                                    firstEvt = {
                                        id: '82518',
                                        event: 'dummyChanged',
                                        head: {
                                            revision: 2
                                        },
                                        payload: {
                                            id: '55689'
                                        }
                                    };
                                    secondEvt = {
                                        id: '82519',
                                        event: 'dummyDeleted',
                                        head: {
                                            revision: 3
                                        },
                                        payload: {
                                            id: '55689'
                                        }
                                    };

                                    eventDenormalizer.denormalize(existingEvt, function(err) {});
                                    eventDenormalizer.denormalize(secondEvt, function(err) {});

                                });

                                it('it should update the view model with both events in the correct order', function(done) {

                                    var handlersRun = [],
                                        todo = 2;

                                    function check() {
                                        todo--;

                                        if (!todo) {
                                            expect(handlersRun[0]).to.eql(firstEvt);
                                            expect(handlersRun[1]).to.eql(secondEvt);
                                            done();
                                        }
                                    }

                                    eventEmitter.once('denormalized:' + firstEvt.event, function(evt) {
                                        handlersRun.push(evt);
                                        check();
                                    });

                                    eventEmitter.once('denormalized:' + secondEvt.event, function(evt) {
                                        handlersRun.push(evt);
                                        check();
                                    });

                                    eventDenormalizer.denormalize(firstEvt, function(err) {});

                                });

                            });

                            describe('having an event in the queue longer than expected', function() {

                                var evtTimeout,
                                    existingEvt;

                                beforeEach(function() {

                                    existingEvt = {
                                        id: '165475123',
                                        event: 'dummyCreated',
                                        head: {
                                            revision: 1
                                        },
                                        payload: {
                                            id: '50'
                                        }
                                    };

                                    evtTimeout = {
                                        id: '16547',
                                        event: 'dummyChanged',
                                        head: {
                                            revision: 4
                                        },
                                        payload: {
                                            id: '50'
                                        }
                                    };

                                    eventDenormalizer.denormalize(existingEvt, function(err) {});

                                });

                                it('it should notify it to be able to make a replay', function(done) {

                                    eventDenormalizer.denormalize(evtTimeout, function(err) {});

                                    eventDenormalizer.once('eventMissing', function(id, aggregateRevision, eventRevision, evt) {
                                        expect(evt).to.eql(evtTimeout);
                                        expect(id).to.eql(evtTimeout.payload.id);
                                        expect(aggregateRevision).to.eql(2);
                                        expect(eventRevision).to.eql(evtTimeout.head.revision);
                                        expect(eventRevision).to.eql(evt.head.revision);
                                        done();
                                    });

                                });

                            });

                        });

                        describe('smaller than the view model\'s revision', function() {

                            it('it should not denormalize the event', function(done) {

                                evt.head.revision = 1;

                                var handle;
                                eventEmitter.once('denormalized:' + evt.event, handle = function(data) {
                                    expect(true).to.be(false);
                                });

                                eventDenormalizer.denormalize(evt, function(err) {});

                                setTimeout(function() {
                                    eventEmitter.removeListener('denormalized:' + evt.event, handle);
                                    done();
                                }, 800);

                            });

                        });

                    });

                    describe('handling 2 events', function() {

                        var evt1 = {
                            id: '918345182',
                            event: 'dummyCreated',
                            head: {
                                revision: 1
                            },
                            payload: {
                                id: '77441122401'
                            }
                        };
                        var evt2 = {
                            id: '9387181283764',
                            event: 'dummyChanged',
                            head: {
                                revision: 2
                            },
                            payload: {
                                id: '77441122401'
                            }
                        };

                        it('it should work correctly', function(done) {

                            var finished = 0;

                            function check() {
                                finished++;
                                if (finished === 2) {
                                    done();
                                }
                            }

                            eventEmitter.once('denormalized:' + evt1.event, function(data) {
                                check();
                            });

                            eventEmitter.once('denormalized:' + evt2.event, function(data) {
                                check();
                            });

                            eventDenormalizer.denormalize(evt1, function(err) {});
                            eventDenormalizer.denormalize(evt2, function(err) {});
                        });

                    });

                });

                describe('having a custom action', function() {

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

                    it('it should call the custom handler', function(done) {

                        eventEmitter.once('denormalized:' + evt.event, function(data) {
                            done();
                        });
                        eventDenormalizer.denormalize(evt, function(err) {});

                    });

                });

            });

        });

    });

    describe('repalying', function() {

        var evts = [
            {
                id: '111111',
                event: 'dummyCreated',
                head: {
                    revision: 1
                },
                payload: {
                    id: '1987',
                    first: 'when created'
                }
            },
            {
                id: '222222',
                event: 'loaded',
                head: {
                    revision: 1
                },
                payload: {
                    id: '2014'
                }
            },
            {
                id: '333333',
                event: 'dummyChanged',
                head: {
                    revision: 2
                },
                payload: {
                    id: '1987',
                    second: 'when updated'
                }
            },
            {
                id: '444444',
                event: 'somethingFlushed',
                head: {
                    revision: 2
                },
                payload: {
                    id: '2014'
                }
            }
        ];

        it('it should work as expected', function(done) {

            eventDenormalizer.replay(evts, function(err) {
                async.series([
                    function(callback) {
                        dummyRepo.get('1987', function(err, res) {
                            expect(res.first).to.eql('when created');
                            expect(res.second).to.eql('when updated');

                            callback(err);
                        });
                    },
                    function(callback) {
                        dummyRepo.get('2014', function(err, res) {
                            expect(res.loadedSet).to.eql(undefined);
                            expect(res.flushSet).to.eql(undefined);

                            callback(err);
                        });
                    },
                    function(callback) {
                        dummy2Repo.get('2014', function(err, res) {
                            expect(res.loadedSet).to.eql('loaded');
                            expect(res.flushSet).to.eql('flushed');

                            callback(err);
                        });
                    },
                    function(callback) {
                        dummy2Repo.get('1987', function(err, res) {
                            expect(res.first).to.eql(undefined);
                            expect(res.second).to.eql(undefined);

                            callback(err);
                        });
                    }
                ], done);
            });

        });

    });

});