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

            disp = new EventDispatcher({
              getViewBuilders: function (query) {
                if (query.aggregate === 'agg1') {
                  return [{
                    workerId: '1',
                    replay: function (evts, callback) {
                      expect(evts[0]).to.eql(evt1);
                      expect(evts[1]).to.eql(evt2);
                      expect(evts[2]).to.eql(evt4);
                      called1 = true;
                      callback(null);
                    }
                  }];
                } else if (query.aggregate === 'agg2') {
                  return [{
                    workerId: '2',
                    replay: function (evts, callback) {
                      expect(evts[0]).to.eql(evt3);
                      expect(evts[1]).to.eql(evt5);
                      called2 = true;
                      callback(null);
                    }
                  },{
                    workerId: '3',
                    replay: function (evts, callback) {
                      expect(evts[0]).to.eql(evt3);
                      expect(evts[1]).to.eql(evt5);
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

            disp = new EventDispatcher({
              getViewBuilders: function (query) {
                if (query.aggregate === 'agg1') {
                  return [{
                    workerId: '1',
                    replay: function (evts, callback) {
                      expect(evts[0]).to.eql(evt1);
                      expect(evts[1]).to.eql(evt2);
                      expect(evts[2]).to.eql(evt4);
                      called1 = true;
                      callback(null);
                    }
                  }];
                } else if (query.aggregate === 'agg2') {
                  return [{
                    workerId: '2',
                    replay: function (evts, callback) {
                      expect(evts[0]).to.eql(evt3);
                      expect(evts[1]).to.eql(evt5);
                      called2 = true;
                      callback(null);
                    }
                  },{
                    workerId: '3',
                    replay: function (evts, callback) {
                      expect(evts[0]).to.eql(evt3);
                      expect(evts[1]).to.eql(evt5);
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

            var calledRepl1 = [];
            var calledDone1 = false;
            var calledRepl2 = [];
            var calledDone2 = false;
            var calledRepl3 = [];
            var calledDone3 = false;

            disp = new EventDispatcher({
              getViewBuilders: function (query) {
                if (query.aggregate === 'agg1') {
                  return [{
                    workerId: '1',
                    replayStreamed: function (fn) {
                      fn(function (evt) {
                        calledRepl1.push(evt);
                      }, function (clb) {
                        calledDone1 = true;
                        clb(null);
                      });
                    }
                  }];
                } else if (query.aggregate === 'agg2') {
                  return [{
                    workerId: '2',
                    replayStreamed: function (fn) {
                      fn(function (evt) {
                        calledRepl2.push(evt);
                      }, function (clb) {
                        calledDone2 = true;
                        clb(null);
                      });
                    }
                  },{
                    workerId: '3',
                    replayStreamed: function (fn) {
                      fn(function (evt) {
                        calledRepl3.push(evt);
                      }, function (clb) {
                        calledDone3 = true;
                        clb(null);
                      });
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
                expect(calledDone1).to.eql(true);
                expect(calledRepl1.length).to.eql(3);
                expect(calledRepl1[0]).to.eql(evt1);
                expect(calledRepl1[1]).to.eql(evt2);
                expect(calledRepl1[2]).to.eql(evt4);
                expect(calledDone2).to.eql(true);
                expect(calledRepl2.length).to.eql(2);
                expect(calledRepl2[0]).to.eql(evt3);
                expect(calledRepl2[1]).to.eql(evt5);
                expect(calledDone3).to.eql(true);
                expect(calledRepl3.length).to.eql(2);
                expect(calledRepl3[0]).to.eql(evt3);
                expect(calledRepl3[1]).to.eql(evt5);

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

            var calledRepl1 = [];
            var calledDone1 = false;
            var calledRepl2 = [];
            var calledDone2 = false;
            var calledRepl3 = [];
            var calledDone3 = false;

            disp = new EventDispatcher({
              getViewBuilders: function (query) {
                if (query.aggregate === 'agg1') {
                  return [{
                    workerId: '1',
                    replayStreamed: function (fn) {
                      fn(function (evt) {
                        calledRepl1.push(evt);
                      }, function (clb) {
                        calledDone1 = true;
                        clb(null);
                      });
                    }
                  }];
                } else if (query.aggregate === 'agg2') {
                  return [{
                    workerId: '2',
                    replayStreamed: function (fn) {
                      fn(function (evt) {
                        calledRepl2.push(evt);
                      }, function (clb) {
                        calledDone2 = true;
                        clb(null);
                      });
                    }
                  },{
                    workerId: '3',
                    replayStreamed: function (fn) {
                      fn(function (evt) {
                        calledRepl3.push(evt);
                      }, function (clb) {
                        calledDone3 = true;
                        clb(null);
                      });
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
                expect(calledDone1).to.eql(true);
                expect(calledRepl1.length).to.eql(3);
                expect(calledRepl1[0]).to.eql(evt1);
                expect(calledRepl1[1]).to.eql(evt2);
                expect(calledRepl1[2]).to.eql(evt4);
                expect(calledDone2).to.eql(true);
                expect(calledRepl2.length).to.eql(2);
                expect(calledRepl2[0]).to.eql(evt3);
                expect(calledRepl2[1]).to.eql(evt5);
                expect(calledDone3).to.eql(true);
                expect(calledRepl3.length).to.eql(2);
                expect(calledRepl3[0]).to.eql(evt3);
                expect(calledRepl3[1]).to.eql(evt5);

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
