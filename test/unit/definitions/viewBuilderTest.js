var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase'),
  ViewBuilder = require('../../../lib/definitions/viewBuilder'),
  api = require('../../../');

describe('viewBuilder definition', function () {

  describe('creating a new viewBuilder definition', function () {

    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineViewBuilder();
        }).to.throwError(/function/);

      });

    });

    describe('without denorm function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineViewBuilder(null);
        }).to.throwError(/function/);

      });

    });

    describe('with a wrong denorm function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineViewBuilder(null, 2);
        }).to.throwError(/function/);

      });

    });

    describe('with a correct denorm function', function () {

      describe('like a function', function () {

        it('it should not throw an error', function () {

          expect(function () {
            api.defineViewBuilder(null, function () {
            });
          }).not.to.throwError();

        });

        it('it should return a correct object', function () {

          var denormFn = function () {
          };
          var vb = api.defineViewBuilder(null, denormFn);
          expect(vb).to.be.a(DefinitionBase);
          expect(vb).to.be.a(ViewBuilder);
          expect(vb.denormFn).to.be.a('function');
          expect(vb.definitions).to.be.an('object');
          expect(vb.definitions.notification).to.be.an('object');
          expect(vb.definitions.event).to.be.an('object');
          expect(vb.defineNotification).to.be.a('function');
          expect(vb.defineEvent).to.be.a('function');
          expect(vb.defineOptions).to.be.a('function');

          expect(vb.idGenerator).to.be.a('function');
          expect(vb.useCollection).to.be.a('function');
          expect(vb.loadViewModel).to.be.a('function');
          expect(vb.saveViewModel).to.be.a('function');
          expect(vb.extractId).to.be.a('function');
          expect(vb.generateNotification).to.be.a('function');
          expect(vb.denormalize).to.be.a('function');

        });

      });

      describe('like a function string', function () {

        it('it should not throw an error', function () {

          expect(function () {
            api.defineViewBuilder(null, 'update');
          }).not.to.throwError();

        });

        it('it should return a correct object', function () {

          var vb = api.defineViewBuilder(null, 'delete');
          expect(vb).to.be.a(DefinitionBase);
          expect(vb).to.be.a(ViewBuilder);
          expect(vb.denormFn).to.be.a('function');
          expect(vb.definitions).to.be.an('object');
          expect(vb.definitions.notification).to.be.an('object');
          expect(vb.definitions.event).to.be.an('object');
          expect(vb.defineNotification).to.be.a('function');
          expect(vb.defineEvent).to.be.a('function');
          expect(vb.defineOptions).to.be.a('function');

          expect(vb.idGenerator).to.be.a('function');
          expect(vb.useCollection).to.be.a('function');
          expect(vb.findViewModels).to.be.a('function');
          expect(vb.loadViewModel).to.be.a('function');
          expect(vb.saveViewModel).to.be.a('function');
          expect(vb.extractId).to.be.a('function');
          expect(vb.generateNotification).to.be.a('function');
          expect(vb.denormalize).to.be.a('function');

        });

      });

    });

    describe('defining an use as id function', function() {
      var vb;

      beforeEach(function () {
        vb = api.defineViewBuilder({ name: 'eventName', version: 4 }, 'create');
        vb.getNewIdForThisViewModel = null;
      });

      describe('in a synchronous way', function() {
        it('it should be transformed internally to an asynchronous way', function(done) {
          vb.useAsId(function(evt) {
            expect(evt.my).to.eql('evt');
            return 'freshly-generated';
          });

          vb.extractId({ my: 'evt' }, function(err,id) {
            expect(id).to.eql('freshly-generated');
            done();
          });
        });
      });

      describe('in an asynchronous way', function() {

        it('it should be taken as it is', function(done) {
          vb.useAsId(function(evt, callback) {
            expect(evt.my).to.eql('evt');
            callback(null, 'freshly-generated');
          });

          vb.extractId({ my: 'evt' }, function(err, id) {
            expect(id).to.eql('freshly-generated');
            done();
          });
        });
      });      
      
    });    

    describe('defining an id generator function', function () {

      var vb;

      beforeEach(function () {
        vb = api.defineViewBuilder({ name: 'eventName', version: 3 }, 'create');
        vb.getNewId = null;
      });

      describe('in a synchronous way', function () {

        it('it should be transformed internally to an asynchronous way', function (done) {

          vb.idGenerator(function () {
            var id = require('uuid').v4().toString();
            return id;
          });

          vb.getNewId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

      describe('in an synchronous way', function () {

        it('it should be taken as it is', function (done) {

          vb.idGenerator(function (callback) {
            setTimeout(function () {
              var id = require('uuid').v4().toString();
              callback(null, id);
            }, 10);
          });

          vb.getNewId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

    });

    describe('calling useCollection', function () {

      var vb;

      before(function () {
        vb = api.defineViewBuilder(null, 'update');
      });

      it('it should work as expected', function () {

        var col = { name: 'dummy' };
        vb.useCollection(col);
        expect(vb.collection).to.eql(col);

      });

    });

    describe('calling loadViewModel', function () {

      var vb;

      beforeEach(function () {
        vb = api.defineViewBuilder(null, 'update');
      });

      it('it should work as expected', function (done) {

        var col = { name: 'dummy', loadViewModel: function (id, callback) {
          callback(null, { id: id });
        }};
        vb.useCollection(col);
        vb.loadViewModel('423', function (err, vm) {
          expect(err).not.to.be.ok();
          expect(vm.id).to.eql('423');
          done();
        });

      });

    });

    describe('calling saveViewModel', function () {

      var vb;

      beforeEach(function () {
        vb = api.defineViewBuilder(null, 'update');
      });

      it('it should work as expected', function (done) {

        var called = false;
        var col = { name: 'dummy', saveViewModel: function (vm, callback) {
          expect(vm.id).to.eql('423');
          called = true;
          callback(null);
        }};
        vb.useCollection(col);
        vb.saveViewModel({ id: '423' }, function (err) {
          expect(err).not.to.be.ok();
          expect(called).to.eql(true);
          done();
        });

      });

    });

    describe('calling extractId', function () {

      var vb;

      beforeEach(function () {
        vb = api.defineViewBuilder({ id: 'myId' }, 'update');
      });

      describe('not passing that id', function () {

        it('it should work as expected', function (done) {

          var col = { name: 'dummy', getNewId: function (callback) {
            callback(null, 'newId');
          }};
          vb.useCollection(col);
          vb.extractId({ id: '423' }, function (err, id) {
            expect(err).not.to.be.ok();
            expect(id).to.eql('newId');
            done();
          });

        });

      });

      describe('passing that id', function () {

        it('it should work as expected', function (done) {

          var col = { name: 'dummy', getNewId: function (callback) {
            callback(null, 'newId');
          }};
          vb.useCollection(col);
          vb.extractId({ myId: '423' }, function (err, id) {
            expect(err).not.to.be.ok();
            expect(id).to.eql('423');
            done();
          });

        });

      });

    });

    describe('calling generateNotification', function () {

      var vb;

      beforeEach(function () {
        vb = api.defineViewBuilder(null, 'update');
      });

      it('it should work as expected', function () {

        vb.defineEvent({
          correlationId: 'correlationId',
          id: 'id',
          name: 'name',
          aggregateId: 'aggregate.id',
          context: 'context.name',
          aggregate: 'aggregate.name',
          payload: 'payload',
          revision: 'revision',
          version: 'version',
          meta: 'meta'
        });

        vb.defineNotification({
          correlationId: 'correlationId',
          id: 'id',
          action: 'name',
          collection: 'collection',
          payload: 'payload',
          context: 'meta.context.name',
          aggregate: 'meta.aggregate.name',
          aggregateId: 'meta.aggregate.id',
          revision: 'meta.aggregate.revision',
          eventId: 'meta.event.id',
          event: 'meta.event.name',
          meta: 'meta'
        });

        var col = { name: 'dummy' };
        vb.useCollection(col);

        var evt = {
          correlationId: 'cmdId',
          id: 'evtId',
          name: 'enteredNewPerson',
          aggregate: {
            id: 'aggId',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            firstname: 'Jack',
            lastname: 'Joe'
          },
          revision: 1,
          version: 4,
          meta: {
            userId: 'usrId'
          }
        };

        var vm = {
          actionOnCommit: 'update',
          toJSON: function () {
            return { vmAs: 'json' };
          }
        };

        var noti = vb.generateNotification(evt, vm);

        expect(noti.meta.userId).to.eql('usrId');
        expect(noti.meta.event.id).to.eql('evtId');
        expect(noti.meta.event.name).to.eql('enteredNewPerson');
        expect(noti.meta.aggregate.id).to.eql('aggId');
        expect(noti.meta.aggregate.name).to.eql('person');
        expect(noti.meta.aggregate.revision).to.eql(1);
        expect(noti.meta.context.name).to.eql('hr');
        expect(noti.correlationId).to.eql('cmdId');
        expect(noti.payload.vmAs).to.eql('json');
        expect(noti.collection).to.eql('dummy');
        expect(noti.name).to.eql('update');

      });

    });

    describe('denormalizing an event', function () {

      describe('defining a payload', function () {

        it('it should work as expected', function (done) {

          var vb = api.defineViewBuilder({ payload: 'payload' }, 'update');

          vb.defineEvent({
            correlationId: 'correlationId',
            id: 'id',
            name: 'name',
            aggregateId: 'aggregate.id',
            context: 'context.name',
            aggregate: 'aggregate.name',
            payload: 'payload',
            revision: 'revision',
            version: 'version',
            meta: 'meta'
          });

          vb.defineNotification({
            correlationId: 'correlationId',
            id: 'id',
            action: 'name',
            collection: 'collection',
            payload: 'payload',
            context: 'meta.context.name',
            aggregate: 'meta.aggregate.name',
            aggregateId: 'meta.aggregate.id',
            revision: 'meta.aggregate.revision',
            eventId: 'meta.event.id',
            event: 'meta.event.name',
            meta: 'meta'
          });

          var vm = {
            actionOnCommit: 'update',
            set: function (data) {
              this.attr = data;
            },
            toJSON: function () {
              return this.attr;
            }
          };

          var col = { name: 'dummy',
            getNewId: function (callback) { callback(null, 'newId'); },
            loadViewModel: function (id, callback) {
              vm.id = id;
              callback(null, vm);
            },
            saveViewModel: function (vm, callback) {
              expect(vm.attr.firstname).to.eql('Jack');
              expect(vm.attr.lastname).to.eql('Joe');
              callback(null);
            }
          };
          vb.useCollection(col);

          var evt = {
            correlationId: 'cmdId',
            id: 'evtId',
            name: 'enteredNewPerson',
            aggregate: {
              id: 'aggId',
              name: 'person'
            },
            context: {
              name: 'hr'
            },
            payload: {
              firstname: 'Jack',
              lastname: 'Joe'
            },
            revision: 1,
            version: 4,
            meta: {
              userId: 'usrId'
            }
          };

          vb.denormalize(evt, function (err, notis) {
            expect(err).not.to.be.ok();
            expect(notis.length).to.eql(1);
            expect(notis[0].payload.firstname).to.eql('Jack');
            expect(notis[0].payload.lastname).to.eql('Joe');
            done();
          });

        });

      });

      describe('not defining a payload', function () {

        it('it should work as expected', function (done) {

          var vb = api.defineViewBuilder({}, function (evt, vm) {
            expect(this.retry).to.be.a('function');
            evt.deep = 'duup';
            vm.set(evt.payload);
          });

          vb.defineEvent({
            correlationId: 'correlationId',
            id: 'id',
            name: 'name',
            aggregateId: 'aggregate.id',
            context: 'context.name',
            aggregate: 'aggregate.name',
            payload: 'payload',
            revision: 'revision',
            version: 'version',
            meta: 'meta'
          });

          vb.defineNotification({
            correlationId: 'correlationId',
            id: 'id',
            action: 'name',
            collection: 'collection',
            payload: 'payload',
            context: 'meta.context.name',
            aggregate: 'meta.aggregate.name',
            aggregateId: 'meta.aggregate.id',
            revision: 'meta.aggregate.revision',
            eventId: 'meta.event.id',
            event: 'meta.event.name',
            meta: 'meta'
          });

          var vm = {
            actionOnCommit: 'update',
            set: function (data) {
              this.attr = data;
            },
            toJSON: function () {
              return this.attr;
            }
          };

          var col = { name: 'dummy',
            getNewId: function (callback) { callback(null, 'newId'); },
            loadViewModel: function (id, callback) {
              vm.id = id;
              callback(null, vm);
            },
            saveViewModel: function (vm, callback) {
              expect(vm.attr.firstname).to.eql('Jack');
              expect(vm.attr.lastname).to.eql('Joe');
              callback(null);
            }
          };
          vb.useCollection(col);

          var evt = {
            correlationId: 'cmdId',
            id: 'evtId',
            name: 'enteredNewPerson',
            aggregate: {
              id: 'aggId',
              name: 'person'
            },
            context: {
              name: 'hr'
            },
            payload: {
              firstname: 'Jack',
              lastname: 'Joe'
            },
            revision: 1,
            version: 4,
            meta: {
              userId: 'usrId'
            }
          };

          vb.denormalize(evt, function (err, notis) {
            expect(err).not.to.be.ok();
            expect(notis.length).to.eql(1);
            expect(notis[0].payload.firstname).to.eql('Jack');
            expect(notis[0].payload.lastname).to.eql('Joe');

            expect(evt.deep).not.to.be.ok();
            done();
          });

        });

      });

      describe('defining a query', function () {

        describe('as json object', function () {

          it('it should work as expected', function (done) {

            var counter = 0;

            var vb = api.defineViewBuilder({ query: { my: 'query' } }, function (evt, vm) {
              vm.set({ index: counter++ });
            });

            vb.defineEvent({
              correlationId: 'correlationId',
              id: 'id',
              name: 'name',
              aggregateId: 'aggregate.id',
              context: 'context.name',
              aggregate: 'aggregate.name',
              payload: 'payload',
              revision: 'revision',
              version: 'version',
              meta: 'meta'
            });

            vb.defineNotification({
              correlationId: 'correlationId',
              id: 'id',
              action: 'name',
              collection: 'collection',
              payload: 'payload',
              context: 'meta.context.name',
              aggregate: 'meta.aggregate.name',
              aggregateId: 'meta.aggregate.id',
              revision: 'meta.aggregate.revision',
              eventId: 'meta.event.id',
              event: 'meta.event.name',
              meta: 'meta'
            });

            var vm1 = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var vm2 = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var col = { name: 'dummy',
              getNewId: function (callback) { callback(null, 'newId'); },
              saveViewModel: function (vm, callback) {
                if (counter === 1) {
                  expect(vm.attr.index).to.eql(0);
                } else {
                  expect(vm.attr.index).to.eql(1);
                }
                callback(null);
              },
              findViewModels: function (query, queryOptions, callback) {
                expect(query.my).to.eql('query');
                callback(null, [vm1, vm2]);
              }
            };
            vb.useCollection(col);

            var evt = {
              correlationId: 'cmdId',
              id: 'evtId',
              name: 'enteredNewPerson',
              aggregate: {
                id: 'aggId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'Jack',
                lastname: 'Joe'
              },
              revision: 1,
              version: 4,
              meta: {
                userId: 'usrId'
              }
            };

            vb.denormalize(evt, function (err, notis) {
              expect(err).not.to.be.ok();
              expect(notis.length).to.eql(2);
              expect(notis[0].payload.index).to.eql(0);
              expect(notis[1].payload.index).to.eql(1);

              expect(evt.deep).not.to.be.ok();
              done();
            });

          });

        });

        describe('as function', function () {

          it('it should work as expected', function (done) {

            var counter = 0;

            var vb = api.defineViewBuilder({  }, function (evt, vm) {
              vm.set({ index: counter++ });
            }).useAsQuery(function (evt) {
              return { my: evt.payload.firstname };
            });

            vb.defineEvent({
              correlationId: 'correlationId',
              id: 'id',
              name: 'name',
              aggregateId: 'aggregate.id',
              context: 'context.name',
              aggregate: 'aggregate.name',
              payload: 'payload',
              revision: 'revision',
              version: 'version',
              meta: 'meta'
            });

            vb.defineNotification({
              correlationId: 'correlationId',
              id: 'id',
              action: 'name',
              collection: 'collection',
              payload: 'payload',
              context: 'meta.context.name',
              aggregate: 'meta.aggregate.name',
              aggregateId: 'meta.aggregate.id',
              revision: 'meta.aggregate.revision',
              eventId: 'meta.event.id',
              event: 'meta.event.name',
              meta: 'meta'
            });

            var vm1 = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var vm2 = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var col = { name: 'dummy',
              getNewId: function (callback) { callback(null, 'newId'); },
              saveViewModel: function (vm, callback) {
                if (counter === 1) {
                  expect(vm.attr.index).to.eql(0);
                } else {
                  expect(vm.attr.index).to.eql(1);
                }
                callback(null);
              },
              findViewModels: function (query, queryOptions, callback) {
                expect(query.my).to.eql('Jack');
                callback(null, [vm1, vm2]);
              }
            };
            vb.useCollection(col);

            var evt = {
              correlationId: 'cmdId',
              id: 'evtId',
              name: 'enteredNewPerson',
              aggregate: {
                id: 'aggId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'Jack',
                lastname: 'Joe'
              },
              revision: 1,
              version: 4,
              meta: {
                userId: 'usrId'
              }
            };

            vb.denormalize(evt, function (err, notis) {
              expect(err).not.to.be.ok();
              expect(notis.length).to.eql(2);
              expect(notis[0].payload.index).to.eql(0);
              expect(notis[1].payload.index).to.eql(1);

              expect(evt.deep).not.to.be.ok();
              done();
            });

          });

        });

        describe('as async function', function () {

          it('it should work as expected', function (done) {

            var counter = 0;

            var vb = api.defineViewBuilder({  }, function (evt, vm) {
              vm.set({ index: counter++ });
            }).useAsQuery(function (evt, callback) {
              callback(null, { my: evt.payload.firstname });
            });

            vb.defineEvent({
              correlationId: 'correlationId',
              id: 'id',
              name: 'name',
              aggregateId: 'aggregate.id',
              context: 'context.name',
              aggregate: 'aggregate.name',
              payload: 'payload',
              revision: 'revision',
              version: 'version',
              meta: 'meta'
            });

            vb.defineNotification({
              correlationId: 'correlationId',
              id: 'id',
              action: 'name',
              collection: 'collection',
              payload: 'payload',
              context: 'meta.context.name',
              aggregate: 'meta.aggregate.name',
              aggregateId: 'meta.aggregate.id',
              revision: 'meta.aggregate.revision',
              eventId: 'meta.event.id',
              event: 'meta.event.name',
              meta: 'meta'
            });

            var vm1 = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var vm2 = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var col = { name: 'dummy',
              getNewId: function (callback) { callback(null, 'newId'); },
              saveViewModel: function (vm, callback) {
                if (counter === 1) {
                  expect(vm.attr.index).to.eql(0);
                } else {
                  expect(vm.attr.index).to.eql(1);
                }
                callback(null);
              },
              findViewModels: function (query, queryOptions, callback) {
                expect(query.my).to.eql('Jack');
                callback(null, [vm1, vm2]);
              }
            };
            vb.useCollection(col);

            var evt = {
              correlationId: 'cmdId',
              id: 'evtId',
              name: 'enteredNewPerson',
              aggregate: {
                id: 'aggId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'Jack',
                lastname: 'Joe'
              },
              revision: 1,
              version: 4,
              meta: {
                userId: 'usrId'
              }
            };

            vb.denormalize(evt, function (err, notis) {
              expect(err).not.to.be.ok();
              expect(notis.length).to.eql(2);
              expect(notis[0].payload.index).to.eql(0);
              expect(notis[1].payload.index).to.eql(1);

              expect(evt.deep).not.to.be.ok();
              done();
            });

          });

        });

      });

      describe('defining a function with a callback', function () {

        it('it should work as expected', function (done) {

          var vb = api.defineViewBuilder({}, function (evt, vm, clb) {
            expect(this.retry).to.be.a('function');
            expect(this.remindMe).to.be.a('function');
            expect(this.getReminder).to.be.a('function');
            var self = this;
            setTimeout(function () {
              expect(self.retry).to.be.a('function');
              expect(self.remindMe).to.be.a('function');
              expect(self.getReminder).to.be.a('function');
              evt.deep = 'duup';
              vm.set(evt.payload);
              clb();
            });
          });

          vb.defineEvent({
            correlationId: 'correlationId',
            id: 'id',
            name: 'name',
            aggregateId: 'aggregate.id',
            context: 'context.name',
            aggregate: 'aggregate.name',
            payload: 'payload',
            revision: 'revision',
            version: 'version',
            meta: 'meta'
          });

          vb.defineNotification({
            correlationId: 'correlationId',
            id: 'id',
            action: 'name',
            collection: 'collection',
            payload: 'payload',
            context: 'meta.context.name',
            aggregate: 'meta.aggregate.name',
            aggregateId: 'meta.aggregate.id',
            revision: 'meta.aggregate.revision',
            eventId: 'meta.event.id',
            event: 'meta.event.name',
            meta: 'meta'
          });

          var vm = {
            actionOnCommit: 'update',
            set: function (data) {
              this.attr = data;
            },
            toJSON: function () {
              return this.attr;
            }
          };

          var col = { name: 'dummy',
            getNewId: function (callback) { callback(null, 'newId'); },
            loadViewModel: function (id, callback) {
              vm.id = id;
              callback(null, vm);
            },
            saveViewModel: function (vm, callback) {
              expect(vm.attr.firstname).to.eql('Jack');
              expect(vm.attr.lastname).to.eql('Joe');
              callback(null);
            }
          };
          vb.useCollection(col);

          var evt = {
            correlationId: 'cmdId',
            id: 'evtId',
            name: 'enteredNewPerson',
            aggregate: {
              id: 'aggId',
              name: 'person'
            },
            context: {
              name: 'hr'
            },
            payload: {
              firstname: 'Jack',
              lastname: 'Joe'
            },
            revision: 1,
            version: 4,
            meta: {
              userId: 'usrId'
            }
          };

          vb.denormalize(evt, function (err, notis) {
            expect(err).not.to.be.ok();
            expect(notis.length).to.eql(1);
            expect(notis[0].payload.firstname).to.eql('Jack');
            expect(notis[0].payload.lastname).to.eql('Joe');

            expect(evt.deep).not.to.be.ok();
            done();
          });

        });

      });

      describe('defining an executeForEach function', function () {

        describe('sync', function () {

          it('it should work as expected', function (done) {

            var counter = 0;

            var vb = api.defineViewBuilder({  }, function (evt, vm) {
              var data = vm.toJSON();
              data.index = counter++;
              vm.set(data);
            }).executeForEach(function (evt) {
              return [{ my: evt.payload.firstname }, { id: '1234', my: evt.payload.firstname + 2 }];
            });

            vb.defineEvent({
              correlationId: 'correlationId',
              id: 'id',
              name: 'name',
              aggregateId: 'aggregate.id',
              context: 'context.name',
              aggregate: 'aggregate.name',
              payload: 'payload',
              revision: 'revision',
              version: 'version',
              meta: 'meta'
            });

            vb.defineNotification({
              correlationId: 'correlationId',
              id: 'id',
              action: 'name',
              collection: 'collection',
              payload: 'payload',
              context: 'meta.context.name',
              aggregate: 'meta.aggregate.name',
              aggregateId: 'meta.aggregate.id',
              revision: 'meta.aggregate.revision',
              eventId: 'meta.event.id',
              event: 'meta.event.name',
              meta: 'meta'
            });

            var vm = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var col = { name: 'dummy',
              getNewId: function (callback) { callback(null, 'newId'); },
              loadViewModel: function (id, callback) {
                vm.id = id;
                callback(null, vm);
              },
              saveViewModel: function (vm, callback) {
                callback(null);
              }
            };
            vb.useCollection(col);

            var evt = {
              correlationId: 'cmdId',
              id: 'evtId',
              name: 'enteredNewPerson',
              aggregate: {
                id: 'aggId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'Jack',
                lastname: 'Joe'
              },
              revision: 1,
              version: 4,
              meta: {
                userId: 'usrId'
              }
            };

            vb.denormalize(evt, function (err, notis) {
              expect(err).not.to.be.ok();
              expect(notis.length).to.eql(2);
              expect(notis[0].payload.my).to.eql('Jack');
              expect(notis[1].payload.my).to.eql('Jack2');
              expect(notis[0].payload.id).to.eql('newId');
              expect(notis[1].payload.id).to.eql('1234');
              expect(notis[0].payload.index).to.eql(0);
              expect(notis[1].payload.index).to.eql(1);

              expect(evt.deep).not.to.be.ok();
              done();
            });

          });

        });

        describe('async', function () {

          var counter = 0;

          it('it should work as expected', function (done) {

            var vb = api.defineViewBuilder({  }, function (evt, vm) {
              var data = vm.toJSON();
              data.index = counter++;
              vm.set(data);
            }).executeForEach(function (evt, callback) {
              callback(null, [{ my: evt.payload.firstname }, { id: '1234', my: evt.payload.firstname + 2 }]);
            });

            vb.defineEvent({
              correlationId: 'correlationId',
              id: 'id',
              name: 'name',
              aggregateId: 'aggregate.id',
              context: 'context.name',
              aggregate: 'aggregate.name',
              payload: 'payload',
              revision: 'revision',
              version: 'version',
              meta: 'meta'
            });

            vb.defineNotification({
              correlationId: 'correlationId',
              id: 'id',
              action: 'name',
              collection: 'collection',
              payload: 'payload',
              context: 'meta.context.name',
              aggregate: 'meta.aggregate.name',
              aggregateId: 'meta.aggregate.id',
              revision: 'meta.aggregate.revision',
              eventId: 'meta.event.id',
              event: 'meta.event.name',
              meta: 'meta'
            });

            var vm = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var col = { name: 'dummy',
              getNewId: function (callback) { callback(null, 'newId'); },
              loadViewModel: function (id, callback) {
                vm.id = id;
                callback(null, vm);
              },
              saveViewModel: function (vm, callback) {
                callback(null);
              }
            };
            vb.useCollection(col);

            var evt = {
              correlationId: 'cmdId',
              id: 'evtId',
              name: 'enteredNewPerson',
              aggregate: {
                id: 'aggId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'Jack',
                lastname: 'Joe'
              },
              revision: 1,
              version: 4,
              meta: {
                userId: 'usrId'
              }
            };

            vb.denormalize(evt, function (err, notis) {
              expect(err).not.to.be.ok();
              expect(notis.length).to.eql(2);
              expect(notis.length).to.eql(2);
              expect(notis[0].payload.my).to.eql('Jack');
              expect(notis[1].payload.my).to.eql('Jack2');
              expect(notis[0].payload.id).to.eql('newId');
              expect(notis[1].payload.id).to.eql('1234');
              expect(notis[0].payload.index).to.eql(0);
              expect(notis[1].payload.index).to.eql(1);

              expect(evt.deep).not.to.be.ok();
              done();
            });

          });

        });

      });

      describe('calling retry during denormalization', function () {

        describe('defining a function without a callback', function () {

          it('it should work as expected', function (done) {

            var runs = 0;
            var vb = api.defineViewBuilder({}, function (evt, vm) {
              runs++;
              expect(this.retry).to.be.a('function');
              if (runs <= 3) {
                return this.retry(1);
              }

              evt.deep = 'duup';
              vm.set(evt.payload);
            });

            vb.defineEvent({
              correlationId: 'correlationId',
              id: 'id',
              name: 'name',
              aggregateId: 'aggregate.id',
              context: 'context.name',
              aggregate: 'aggregate.name',
              payload: 'payload',
              revision: 'revision',
              version: 'version',
              meta: 'meta'
            });

            vb.defineNotification({
              correlationId: 'correlationId',
              id: 'id',
              action: 'name',
              collection: 'collection',
              payload: 'payload',
              context: 'meta.context.name',
              aggregate: 'meta.aggregate.name',
              aggregateId: 'meta.aggregate.id',
              revision: 'meta.aggregate.revision',
              eventId: 'meta.event.id',
              event: 'meta.event.name',
              meta: 'meta'
            });

            var vm = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var col = { name: 'dummy',
              getNewId: function (callback) { callback(null, 'newId'); },
              loadViewModel: function (id, callback) {
                vm.id = id;
                callback(null, vm);
              },
              saveViewModel: function (vm, callback) {
                expect(vm.attr.firstname).to.eql('Jack');
                expect(vm.attr.lastname).to.eql('Joe');
                callback(null);
              }
            };
            vb.useCollection(col);

            var evt = {
              correlationId: 'cmdId',
              id: 'evtId',
              name: 'enteredNewPerson',
              aggregate: {
                id: 'aggId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'Jack',
                lastname: 'Joe'
              },
              revision: 1,
              version: 4,
              meta: {
                userId: 'usrId'
              }
            };

            vb.denormalize(evt, function (err, notis) {
              expect(err).not.to.be.ok();
              expect(notis.length).to.eql(1);
              expect(notis[0].payload.firstname).to.eql('Jack');
              expect(notis[0].payload.lastname).to.eql('Joe');

              expect(evt.deep).not.to.be.ok();

              expect(runs).to.eql(4);
              done();
            });

          });

        });

        describe('defining a function with a callback', function () {

          it('it should work as expected', function (done) {

            var runs = 0;
            var vb = api.defineViewBuilder({}, function (evt, vm, clb) {
              expect(this.retry).to.be.a('function');
              var self = this;
              setTimeout(function () {
                runs++;
                expect(self.retry).to.be.a('function');
                if (runs <= 3) {
                  return self.retry(1, clb);
                }

                evt.deep = 'duup';
                vm.set(evt.payload);
                clb();
              });
            });

            vb.defineEvent({
              correlationId: 'correlationId',
              id: 'id',
              name: 'name',
              aggregateId: 'aggregate.id',
              context: 'context.name',
              aggregate: 'aggregate.name',
              payload: 'payload',
              revision: 'revision',
              version: 'version',
              meta: 'meta'
            });

            vb.defineNotification({
              correlationId: 'correlationId',
              id: 'id',
              action: 'name',
              collection: 'collection',
              payload: 'payload',
              context: 'meta.context.name',
              aggregate: 'meta.aggregate.name',
              aggregateId: 'meta.aggregate.id',
              revision: 'meta.aggregate.revision',
              eventId: 'meta.event.id',
              event: 'meta.event.name',
              meta: 'meta'
            });

            var vm = {
              actionOnCommit: 'update',
              set: function (data) {
                this.attr = data;
              },
              toJSON: function () {
                return this.attr;
              }
            };

            var col = { name: 'dummy',
              getNewId: function (callback) { callback(null, 'newId'); },
              loadViewModel: function (id, callback) {
                vm.id = id;
                callback(null, vm);
              },
              saveViewModel: function (vm, callback) {
                expect(vm.attr.firstname).to.eql('Jack');
                expect(vm.attr.lastname).to.eql('Joe');
                callback(null);
              }
            };
            vb.useCollection(col);

            var evt = {
              correlationId: 'cmdId',
              id: 'evtId',
              name: 'enteredNewPerson',
              aggregate: {
                id: 'aggId',
                name: 'person'
              },
              context: {
                name: 'hr'
              },
              payload: {
                firstname: 'Jack',
                lastname: 'Joe'
              },
              revision: 1,
              version: 4,
              meta: {
                userId: 'usrId'
              }
            };

            vb.denormalize(evt, function (err, notis) {
              expect(err).not.to.be.ok();
              expect(notis.length).to.eql(1);
              expect(notis[0].payload.firstname).to.eql('Jack');
              expect(notis[0].payload.lastname).to.eql('Joe');

              expect(evt.deep).not.to.be.ok();

              expect(runs).to.eql(4);
              done();
            });

          });

        });

      });

    });

  });

});
