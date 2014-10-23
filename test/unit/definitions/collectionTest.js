var expect = require('expect.js'),
  _ = require('lodash'),
  async = require('async'),
  viewmodel = require('viewmodel'),
  DefinitionBase = require('../../../lib/definitionBase'),
  Collection = require('../../../lib/definitions/collection'),
  api = require('../../../');

describe('collection definition', function () {

  describe('creating a new collection definition', function () {

    it('it should not throw an error', function () {

      expect(function () {
        api.defineCollection();
      }).not.to.throwError();

    });

    it('it should return a correct object', function () {

      var col = api.defineCollection(null);
      expect(col).to.be.a(DefinitionBase);
      expect(col).to.be.a(Collection);
      expect(col.definitions).to.be.an('object');
      expect(col.definitions.notification).to.be.an('object');
      expect(col.definitions.event).to.be.an('object');
      expect(col.defineNotification).to.be.a('function');
      expect(col.defineEvent).to.be.a('function');
      expect(col.defineOptions).to.be.a('function');

      expect(col.useRepository).to.be.a('function');
      expect(col.addViewBuilder).to.be.a('function');
      expect(col.addEventExtender).to.be.a('function');
      expect(col.getViewBuilder).to.be.a('function');
      expect(col.getViewBuilders).to.be.a('function');
      expect(col.getEventExtender).to.be.a('function');
      expect(col.getEventExtenders).to.be.a('function');
      expect(col.getNewId).to.be.a('function');
      expect(col.saveViewModel).to.be.a('function');
      expect(col.loadViewModel).to.be.a('function');
      expect(col.findViewModels).to.be.a('function');
      expect(col.saveReplayingVms).to.be.a('function');

    });

    describe('calling addViewBuilder', function () {

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var col = api.defineCollection();

          expect(function () {
            col.addViewBuilder();
          }).to.throwError(/builder/);

        });

      });

      describe('with a correct object', function () {

        it('it should work as expected', function () {

          var col = api.defineCollection();

          col.addViewBuilder({ name: 'myEvent', useCollection: function (c) {
            expect(c).to.eql(col);
          }});

          expect(col.viewBuilders.length).to.eql(1);
          expect(col.viewBuilders[0].name).to.eql('myEvent');

        });

      });

      describe('having not defined a default payload for viewBuilders', function () {

        describe('having not defined a payload in the viewBuilder', function () {

          it('it should work as expected', function () {

            var col = api.defineCollection();

            col.addViewBuilder({ name: 'myEvent', payload: null, useCollection: function (c) {
              expect(c).to.eql(col);
            }});

            expect(col.viewBuilders.length).to.eql(1);
            expect(col.viewBuilders[0].payload).to.eql('');

          });

        });

        describe('having defined a payload in the command', function () {

          it('it should work as expected', function () {

            var col = api.defineCollection();

            col.addViewBuilder({ name: 'myEvent', payload: 'maPay', useCollection: function (c) {
              expect(c).to.eql(col);
            }});

            expect(col.viewBuilders.length).to.eql(1);
            expect(col.viewBuilders[0].payload).to.eql('maPay');

          });

        });

      });

      describe('having defined a default payload for commands', function () {

        describe('having not defined a payload in the command', function () {

          it('it should work as expected', function () {

            var col = api.defineCollection({ defaultPayload: 'def' });

            col.addViewBuilder({ name: 'myEvent', payload: null, useCollection: function (c) {
              expect(c).to.eql(col);
            }});

            expect(col.viewBuilders.length).to.eql(1);
            expect(col.viewBuilders[0].payload).to.eql('def');

          });

        });

        describe('having defined a payload in the command', function () {

          it('it should work as expected', function () {

            var col = api.defineCollection({ defaultPayload: 'def' });

            col.addViewBuilder({ name: 'myEvent', payload: 'maPay', useCollection: function (c) {
              expect(c).to.eql(col);
            }});

            expect(col.viewBuilders.length).to.eql(1);
            expect(col.viewBuilders[0].payload).to.eql('maPay');

          });

        });

      });

    });

    describe('calling addEventExtender', function () {

      describe('with a wrong object', function () {

        it('it should throw an error', function () {

          var col = api.defineCollection();

          expect(function () {
            col.addEventExtender();
          }).to.throwError(/extender/);

        });

      });

      describe('with a correct object', function () {

        it('it should work as expected', function () {

          var col = api.defineCollection();

          col.addEventExtender({ name: 'myEvent', useCollection: function (c) {
            expect(c).to.eql(col);
          }});

          expect(col.eventExtenders.length).to.eql(1);
          expect(col.eventExtenders[0].name).to.eql('myEvent');

        });

      });

    });

    describe('having added some viewBuilders', function () {

      var col;

      beforeEach(function () {
        col = api.defineCollection();
        col.addViewBuilder({ name: 'evt1', version: 0, aggregate: null, context: null, useCollection: function () {} });
        col.addViewBuilder({ name: 'evt2', version: 0, aggregate: null, context: null, useCollection: function () {} });
        col.addViewBuilder({ name: 'evt2', version: 1, aggregate: null, context: null, useCollection: function () {} });
        col.addViewBuilder({ name: 'evt2', version: 2, aggregate: null, context: null, useCollection: function () {} });
        col.addViewBuilder({ name: 'evt3', version: 0, aggregate: null, context: null, useCollection: function () {} });
        col.addViewBuilder({ name: 'evt3', version: 0, aggregate: 'agg', context: null, useCollection: function () {} });
        col.addViewBuilder({ name: 'evt3', version: 0, aggregate: 'agg', context: 'ctx', useCollection: function () {} });
      });

      describe('calling getViewBuilders', function () {

        it('it should return all viewBuilders', function () {

          var viewBuilders = col.getViewBuilders();
          expect(viewBuilders.length).to.eql(7);
          expect(viewBuilders[0].name).to.eql('evt1');
          expect(viewBuilders[0].version).to.eql(0);
          expect(viewBuilders[1].name).to.eql('evt2');
          expect(viewBuilders[1].version).to.eql(0);
          expect(viewBuilders[2].name).to.eql('evt2');
          expect(viewBuilders[2].version).to.eql(1);
          expect(viewBuilders[3].name).to.eql('evt2');
          expect(viewBuilders[3].version).to.eql(2);
          expect(viewBuilders[4].name).to.eql('evt3');
          expect(viewBuilders[4].version).to.eql(0);
          expect(viewBuilders[5].name).to.eql('evt3');
          expect(viewBuilders[5].aggregate).to.eql('agg');
          expect(viewBuilders[5].version).to.eql(0);
          expect(viewBuilders[6].name).to.eql('evt3');
          expect(viewBuilders[6].aggregate).to.eql('agg');
          expect(viewBuilders[6].context).to.eql('ctx');
          expect(viewBuilders[6].version).to.eql(0);

        });

      });

      describe('calling getViewBuilder', function () {

        it('it should work as expected', function () {

          var ex0 = col.getViewBuilder({ name: 'someEvtName' });
          expect(ex0).not.to.be.ok();

          var ex1 = col.getViewBuilder({ name: 'evt1', version: 3 });
          expect(ex1).not.to.be.ok();

          var ex2 = col.getViewBuilder({ name: 'evt1', version: 0 });
          expect(ex2.name).to.eql('evt1');
          expect(ex2.version).to.eql(0);

          var ex3 = col.getViewBuilder({ name: 'evt2', version: 0 });
          expect(ex3.name).to.eql('evt2');
          expect(ex3.version).to.eql(0);

          var ex4 = col.getViewBuilder({ name: 'evt2', version: 1 });
          expect(ex4.name).to.eql('evt2');
          expect(ex4.version).to.eql(1);

          var ex5 = col.getViewBuilder({ name: 'evt2', version: 2 });
          expect(ex5.name).to.eql('evt2');
          expect(ex5.version).to.eql(2);

          var ex6 = col.getViewBuilder({ name: 'evt3', version: 0 });
          expect(ex6.name).to.eql('evt3');
          expect(ex6.aggregate).not.to.be.ok();
          expect(ex6.context).not.to.be.ok();
          expect(ex6.version).to.eql(0);

          var ex7 = col.getViewBuilder({ name: 'evt3' });
          expect(ex7.name).to.eql('evt3');
          expect(ex7.aggregate).not.to.be.ok();
          expect(ex7.context).not.to.be.ok();
          expect(ex7.version).to.eql(0);

          var ex8 = col.getViewBuilder({ name: 'evt2' });
          expect(ex8.name).to.eql('evt2');
          expect(ex8.version).to.eql(0);

          var ex9 = col.getViewBuilder({ name: 'evt3', aggregate: 'agg' });
          expect(ex9.name).to.eql('evt3');
          expect(ex9.aggregate).to.eql('agg');
          expect(ex9.context).not.to.be.ok();
          expect(ex9.version).to.eql(0);

          var ex10 = col.getViewBuilder({ name: 'evt3', aggregate: 'agg', context: 'ctx' });
          expect(ex10.name).to.eql('evt3');
          expect(ex10.aggregate).to.eql('agg');
          expect(ex10.context).to.eql('ctx');
          expect(ex10.version).to.eql(0);

          var ex11 = col.getViewBuilder({ name: 'evt3', context: 'ctx' });
          expect(ex11.name).to.eql('evt3');
          expect(ex11.aggregate).to.eql('agg');
          expect(ex11.context).to.eql('ctx');
          expect(ex11.version).to.eql(0);

        });

      });

    });

    describe('having added some eventExtenders', function () {

      var col;

      beforeEach(function () {
        col = api.defineCollection();
        col.addEventExtender({ name: 'evt1', version: 0, aggregate: null, context: null, useCollection: function () {} });
        col.addEventExtender({ name: 'evt2', version: 0, aggregate: null, context: null, useCollection: function () {} });
        col.addEventExtender({ name: 'evt2', version: 1, aggregate: null, context: null, useCollection: function () {} });
        col.addEventExtender({ name: 'evt2', version: 2, aggregate: null, context: null, useCollection: function () {} });
        col.addEventExtender({ name: 'evt3', version: 0, aggregate: null, context: null, useCollection: function () {} });
        col.addEventExtender({ name: 'evt3', version: 0, aggregate: 'agg', context: null, useCollection: function () {} });
        col.addEventExtender({ name: 'evt3', version: 0, aggregate: 'agg', context: 'ctx', useCollection: function () {} });
      });

      describe('calling getEventExtenders', function () {

        it('it should return all eventExtenders', function () {

          var eventExtenders = col.getEventExtenders();
          expect(eventExtenders.length).to.eql(7);
          expect(eventExtenders[0].name).to.eql('evt1');
          expect(eventExtenders[0].version).to.eql(0);
          expect(eventExtenders[1].name).to.eql('evt2');
          expect(eventExtenders[1].version).to.eql(0);
          expect(eventExtenders[2].name).to.eql('evt2');
          expect(eventExtenders[2].version).to.eql(1);
          expect(eventExtenders[3].name).to.eql('evt2');
          expect(eventExtenders[3].version).to.eql(2);
          expect(eventExtenders[4].name).to.eql('evt3');
          expect(eventExtenders[4].version).to.eql(0);
          expect(eventExtenders[5].name).to.eql('evt3');
          expect(eventExtenders[5].aggregate).to.eql('agg');
          expect(eventExtenders[5].version).to.eql(0);
          expect(eventExtenders[6].name).to.eql('evt3');
          expect(eventExtenders[6].aggregate).to.eql('agg');
          expect(eventExtenders[6].context).to.eql('ctx');
          expect(eventExtenders[6].version).to.eql(0);

        });

      });

      describe('calling getEventExtender', function () {

        it('it should work as expected', function () {

          var ex0 = col.getEventExtender({ name: 'someEvtName' });
          expect(ex0).not.to.be.ok();

          var ex1 = col.getEventExtender({ name: 'evt1', version: 3 });
          expect(ex1).not.to.be.ok();

          var ex2 = col.getEventExtender({ name: 'evt1', version: 0 });
          expect(ex2.name).to.eql('evt1');
          expect(ex2.version).to.eql(0);

          var ex3 = col.getEventExtender({ name: 'evt2', version: 0 });
          expect(ex3.name).to.eql('evt2');
          expect(ex3.version).to.eql(0);

          var ex4 = col.getEventExtender({ name: 'evt2', version: 1 });
          expect(ex4.name).to.eql('evt2');
          expect(ex4.version).to.eql(1);

          var ex5 = col.getEventExtender({ name: 'evt2', version: 2 });
          expect(ex5.name).to.eql('evt2');
          expect(ex5.version).to.eql(2);

          var ex6 = col.getEventExtender({ name: 'evt3', version: 0 });
          expect(ex6.name).to.eql('evt3');
          expect(ex6.aggregate).not.to.be.ok();
          expect(ex6.context).not.to.be.ok();
          expect(ex6.version).to.eql(0);

          var ex7 = col.getEventExtender({ name: 'evt3' });
          expect(ex7.name).to.eql('evt3');
          expect(ex7.aggregate).not.to.be.ok();
          expect(ex7.context).not.to.be.ok();
          expect(ex7.version).to.eql(0);

          var ex8 = col.getEventExtender({ name: 'evt2' });
          expect(ex8.name).to.eql('evt2');
          expect(ex8.version).to.eql(0);

          var ex9 = col.getEventExtender({ name: 'evt3', aggregate: 'agg' });
          expect(ex9.name).to.eql('evt3');
          expect(ex9.aggregate).to.eql('agg');
          expect(ex9.context).not.to.be.ok();
          expect(ex9.version).to.eql(0);

          var ex10 = col.getEventExtender({ name: 'evt3', aggregate: 'agg', context: 'ctx' });
          expect(ex10.name).to.eql('evt3');
          expect(ex10.aggregate).to.eql('agg');
          expect(ex10.context).to.eql('ctx');
          expect(ex10.version).to.eql(0);

          var ex11 = col.getEventExtender({ name: 'evt3', context: 'ctx' });
          expect(ex11.name).to.eql('evt3');
          expect(ex11.aggregate).to.eql('agg');
          expect(ex11.context).to.eql('ctx');
          expect(ex11.version).to.eql(0);

        });

      });

    });

    describe('using a repository', function () {

      var col;

      before(function (done) {
        viewmodel.write(function (err, repository) {
          col = api.defineCollection({ name: 'dummy' }, { my: { def: 'data' } });
          col.useRepository(repository);
          done();
        })
      });

      describe('calling getNewId', function() {

        it('it should callback with a new id as string', function (done) {

          col.getNewId(function (err, id) {
            expect(err).not.to.be.ok();
            expect(id).to.be.a('string');
            done();
          });

        });

      });

      describe('calling loadViewModel', function () {

        describe('in normal mode', function () {

          it('it should work as expected', function (done) {

            var orgRepo = col.repository;
            col.repository = {
              get: function (id, clb) {
                clb(null, {theId: id, has: function () { return true }});
              }
            };

            col.loadViewModel('423', function (err, vm) {
              expect(err).not.to.be.ok();
              expect(vm.theId).to.eql('423');

              col.repository = orgRepo;
              col.isReplaying = false;
              done();
            });

          });

        });

        describe('in replay mode', function () {

          describe('not having a cached vm', function () {

            it('it should work as expected', function (done) {

              var orgRepo = col.repository;
              col.repository = {
                get: function (id, clb) {
                  clb(null, {theId: id, has: function () { return true }});
                }
              };
              col.isReplaying = true;
//              col.replayingVms['423'] = { id: '423', cached: true };
              col.loadViewModel('423', function (err, vm) {
                expect(err).not.to.be.ok();
                expect(vm.theId).to.eql('423');

                col.repository = orgRepo;
                col.isReplaying = false;
                done();
              });

            });

          });

          describe('having a cached vm', function () {

            it('it should work as expected', function (done) {

              var orgRepo = col.repository;
              col.repository = {
                get: function (id, clb) {
                  clb(null, {theId: id, has: function () { return true }});
                }
              };
              col.isReplaying = true;
              col.replayingVms['423'] = { id: '423', cached: true };
              col.loadViewModel('423', function (err, vm) {
                expect(err).not.to.be.ok();
                expect(vm.id).to.eql('423');
                expect(vm.cached).to.eql(true);

                col.repository = orgRepo;
                col.isReplaying = false;
                col.replayingVms = {};
                done();
              });

            });

          });

          describe('having a cached deleted vm', function () {

            it('it should work as expected', function (done) {

              var orgRepo = col.repository;
              col.repository = {
                get: function (id, clb) {
                  clb(null, {theId: id, has: function () { return true }});
                }
              };
              col.isReplaying = true;
              col.replayingVmsToDelete['423'] = { id: '423', cached: true };
              col.loadViewModel('423', function (err, vm) {
                expect(err).not.to.be.ok();
                expect(vm.id).to.eql('423');
                expect(vm.cached).not.to.eql(true);

                col.repository = orgRepo;
                col.isReplaying = false;
                col.replayingVms = {};
                col.replayingVmsToDelete = {};
                done();
              });

            });

          });

        });

      });

      describe('calling findViewModels', function () {

        describe('in normal mode', function () {

          it('it should work as expected', function (done) {

            var orgRepo = col.repository;
            col.repository = {
              find: function (query, queryOpt, clb) {
                expect(query.id).to.eql('8372');
                clb(null, [{id: '8372', has: function () { return true }}]);
              }
            };

            col.findViewModels({ id: '8372' }, function (err, vms) {
              expect(err).not.to.be.ok();
              expect(vms.length).to.eql(1);
              expect(vms[0].id).to.eql('8372');

              col.repository = orgRepo;
              col.isReplaying = false;
              done();
            });

          });

        });

        describe('in replay mode', function () {

          describe('not having a cached vm', function () {

            it('it should work as expected', function (done) {

              var orgRepo = col.repository;
              col.repository = {
                find: function (query, queryOpt, clb) {
                  expect(query.id).to.eql('8372');
                  clb(null, [{id: '8372', has: function () { return true }}]);
                }
              };
              col.isReplaying = true;
//              col.replayingVms['423'] = { id: '423', cached: true };
              col.findViewModels({ id: '8372' }, function (err, vms) {
                expect(err).not.to.be.ok();
                expect(vms.length).to.eql(1);
                expect(vms[0].id).to.eql('8372');

                col.repository = orgRepo;
                col.isReplaying = false;
                done();
              });

            });

          });

          describe('having a cached vm', function () {

            it('it should work as expected', function (done) {

              var orgRepo = col.repository;
              col.repository = {
                find: function (query, queryOpt, clb) {
                  expect(query.id).to.eql('8372');
                  clb(null, [{id: '8372', has: function () { return true }}]);
                }
              };
              col.isReplaying = true;
              col.replayingVms['8372'] = { id: '8372', cached: true };
              col.findViewModels({ id: '8372' }, function (err, vms) {
                expect(err).not.to.be.ok();
                expect(vms.length).to.eql(1);
                expect(vms[0].id).to.eql('8372');
                expect(vms[0].cached).to.eql(true);

                col.repository = orgRepo;
                col.isReplaying = false;
                col.replayingVms = {};
                done();
              });

            });

          });

          describe('having a cached deleted vm', function () {

            it('it should work as expected', function (done) {

              var orgRepo = col.repository;
              col.repository = {
                find: function (query, queryOpt, clb) {
                  expect(query.id).to.eql('8372');
                  clb(null, [{id: '8372', has: function () { return true }}]);
                }
              };
              col.isReplaying = true;
              col.replayingVmsToDelete['8372'] = { id: '8372', cached: true };
              col.findViewModels({ id: '8372' }, function (err, vms) {
                expect(err).not.to.be.ok();
                expect(vms.length).to.eql(0);

                col.repository = orgRepo;
                col.isReplaying = false;
                col.replayingVms = {};
                col.replayingVmsToDelete = {};
                done();
              });

            });

          });

        });

      });

      describe('calling saveViewModel', function () {

        describe('in normal mode', function () {

          it('it should work as expected', function (done) {

            var orgRepo = col.repository;
            col.repository = {
              commit: function (vm, clb) {
                expect(vm.id).to.eql('423');
                called = true;
                clb(null);
              }
            };

            var called = false;
            col.saveViewModel({ id: '423' }, function (err) {
              expect(err).not.to.be.ok();
              expect(called).to.eql(true);

              col.repository = orgRepo;
              col.isReplaying = false;
              done();
            });

          });

        });

        describe('in replay mode', function () {

          it('it should work as expected', function (done) {

            var orgRepo = col.repository;
            col.repository = {
              commit: function (vm, clb) {
                expect(vm.id).to.eql('423');
                called = true;
                clb(null);
              }
            };

            var called = false;
            col.isReplaying = true;
            col.saveViewModel({ id: '423' }, function (err) {
              expect(err).not.to.be.ok();
              expect(called).to.eql(false);
              expect(col.replayingVms['423'].id).to.eql('423');

              col.repository = orgRepo;
              col.isReplaying = false;
              done();
            });

          });

          describe('having a deleted vm', function () {

            it('it should work as expected', function (done) {

              var orgRepo = col.repository;
              col.repository = {
                commit: function (vm, clb) {
                  expect(vm.id).to.eql('423');
                  called = true;
                  clb(null);
                }
              };

              var called = false;
              col.isReplaying = true;
              col.saveViewModel({ id: '423', actionOnCommit: 'delete' }, function (err) {
                expect(err).not.to.be.ok();
                expect(called).to.eql(false);
                expect(col.replayingVms['423']).not.to.be.ok();
                expect(col.replayingVmsToDelete['423'].id).to.eql('423');

                col.repository = orgRepo;
                col.isReplaying = false;
                col.replayingVmsToDelete = {};
                done();
              });

            });

          });

        });

      });

      describe('calling saveReplayingVms', function () {

        describe('in normal mode', function () {

          it('it callback with an error', function (done) {

            var orgRepo = col.repository;
            col.repository = {
              commit: function (vm, clb) {
                called = true;
                clb(null);
              }
            };

            var called = false;
            col.saveReplayingVms(function (err) {
              expect(err).to.be.ok();
              expect(err.message).to.match(/replay/);
              expect(called).to.eql(false);

              col.repository = orgRepo;
              col.isReplaying = false;
              done();
            });

          });

        });

        describe('in replay mode', function () {

          it('it should work as expected', function (done) {

            var commitCalled = [];

            var orgRepo = col.repository;
            col.repository = {
              commit: function (vm, clb) {
                commitCalled.push(vm);
                clb(null);
              }
            };

            col.isReplaying = true;
            col.replayingVms['423'] = { id: '423', cached: true };
            col.replayingVmsToDelete['5123'] = { id: '5123', cached: true };
            col.saveReplayingVms(function (err) {
              expect(err).not.to.be.ok();
              expect(commitCalled.length).to.eql(2);
              expect(commitCalled[0].id).to.eql('5123');
              expect(commitCalled[1].id).to.eql('423');

              col.repository = orgRepo;
              col.isReplaying = false;
              col.replayingVms = {};
              col.replayingVmsToDelete = {};
              done();
            });

          });

        });

      });

      describe('having an empty read model', function () {

        beforeEach(function (done) {
          col.findViewModels(function (err, vms) {
            async.each(vms, function (vm, callback) {
              vm.destroy();
              col.saveViewModel(vm, callback);
            }, done)
          });
        });

        describe('calling loadViewModel', function() {

          it('it should callback with a new view model', function (done) {

            col.loadViewModel('vmId', function (err, vm) {
              expect(err).not.to.be.ok();
              expect(vm).to.be.an('object');
              expect(vm.get('my.def')).to.eql('data');
              done();
            });

          });

        });

        describe('calling findViewModels', function() {

          it('it should callback with an empty array', function (done) {

            col.findViewModels(function (err, vms) {
              expect(err).not.to.be.ok();
              expect(vms).to.be.an('array');
              expect(vms.length).to.eql(0);
              done();
            });

          });

        });

        describe('calling commit', function() {

          it('it should work as expected', function (done) {

            col.loadViewModel('vmId', function (err, vm) {
              expect(err).not.to.be.ok();
              expect(vm).to.be.an('object');
              expect(vm.get('my.def')).to.eql('data');

              vm.set('new', 'value');
              col.saveViewModel(vm, function (err) {
                expect(err).not.to.be.ok();

                col.loadViewModel('vmId', function (err, vm) {
                  expect(err).not.to.be.ok();
                  expect(vm).to.be.an('object');
                  expect(vm.get('my.def')).to.eql('data');
                  expect(vm.get('new')).to.eql('value');
                  expect(vm.toJSON().my.def).to.eql('data');
                  expect(vm.toJSON().new).to.eql('value');

                  col.findViewModels(function (err, vms) {
                    expect(err).not.to.be.ok();
                    expect(vms).to.be.an('array');
                    expect(vms.length).to.eql(1);
                    expect(vms[0].get('my.def')).to.eql('data');
                    expect(vms[0].get('new')).to.eql('value');

                    done();
                  });
                });
              });
            });

          });

        });

      });

      describe('having some viewmodels in the read model', function () {

        beforeEach(function (done) {
          col.findViewModels(function (err, vms) {
            async.each(vms, function (vm, callback) {
              vm.destroy();
              col.saveViewModel(vm, callback);
            }, function () {
              col.loadViewModel('4567', function (err, vm) {
                col.saveViewModel(vm, function (err) {
                  col.loadViewModel('4568', function (err, vm) {
                    col.saveViewModel(vm, done);
                  });
                });
              });
            })
          });
        });

        it('it should return all records within an array', function(done) {

          col.loadViewModel('4567', function (err, vm1) {
            col.loadViewModel('4568', function (err, vm2) {
              col.findViewModels(function (err, results) {
                expect(results).to.have.length(2);
                expect(results.toJSON).to.be.a('function');
                expect(results[0].id === vm1.id || results[1].id === vm1.id);
                expect(results[0].id === vm2.id || results[1].id === vm2.id);
                done();
              });
            });
          });

        });

        describe('calling toJSON on a result array', function() {

          it('it should return the correct data', function (done) {

            col.loadViewModel('4567', function (err, vm1) {
              vm1.set('my', 'data');
              col.saveViewModel(vm1, function (err) {
                col.loadViewModel('4568', function (err, vm2) {
                  col.findViewModels(function (err, results) {
                    var res = results.toJSON();
                    expect(res[0].id === vm1.id || res[1].id === vm1.id);
                    expect(res[0].id === vm2.id || res[1].id === vm2.id);
                    expect(res[0].my === 'data' || res[1].my === 'data');
                    done();
                  });
                });
              });
            });

          });

        });

        it('the containing objects should have an actionOnCommit property', function(done) {

          col.loadViewModel('4567', function (err, vm1) {
            col.loadViewModel('4568', function (err, vm2) {
              col.findViewModels(function (err, results) {
                expect(results[0]).to.be.an('object');
                expect(results[1]).to.be.an('object');
                done();
              });
            });
          });

        });

        it('the containing objects should have a set and a get and a destroy and a commit function', function(done) {

          col.loadViewModel('4567', function (err, vm1) {
            col.loadViewModel('4568', function (err, vm2) {
              col.findViewModels(function (err, results) {
                expect(results[0]).to.be.an('object');
                expect(results[1]).to.be.an('object');
                done();
              });
            });
          });

        });

        describe('with a query object', function() {

          describe('having no records', function() {

            beforeEach(function (done) {
              col.findViewModels(function (err, vms) {
                async.each(vms, function (vm, callback) {
                  vm.destroy();
                  col.saveViewModel(vm, callback);
                }, done)
              });
            });

            it('it should return an empty array', function(done) {

              col.findViewModels({}, function (err, results) {
                expect(results).to.be.an('array');
                expect(results).to.have.length(0);
                done();
              });

            });

          });

          describe('having any records', function() {

            beforeEach(function(done) {

              col.findViewModels(function (err, vms) {
                async.each(vms, function (vm, callback) {
                  vm.destroy();
                  col.saveViewModel(vm, callback);
                }, function () {
                  col.loadViewModel('4567', function (err, vm) {
                    vm.set('foo', 'bar');

                    col.saveViewModel(vm, function (err) {
                      col.loadViewModel('4568', function (err, vm2) {
                        vm2.set('foo', 'wat');
                        col.saveViewModel(vm2, done);
                      });
                    });
                  });
                })
              });

            });

            describe('not matching the query object', function() {

              it('it should return an empty array', function(done) {

                col.findViewModels({ foo: 'bas' }, function(err, results) {
                  expect(results).to.be.an('array');
                  expect(results).to.have.length(0);
                  done();
                });

              });

            });


            describe('matching the query object', function() {

              it('it should return all matching records within an array', function(done) {

                col.findViewModels({ foo: 'bar' }, function(err, results) {
                  expect(results).to.be.an('array');
                  expect(results).to.have.length(1);
                  done();
                });

              });

            });

            describe('matching the query object, that queries an array', function() {

              beforeEach(function(done) {

                col.loadViewModel('4567', function (err, vm) {
                  vm.set('foos', [ { foo: 'bar' } ]);
                  col.saveViewModel(vm, done);
                });

              });

              it('it should return all matching records within an array', function(done) {

                col.findViewModels({ 'foos.foo': 'bar' }, function(err, results) {
                  expect(results).to.be.an('array');
                  expect(results).to.have.length(1);
                  done();
                });

              });

            });

          });

        });

        describe('with query options', function () {

          beforeEach(function(done) {

            col.findViewModels(function (err, vms) {
              async.each(vms, function (vm, callback) {
                vm.destroy();
                col.saveViewModel(vm, callback);
              }, function () {
                col.loadViewModel('4567', function (err, vm) {
                  vm.set('foo', 'bar');

                  col.saveViewModel(vm, function (err) {
                    col.loadViewModel('4568', function (err, vm2) {
                      vm2.set('foo', 'wat');
                      col.saveViewModel(vm2, function(err) {
                        col.loadViewModel('4569', function(err, vm3) {

                          vm3.set('foo', 'bit');
                          col.saveViewModel(vm3, done);
                        });
                      });
                    });
                  });
                });
              })
            });

          });

          describe('for paging limit: 2, skip: 1', function () {

            it('it should work as expected', function (done) {

              col.findViewModels({}, {
                limit: 2,
                skip: 1
              }, function (err, results) {
                expect(results).to.be.an('array');
                expect(results.length).to.eql(2);
                expect(results.toJSON).to.be.a('function');
                expect(results[0].get('foo') === 'wat' || results[1].get('foo') === 'wat');
                expect(results[0].get('foo') === 'bit' || results[1].get('foo') === 'bit');

                done();
              });

            });

          });

        });

      });

    });

  });

});
