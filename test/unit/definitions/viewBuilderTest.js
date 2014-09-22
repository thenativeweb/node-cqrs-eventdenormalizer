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
          expect(vb.denormFn).to.eql(denormFn);
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
          expect(vb.replay).to.be.a('function');
          expect(vb.replayStreamed).to.be.a('function');

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
          expect(vb.loadViewModel).to.be.a('function');
          expect(vb.saveViewModel).to.be.a('function');
          expect(vb.extractId).to.be.a('function');
          expect(vb.generateNotification).to.be.a('function');
          expect(vb.denormalize).to.be.a('function');
          expect(vb.replay).to.be.a('function');
          expect(vb.replayStreamed).to.be.a('function');

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
            var id = require('node-uuid').v4().toString();
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
              var id = require('node-uuid').v4().toString();
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

      describe('in normal mode', function () {

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

      describe('in replay mode', function () {

        describe('not having a cached vm', function () {

          it('it should work as expected', function (done) {

            var col = { name: 'dummy', loadViewModel: function (id, callback) {
              callback(null, { id: id, cached: false });
            }};
            vb.useCollection(col);
            vb.isReplaying = true;
//            vb.replayingVms['423'] = { id: '423', cached: true };
            vb.loadViewModel('423', function (err, vm) {
              expect(err).not.to.be.ok();
              expect(vm.id).to.eql('423');
              expect(vm.cached).to.eql(false);
              done();
            });

          });

        });

        describe('having a cached vm', function () {

          it('it should work as expected', function (done) {

            var col = { name: 'dummy', loadViewModel: function (id, callback) {
              callback(null, { id: id, cached: false });
            }};
            vb.useCollection(col);
            vb.isReplaying = true;
            vb.replayingVms['423'] = { id: '423', cached: true };
            vb.loadViewModel('423', function (err, vm) {
              expect(err).not.to.be.ok();
              expect(vm.id).to.eql('423');
              expect(vm.cached).to.eql(true);
              done();
            });

          });
          
        });

      });

    });

    describe('calling saveViewModel', function () {

      var vb;

      beforeEach(function () {
        vb = api.defineViewBuilder(null, 'update');
      });

      describe('in normal mode', function () {

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

      describe('in replay mode', function () {

        describe('not having a cached vm', function () {

          it('it should work as expected', function (done) {

            var called = false;
            var col = { name: 'dummy', saveViewModel: function (vm, callback) {
              expect(vm.id).to.eql('423');
              called = true;
              callback(null);
            }};
            vb.useCollection(col);
            vb.isReplaying = true;
            vb.saveViewModel({ id: '423' }, function (err) {
              expect(err).not.to.be.ok();
              expect(called).to.eql(false);
              expect(vb.replayingVms['423'].id).to.eql('423');
              done();
            });

          });

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

          vb.denormalize(evt, function (err, noti) {
            expect(err).not.to.be.ok();
            expect(noti.payload.firstname).to.eql('Jack');
            expect(noti.payload.lastname).to.eql('Joe');
            done();
          });
          
        });
        
      });

      describe('not defining a payload', function () {

        it('it should work as expected', function (done) {

          var vb = api.defineViewBuilder({}, function (evt, vm) {
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

          vb.denormalize(evt, function (err, noti) {
            expect(err).not.to.be.ok();
            expect(noti.payload.firstname).to.eql('Jack');
            expect(noti.payload.lastname).to.eql('Joe');
            done();
          });

        });

      });
      
    });
    
    describe('replaying', function () {

      it('it should work as expected', function (done) {

        var vb = api.defineViewBuilder({}, function (evt, vm) {
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
        
        var loadCalled = 0;
        var saveCalled = 0;

        var col = { name: 'dummy',
          getNewId: function (callback) { callback(null, 'newId'); },
          loadViewModel: function (id, callback) {
            expect(vb.isReplaying).to.eql(true);
            loadCalled++;
            vm.id = id;
            callback(null, vm);
          },
          saveViewModel: function (vm, callback) {
            expect(vb.isReplaying).to.eql(true);
            saveCalled++;
            expect(vm.attr.firstname).to.eql('Jack');
            expect(vm.attr.lastname).to.eql('Joey');
            expect(vm.attr.title).to.eql('Dr.');
            callback(null);
          }
        };
        vb.useCollection(col);

        var evt1 = {
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

        var evt2 = {
          correlationId: 'cmdId2',
          id: 'evtId2',
          name: 'updatedPerson',
          aggregate: {
            id: 'aggId',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            firstname: 'Jack',
            lastname: 'Joey',
            title: 'Dr.'
          },
          revision: 2,
          version: 4,
          meta: {
            userId: 'usrId'
          }
        };
        
        expect(vb.isReplaying).to.eql(false);

        vb.replay([evt1, evt2], function (err) {
          expect(err).not.to.be.ok();

          expect(vb.isReplaying).to.eql(false);
          
          expect(vm.attr.firstname).to.eql('Jack');
          expect(vm.attr.lastname).to.eql('Joey');
          expect(vm.attr.title).to.eql('Dr.');
          expect(loadCalled).to.eql(1);
          expect(saveCalled).to.eql(1);
          done();
        });

      });
      
    });

    describe('replaying streamed', function () {

      it('it should work as expected', function (done) {

        var vb = api.defineViewBuilder({}, function (evt, vm) {
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

        var loadCalled = 0;
        var saveCalled = 0;

        var col = { name: 'dummy',
          getNewId: function (callback) { callback(null, 'newId'); },
          loadViewModel: function (id, callback) {
            expect(vb.isReplaying).to.eql(true);
            loadCalled++;
            vm.id = id;
            callback(null, vm);
          },
          saveViewModel: function (vm, callback) {
            expect(vb.isReplaying).to.eql(true);
            saveCalled++;
            expect(vm.attr.firstname).to.eql('Jack');
            expect(vm.attr.lastname).to.eql('Joey');
            expect(vm.attr.title).to.eql('Dr.');
            callback(null);
          }
        };
        vb.useCollection(col);

        var evt1 = {
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

        var evt2 = {
          correlationId: 'cmdId2',
          id: 'evtId2',
          name: 'updatedPerson',
          aggregate: {
            id: 'aggId',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            firstname: 'Jack',
            lastname: 'Joey',
            title: 'Dr.'
          },
          revision: 2,
          version: 4,
          meta: {
            userId: 'usrId'
          }
        };

        expect(vb.isReplaying).to.eql(false);
        
        vb.replayStreamed(function (replay, rDone) {
          replay(evt1);
          replay(evt2);
          rDone(function (err) {
            expect(err).not.to.be.ok();

            expect(vb.isReplaying).to.eql(false);

            expect(vm.attr.firstname).to.eql('Jack');
            expect(vm.attr.lastname).to.eql('Joey');
            expect(vm.attr.title).to.eql('Dr.');
            expect(loadCalled).to.eql(1);
            expect(saveCalled).to.eql(1);
            done();
          });
        });

      });

    });
  
  });

});
