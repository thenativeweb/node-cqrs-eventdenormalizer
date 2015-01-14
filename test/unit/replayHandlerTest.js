var expect = require('expect.js'),
  _ = require('lodash'),
  EventDispatcher = require('../../lib/eventDispatcher'),
  ReplayHandler = require('../../lib/replayHandler'),
  revGuardStore = require('../../lib/revisionGuardStore');

describe('replayHandler', function () {

  var store;

  before(function (done) {
    revGuardStore.create(function (err, s) {
      store = s;
      done();
    })
  });

  describe('creating a new guard', function () {

    it('it should not throw an error', function () {

      expect(function () {
        new ReplayHandler({}, store);
      }).not.to.throwError();

    });

    it('it should return a correct object', function () {

      var repl = new ReplayHandler({}, store);
      expect(repl.definition).to.be.an('object');
      expect(repl.replay).to.be.a('function');
      expect(repl.replayStreamed).to.be.a('function');

    });

    describe('replaying', function () {

      var repl;

      var evt1 = {
        id: 'evtId1',
        aggregate: {
          id: 'aggId1',
          name: 'agg1'
        },
        revision: 1
      };

      var evt2 = {
        id: 'evtId2',
        aggregate: {
          id: 'aggId1',
          name: 'agg1'
        },
        revision: 2
      };

      var evt3 = {
        id: 'evtId1',
        aggregate: {
          id: 'aggId2',
          name: 'agg2'
        },
        context: {
          name: 'ctx'
        },
        revision: 4
      };

      var evt4 = {
        id: 'evtId3',
        aggregate: {
          id: 'aggId1',
          name: 'agg1'
        },
        context: {
          name: 'ctx'
        },
        revision: 3
      };

      var evt5 = {
        id: 'evtId2',
        aggregate: {
          id: 'aggId2',
          name: 'agg2'
        },
        context: {
          name: 'ctx'
        },
        revision: 5
      };

      var evts = [evt1, evt2, evt3, evt4, evt5];

      var disp;

      var def;

      beforeEach(function () {
        def = {
          correlationId: 'correlationId',
          id: 'id',
          payload: 'payload',
          name: 'name',
          aggregateId: 'aggregate.id',
          aggregate: 'aggregate.name',
          context: 'context.name',
          revision: 'revision',
          version: 'version',
          meta: 'meta'
        };
      });

      beforeEach(function (done) {
        store.clear(done);
      });

      describe('normally', function () {

        describe('having defined a revision', function () {

          it('it should work as expected', function (done) {

            var called1 = false;
            var called2 = false;
            var called3 = false;

            var evts1 = [];
            var evts2 = [];
            var evts3 = [];

            var saveRvmsCalled1 = false;
            var saveRvmsCalled2 = false;
            var saveRvmsCalled3 = false;

            disp = new EventDispatcher({
              getViewBuilders: function (query) {
                if (query.aggregate === 'agg1') {
                  return [{
                    collection: { workerId: '11', saveReplayingVms: function (clb) {saveRvmsCalled1 = true; clb(null);} },
                    workerId: '1',
                    denormalize: function (evt, callback) {
                      evts1.push(evt);
                      called1 = true;
                      callback(null);
                    }
                  }];
                } else if (query.aggregate === 'agg2') {
                  return [{
                    collection: { workerId: '22', saveReplayingVms: function (clb) {saveRvmsCalled2 = true; clb(null);} },
                    workerId: '2',
                    denormalize: function (evt, callback) {
                      evts2.push(evt);
                      called2 = true;
                      callback(null);
                    }
                  },{
                    collection: { workerId: '11', saveReplayingVms: function (clb) {saveRvmsCalled3 = true; clb(null);} },
                    workerId: '3',
                    denormalize: function (evt, callback) {
                      evts3.push(evt);
                      called3 = true;
                      callback(null);
                    }
                  }];
                }
              }
            }, def);

            repl = new ReplayHandler(disp, store, def);

            repl.replay(evts, function (err) {
              expect(err).not.to.be.ok();
              expect(called1).to.eql(true);
              expect(called2).to.eql(true);
              expect(called3).to.eql(true);

              expect(evts1[0]).to.eql(evt1);
              expect(evts1[1]).to.eql(evt2);
              expect(evts1[2]).to.eql(evt4);
              expect(evts2[0]).to.eql(evt3);
              expect(evts2[1]).to.eql(evt5);
              expect(evts3[0]).to.eql(evt3);
              expect(evts3[1]).to.eql(evt5);

              expect(saveRvmsCalled1).to.eql(true);
              expect(saveRvmsCalled2).to.eql(true);
              expect(saveRvmsCalled3).to.eql(false);

              store.get('aggId1', function (err, rev) {
                expect(err).not.to.be.ok();
                expect(rev).to.eql(4);

                store.get('aggId2', function (err, rev) {
                  expect(err).not.to.be.ok();
                  expect(rev).to.eql(6);

                  done();
                });
              });
            });

          });

        });

        describe('not having defined a revision', function () {

          it('it should work as expected', function (done) {

            delete def.revision;

            var called1 = false;
            var called2 = false;
            var called3 = false;

            var evts1 = [];
            var evts2 = [];
            var evts3 = [];

            var saveRvmsCalled1 = false;
            var saveRvmsCalled2 = false;
            var saveRvmsCalled3 = false;

            disp = new EventDispatcher({
              getViewBuilders: function (query) {
                if (query.aggregate === 'agg1') {
                  return [{
                    collection: { workerId: '11', saveReplayingVms: function (clb) {saveRvmsCalled1 = true; clb(null);} },
                    workerId: '1',
                    denormalize: function (evt, callback) {
                      evts1.push(evt);
                      called1 = true;
                      callback(null);
                    }
                  }];
                } else if (query.aggregate === 'agg2') {
                  return [{
                    collection: { workerId: '22', saveReplayingVms: function (clb) {saveRvmsCalled2 = true; clb(null);} },
                    workerId: '2',
                    denormalize: function (evt, callback) {
                      evts2.push(evt);
                      called2 = true;
                      callback(null);
                    }
                  },{
                    collection: { workerId: '11', saveReplayingVms: function (clb) {saveRvmsCalled3 = true; clb(null);} },
                    workerId: '3',
                    denormalize: function (evt, callback) {
                      evts3.push(evt);
                      called3 = true;
                      callback(null);
                    }
                  }];
                }
              }
            }, def);

            repl = new ReplayHandler(disp, store, def);

            repl.replay(evts, function (err) {
              expect(err).not.to.be.ok();
              expect(called1).to.eql(true);
              expect(called2).to.eql(true);
              expect(called3).to.eql(true);

              expect(evts1[0]).to.eql(evt1);
              expect(evts1[1]).to.eql(evt2);
              expect(evts1[2]).to.eql(evt4);
              expect(evts2[0]).to.eql(evt3);
              expect(evts2[1]).to.eql(evt5);
              expect(evts3[0]).to.eql(evt3);
              expect(evts3[1]).to.eql(evt5);

              expect(saveRvmsCalled1).to.eql(true);
              expect(saveRvmsCalled2).to.eql(true);
              expect(saveRvmsCalled3).to.eql(false);

              store.get('aggId1', function (err, rev) {
                expect(err).not.to.be.ok();
                expect(rev).not.to.be.ok();

                store.get('aggId2', function (err, rev) {
                  expect(err).not.to.be.ok();
                  expect(rev).not.to.be.ok();

                  done();
                });
              });
            });

          });

        });

      });

      describe('streamed', function () {

        describe('having defined a revision', function () {

          it('it should work as expected', function (done) {

            var called1 = false;
            var called2 = false;
            var called3 = false;

            var evts1 = [];
            var evts2 = [];
            var evts3 = [];

            var saveRvmsCalled1 = false;
            var saveRvmsCalled2 = false;
            var saveRvmsCalled3 = false;

            disp = new EventDispatcher({
              getViewBuilders: function (query) {
                if (query.aggregate === 'agg1') {
                  return [{
                    collection: { workerId: '11', saveReplayingVms: function (clb) {saveRvmsCalled1 = true; clb(null);} },
                    workerId: '1',
                    denormalize: function (evt, callback) {
                      evts1.push(evt);
                      called1 = true;
                      callback(null);
                    }
                  }];
                } else if (query.aggregate === 'agg2') {
                  return [{
                    collection: { workerId: '22', saveReplayingVms: function (clb) {saveRvmsCalled2 = true; clb(null);} },
                    workerId: '2',
                    denormalize: function (evt, callback) {
                      evts2.push(evt);
                      called2 = true;
                      callback(null);
                    }
                  },{
                    collection: { workerId: '11', saveReplayingVms: function (clb) {saveRvmsCalled3 = true; clb(null);} },
                    workerId: '3',
                    denormalize: function (evt, callback) {
                      evts3.push(evt);
                      called3 = true;
                      callback(null);
                    }
                  }];
                }
              }
            }, def);

            repl = new ReplayHandler(disp, store, def);

            repl.replayStreamed(function (replay, finished) {

              _.each(evts, function (e) {
                replay(e);
              });

              finished(function (err) {
                expect(err).not.to.be.ok();
                expect(called1).to.eql(true);
                expect(called2).to.eql(true);
                expect(called3).to.eql(true);

                expect(evts1[0]).to.eql(evt1);
                expect(evts1[1]).to.eql(evt2);
                expect(evts1[2]).to.eql(evt4);
                expect(evts2[0]).to.eql(evt3);
                expect(evts2[1]).to.eql(evt5);
                expect(evts3[0]).to.eql(evt3);
                expect(evts3[1]).to.eql(evt5);

                expect(saveRvmsCalled1).to.eql(true);
                expect(saveRvmsCalled2).to.eql(true);
                expect(saveRvmsCalled3).to.eql(false);

                store.get('aggId1', function (err, rev) {
                  expect(err).not.to.be.ok();
                  expect(rev).to.eql(4);

                  store.get('aggId2', function (err, rev) {
                    expect(err).not.to.be.ok();
                    expect(rev).to.eql(6);

                    done();
                  });
                });
              });

            });

          });

        });

        describe('not having defined a revision', function () {

          it('it should work as expected', function (done) {

            delete def.revision;

            var called1 = false;
            var called2 = false;
            var called3 = false;

            var evts1 = [];
            var evts2 = [];
            var evts3 = [];

            var saveRvmsCalled1 = false;
            var saveRvmsCalled2 = false;
            var saveRvmsCalled3 = false;

            disp = new EventDispatcher({
              getViewBuilders: function (query) {
                if (query.aggregate === 'agg1') {
                  return [{
                    collection: { workerId: '11', saveReplayingVms: function (clb) {saveRvmsCalled1 = true; clb(null);} },
                    workerId: '1',
                    denormalize: function (evt, callback) {
                      evts1.push(evt);
                      called1 = true;
                      callback(null);
                    }
                  }];
                } else if (query.aggregate === 'agg2') {
                  return [{
                    collection: { workerId: '22', saveReplayingVms: function (clb) {saveRvmsCalled2 = true; clb(null);} },
                    workerId: '2',
                    denormalize: function (evt, callback) {
                      evts2.push(evt);
                      called2 = true;
                      callback(null);
                    }
                  },{
                    collection: { workerId: '11', saveReplayingVms: function (clb) {saveRvmsCalled3 = true; clb(null);} },
                    workerId: '3',
                    denormalize: function (evt, callback) {
                      evts3.push(evt);
                      called3 = true;
                      callback(null);
                    }
                  }];
                }
              }
            }, def);

            repl = new ReplayHandler(disp, store, def);

            repl.replayStreamed(function (replay, finished) {

              _.each(evts, function (e) {
                replay(e);
              });

              finished(function (err) {
                expect(err).not.to.be.ok();
                expect(called1).to.eql(true);
                expect(called2).to.eql(true);
                expect(called3).to.eql(true);

                expect(evts1[0]).to.eql(evt1);
                expect(evts1[1]).to.eql(evt2);
                expect(evts1[2]).to.eql(evt4);
                expect(evts2[0]).to.eql(evt3);
                expect(evts2[1]).to.eql(evt5);
                expect(evts3[0]).to.eql(evt3);
                expect(evts3[1]).to.eql(evt5);

                expect(saveRvmsCalled1).to.eql(true);
                expect(saveRvmsCalled2).to.eql(true);
                expect(saveRvmsCalled3).to.eql(false);

                store.get('aggId1', function (err, rev) {
                  expect(err).not.to.be.ok();
                  expect(rev).not.to.be.ok();

                  store.get('aggId2', function (err, rev) {
                    expect(err).not.to.be.ok();
                    expect(rev).not.to.be.ok();

                    done();
                  });
                });
              });

            });

          });

        });

      });

    });

  });

});
