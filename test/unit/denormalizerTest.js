var expect = require('expect.js'),
  api = require('../../index'),
  _ = require('lodash');

describe('denormalizer', function () {

  it('it should be a function', function () {

    expect(api).to.be.a('function');

  });

  it('it should have the correct api', function () {

    expect(api.defineViewBuilder).to.be.a('function');
    expect(api.defineEventExtender).to.be.a('function');
    expect(api.defineCollection).to.be.a('function');

  });

  describe('calling that function', function () {

    describe('without options', function () {

      it('it should throw an error', function () {

        expect(api).to.throwError('/denormalizerPath/');

      });

    });

    describe('with all mandatory options', function () {

      it('it should return as expected', function () {

        var denorm = api({ denormalizerPath: __dirname });
        expect(denorm).to.be.a('object');
        expect(denorm.on).to.be.a('function');
        expect(denorm.revisionGuardStore).to.be.an('object');
        expect(denorm.revisionGuardStore.on).to.be.a('function');
        expect(denorm.repository).to.be.an('object');
        expect(denorm.repository.on).to.be.a('function');
        expect(denorm.defineNotification).to.be.a('function');
        expect(denorm.defineEvent).to.be.a('function');
        expect(denorm.idGenerator).to.be.a('function');
        expect(denorm.onEvent).to.be.a('function');
        expect(denorm.onNotification).to.be.a('function');
        expect(denorm.onEventMissing).to.be.a('function');
        expect(denorm.defaultEventExtension).to.be.a('function');
        expect(denorm.init).to.be.a('function');
        expect(denorm.handle).to.be.a('function');
        expect(denorm.getLastEvent).to.be.a('function');

        expect(denorm.options.retryOnConcurrencyTimeout).to.eql(800);
        expect(denorm.options.commandRejectedEventName).to.eql('commandRejected');
        expect(denorm.options.revisionGuard.queueTimeout).to.eql(1000);
        expect(denorm.options.revisionGuard.queueTimeoutMaxLoops).to.eql(3);

      });

    });

    describe('defining an id generator function', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
        denorm.getNewId = null;
      });

      describe('in a synchronous way', function () {

        it('it should be transformed internally to an asynchronous way', function (done) {

          denorm.idGenerator(function () {
            var id = require('node-uuid').v4().toString();
            return id;
          });

          denorm.getNewId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

      describe('in an synchronous way', function () {

        it('it should be taken as it is', function (done) {

          denorm.idGenerator(function (callback) {
            setTimeout(function () {
              var id = require('node-uuid').v4().toString();
              callback(null, id);
            }, 10);
          });

          denorm.getNewId(function (err, id) {
            expect(id).to.be.a('string');
            done();
          });

        });

      });

    });

    describe('defining the event structure', function() {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
      });

      describe('using the defaults', function () {

        it('it should apply the defaults', function() {

          var defaults = _.cloneDeep(denorm.definitions.event);

          denorm.defineEvent({
            payload: 'data',
            aggregate: 'aggName',
            context: 'ctx.Name',
            revision: 'rev',
            version: 'v.',
            meta: 'pass'
          });

          expect(defaults.correlationId).to.eql(denorm.definitions.event.correlationId);
          expect(defaults.id).to.eql(denorm.definitions.event.id);
          expect(denorm.definitions.event.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(denorm.definitions.event.payload);
          expect(defaults.name).to.eql(denorm.definitions.event.name);
          expect(defaults.aggregateId).to.eql(denorm.definitions.event.aggregateId);
          expect(denorm.definitions.event.aggregate).to.eql('aggName');
          expect(defaults.aggregate).not.to.eql(denorm.definitions.event.aggregate);
          expect(denorm.definitions.event.context).to.eql('ctx.Name');
          expect(defaults.context).not.to.eql(denorm.definitions.event.context);
          expect(denorm.definitions.event.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(denorm.definitions.event.revision);
          expect(denorm.definitions.event.version).to.eql('v.');
          expect(defaults.version).not.to.eql(denorm.definitions.event.version);
          expect(denorm.definitions.event.meta).to.eql('pass');
          expect(defaults.meta).not.to.eql(denorm.definitions.event.meta);

        });

      });

      describe('overwriting the defaults', function () {

        it('it should apply them correctly', function() {

          var defaults = _.cloneDeep(denorm.definitions.event);

          denorm.defineEvent({
            correlationId: 'cmdId',
            id: 'eventId',
            payload: 'data',
            name: 'defName',
            aggregateId: 'path.to.aggId',
            aggregate: 'aggName',
            context: 'ctx.Name',
            revision: 'rev',
            version: 'v.',
            meta: 'pass'
          });


          expect(denorm.definitions.event.correlationId).to.eql('cmdId');
          expect(defaults.correlationId).not.to.eql(denorm.definitions.event.correlationId);
          expect(denorm.definitions.event.id).to.eql('eventId');
          expect(defaults.id).not.to.eql(denorm.definitions.event.id);
          expect(denorm.definitions.event.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(denorm.definitions.event.payload);
          expect(denorm.definitions.event.name).to.eql('defName');
          expect(defaults.name).not.to.eql(denorm.definitions.event.name);
          expect(denorm.definitions.event.aggregateId).to.eql('path.to.aggId');
          expect(defaults.aggregateId).not.to.eql(denorm.definitions.event.aggregateId);
          expect(denorm.definitions.event.aggregate).to.eql('aggName');
          expect(defaults.aggregate).not.to.eql(denorm.definitions.event.aggregate);
          expect(denorm.definitions.event.context).to.eql('ctx.Name');
          expect(defaults.context).not.to.eql(denorm.definitions.event.context);
          expect(denorm.definitions.event.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(denorm.definitions.event.revision);
          expect(denorm.definitions.event.version).to.eql('v.');
          expect(defaults.version).not.to.eql(denorm.definitions.event.version);
          expect(denorm.definitions.event.meta).to.eql('pass');
          expect(defaults.meta).not.to.eql(denorm.definitions.event.meta);

        });

      });

    });

    describe('defining the notification structure', function() {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
      });

      describe('using the defaults', function () {

        it('it should apply the defaults', function() {

          var defaults = _.cloneDeep(denorm.definitions.notification);

          denorm.defineNotification({
            collection: 'col',
            payload: 'data',
            context: 'meta.context.name',
            aggregate: 'meta.aggregate.name'
          });

          expect(defaults.correlationId).to.eql(denorm.definitions.notification.correlationId);
          expect(defaults.id).to.eql(denorm.definitions.notification.id);
          expect(denorm.definitions.notification.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(denorm.definitions.notification.payload);
          expect(denorm.definitions.notification.collection).to.eql('col');
          expect(defaults.collection).not.to.eql(denorm.definitions.notification.collection);
          expect(denorm.definitions.notification.context).to.eql('meta.context.name');
          expect(defaults.context).not.to.eql(denorm.definitions.notification.context);
          expect(denorm.definitions.notification.aggregate).to.eql('meta.aggregate.name');
          expect(defaults.aggregate).not.to.eql(denorm.definitions.notification.aggregate);
          expect(defaults.action).to.eql(denorm.definitions.notification.action);
          expect(defaults.meta).to.eql(denorm.definitions.notification.meta);

        });

      });

      describe('overwriting the defaults', function () {

        it('it should apply them correctly', function() {

          var defaults = _.cloneDeep(denorm.definitions.notification);

          denorm.defineNotification({
            correlationId: 'corrId',
            id: 'notId',
            action: 'n',
            collection: 'c',
            payload: 'p',
            context: 'ctx',
            aggregate: 'agg',
            aggregateId: 'aggId',
            revision: 'rev',
            eventId: 'evtId',
            event: 'evtName',
            meta: 'm'
          });

          expect(denorm.definitions.notification.correlationId).to.eql('corrId');
          expect(defaults.correlationId).not.to.eql(denorm.definitions.notification.correlationId);
          expect(denorm.definitions.notification.id).to.eql('notId');
          expect(defaults.id).not.to.eql(denorm.definitions.notification.id);
          expect(denorm.definitions.notification.action).to.eql('n');
          expect(defaults.action).not.to.eql(denorm.definitions.notification.action);
          expect(denorm.definitions.notification.collection).to.eql('c');
          expect(defaults.collection).not.to.eql(denorm.definitions.notification.collection);
          expect(denorm.definitions.notification.payload).to.eql('p');
          expect(defaults.payload).not.to.eql(denorm.definitions.notification.payload);
          expect(denorm.definitions.notification.context).to.eql('ctx');
          expect(defaults.context).not.to.eql(denorm.definitions.notification.context);
          expect(denorm.definitions.notification.aggregate).to.eql('agg');
          expect(defaults.aggregate).not.to.eql(denorm.definitions.notification.aggregate);
          expect(denorm.definitions.notification.aggregateId).to.eql('aggId');
          expect(defaults.aggregateId).not.to.eql(denorm.definitions.notification.aggregateId);
          expect(denorm.definitions.notification.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(denorm.definitions.notification.revision);
          expect(denorm.definitions.notification.eventId).to.eql('evtId');
          expect(defaults.eventId).not.to.eql(denorm.definitions.notification.eventId);
          expect(denorm.definitions.notification.event).to.eql('evtName');
          expect(defaults.event).not.to.eql(denorm.definitions.notification.event);
          expect(denorm.definitions.notification.meta).to.eql('m');
          expect(defaults.meta).not.to.eql(denorm.definitions.notification.meta);

        });

      });

    });

    describe('defining onEvent handler', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
        denorm.onEventHandle = null;
      });

      describe('in a synchronous way', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          var called = false;
          denorm.onEvent(function (evt) {
            expect(evt.my).to.eql('evt');
            called = true;
          });

          denorm.onEventHandle({ my: 'evt' }, function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

      describe('in an synchronous way', function() {

        it('it should be taken as it is', function(done) {

          var called = false;
          denorm.onEvent(function (evt, callback) {
            setTimeout(function () {
              expect(evt.my).to.eql('evt');
              called = true;
              callback(null);
            }, 10);
          });

          denorm.onEventHandle({ my: 'evt' }, function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

    });

    describe('defining onNotification handler', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
        denorm.onNotificationHandle = null;
      });

      describe('in a synchronous way', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          var called = false;
          denorm.onNotification(function (noti) {
            expect(noti.my).to.eql('n');
            called = true;
          });

          denorm.onNotificationHandle({ my: 'n' }, function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

      describe('in an synchronous way', function() {

        it('it should be taken as it is', function(done) {

          var called = false;
          denorm.onNotification(function (noti, callback) {
            setTimeout(function () {
              expect(noti.my).to.eql('n');
              called = true;
              callback(null);
            }, 10);
          });

          denorm.onNotificationHandle({ my: 'n' }, function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

    });

    describe('defining onEventMissing handler', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
        denorm.onEventMissingHandle = null;
      });

      it('it should work as expected', function() {

        var called = false;
        denorm.onEventMissing(function (info, evt) {
          expect(info.in).to.eql('fo');
          expect(evt.my).to.eql('evt');
          called = true;
        });

        denorm.onEventMissingHandle({ in: 'fo' }, { my: 'evt' });
        expect(called).to.eql(true);

      });

    });

    describe('defining defaultEventExtension handler', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
        denorm.extendEventHandle = null;
      });

      describe('in a synchronous way', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          var called = false;
          denorm.defaultEventExtension(function (evt) {
            expect(evt.my).to.eql('evt');
            called = true;
          });

          denorm.extendEventHandle({ my: 'evt' }, function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

      describe('in an synchronous way', function() {

        it('it should be taken as it is', function(done) {

          var called = false;
          denorm.defaultEventExtension(function (evt, callback) {
            setTimeout(function () {
              expect(evt.my).to.eql('evt');
              called = true;
              callback(null);
            }, 10);
          });

          denorm.extendEventHandle({ my: 'evt' }, function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(true);
            done();
          });

        });

      });

    });

    describe('initializing', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
        denorm.defineNotification({
          correlationId: 'corrId',
          id: 'notId',
          action: 'n',
          collection: 'c',
          payload: 'p',
          context: 'ctx',
          aggregate: 'agg',
          aggregateId: 'aggId',
          revision: 'rev',
          eventId: 'evtId',
          event: 'evtName',
          meta: 'm'
        });
        denorm.defineEvent({
          correlationId: 'corr',
          id: 'i',
          name: 'n',
          aggregateId: 'ai',
          context: 'c',
          aggregate: 'a',
          payload: 'p',
          revision: 'r',
          version: 'v',
          meta: 'm'
        });
      });

      describe('with a callback', function () {

        it('it should work as expected', function (done) {

          var called = 0;
          denorm.revisionGuardStore.once('connect', function () {
            called++;
          });
          denorm.repository.once('connect', function () {
            called++;
          });
          denorm.once('connect', function () {
            called++;
          });

          denorm.init(function (err) {
            expect(err).not.to.be.ok();
            expect(called).to.eql(3);
            done();
          });

        });

      });

      describe('without a callback', function () {

        it('it should work as expected', function (done) {

          var called = 0;

          function check () {
            called++;
            if (called >= 3) {
              done();
            }
          }

          denorm.revisionGuardStore.once('connect', function () {
            check();
          });
          denorm.repository.once('connect', function () {
            check();
          });
          denorm.once('connect', function () {
            check();
          });

          denorm.init();

        });

      });

    });
    
    describe('calling extendEvent', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
      });
      
      describe('having found only the default event extender', function () {

        it('it should work as expected', function (done) {

          denorm.defaultEventExtension(function (evt) {
            evt.ext++;
            return evt;
          });

          denorm.eventDispatcher = {
            getTargetInformation: function (e) {
              expect(e.ext).to.eql(1);
              return 'target';
            }
          };

          denorm.tree = {
            getEventExtender: function (t) {
              expect(t).to.eql('target');

              return null;
            }
          };

          denorm.extendEvent({ ext: 0 }, function (err, extEvt) {
            expect(err).not.to.be.ok();
            expect(extEvt.ext).to.eql(1);
            done();
          });

        });
        
      });

      describe('having found the default event extender and an other one', function () {

        it('it should work as expected', function (done) {

          denorm.defaultEventExtension(function (evt) {
            evt.ext++;
            return evt;
          });

          denorm.eventDispatcher = {
            getTargetInformation: function (e) {
              expect(e.ext).to.eql(1);
              return 'target';
            }
          };

          denorm.tree = {
            getEventExtender: function (t) {
              expect(t).to.eql('target');

              return {
                extend: function (e, clb) {
                  expect(e.ext).to.eql(1);
                  e.ext++;
                  clb(null, e);
                }
              };
            }
          };

          denorm.extendEvent({ ext: 0 }, function (err, extEvt) {
            expect(err).not.to.be.ok();
            expect(extEvt.ext).to.eql(2);
            done();
          });

        });

      });
      
    });
    
    describe('calling isCommandRejected', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname, commandRejectedEventName: 'reji' });
      });
      
      describe('with a normal event', function () {
        
        it('it should work as expected', function (done) {
          
          var calledClb = false;
          var res = denorm.isCommandRejected({ name: 'normal' }, function (err, evt, notifications) {
            calledClb = true;
          });
          
          expect(res).to.eql(false);
          
          setTimeout(function () {
            expect(calledClb).to.eql(false);
            done();
          }, 40);
          
        });
        
      });

      describe('with a command rejected event', function () {

        describe('not having defined a revision', function () {

          it('it should work as expected', function (done) {

            denorm.defineEvent({
              aggregate: 'aggregate.name',
              context: 'context.name'
            });

            var calledMissing = false;
            
            denorm.onEventMissing(function (info, evt) {
              expect(info.aggregateId).to.eql('aggId');
              expect(info.aggregateRevision).to.eql(5);
              expect(info.aggregate).to.eql('agg');
              expect(info.context).to.eql('ctx');
              expect(info.guardRevision).not.to.be.ok();
              expect(evt.name).to.eql('reji');
              calledMissing = true;
            });

            var res = denorm.isCommandRejected({
              name: 'reji',
              payload: {
                reason: {
                  name: 'AggregateDestroyedError',
                  aggregateId: 'aggId',
                  aggregateRevision: 5
                }
              },
              aggregate: {
                name: 'agg'
              },
              context: {
                name: 'ctx'
              }
            }, function (err, evt, notifications) {
              expect(err).not.to.be.ok();
              expect(evt.name).to.eql('reji');
              expect(notifications).to.be.an('array');
              expect(notifications.length).to.eql(0);
              expect(calledMissing).to.eql(true);
              
              done();
            });

            expect(res).to.eql(true);

          });
          
        });

        describe('having defined a revision', function () {

          describe('and the revisionGuardStore has missed some event', function () {

            it('it should work as expected', function (done) {

              denorm.defineEvent({
                aggregate: 'aggregate.name',
                context: 'context.name',
                revision: 'aggregate.revision'
              });

              var calledMissing = false;

              denorm.onEventMissing(function (info, evt) {
                expect(info.aggregateId).to.eql('aggId');
                expect(info.aggregateRevision).to.eql(5);
                expect(info.aggregate).to.eql('agg');
                expect(info.context).to.eql('ctx');
                expect(info.guardRevision).to.eql(4);
                expect(evt.name).to.eql('reji');
                calledMissing = true;
              });

              var calledStore = false;

              denorm.revisionGuardStore = {
                get: function (aggId, clb) {
                  expect(aggId).to.eql('aggId');
                  calledStore = true;

                  clb(null, 4)
                }
              };

              var res = denorm.isCommandRejected({
                name: 'reji',
                payload: {
                  reason: {
                    name: 'AggregateDestroyedError',
                    aggregateId: 'aggId',
                    aggregateRevision: 5
                  }
                },
                aggregate: {
                  name: 'agg',
                  revision: 2
                },
                context: {
                  name: 'ctx'
                }
              }, function (err, evt, notifications) {
                expect(err).not.to.be.ok();
                expect(evt.name).to.eql('reji');
                expect(notifications).to.be.an('array');
                expect(notifications.length).to.eql(0);
                expect(calledMissing).to.eql(true);
                expect(calledStore).to.eql(true);

                done();
              });

              expect(res).to.eql(true);

            });
            
          });

          describe('and the revisionGuardStore has not missed anything', function () {

            it('it should work as expected', function (done) {

              denorm.defineEvent({
                aggregate: 'aggregate.name',
                context: 'context.name',
                revision: 'aggregate.revision'
              });

              var calledMissing = false;

              denorm.onEventMissing(function (info, evt) {
                calledMissing = true;
              });

              var calledStore = false;

              denorm.revisionGuardStore = {
                get: function (aggId, clb) {
                  expect(aggId).to.eql('aggId');
                  calledStore = true;

                  clb(null, 6)
                }
              };

              var res = denorm.isCommandRejected({
                name: 'reji',
                payload: {
                  reason: {
                    name: 'AggregateDestroyedError',
                    aggregateId: 'aggId',
                    aggregateRevision: 5
                  }
                },
                aggregate: {
                  name: 'agg',
                  revision: 2
                },
                context: {
                  name: 'ctx'
                }
              }, function (err, evt, notifications) {
                expect(err).not.to.be.ok();
                expect(evt.name).to.eql('reji');
                expect(notifications).to.be.an('array');
                expect(notifications.length).to.eql(0);
                expect(calledMissing).to.eql(false);
                expect(calledStore).to.eql(true);

                done();
              });

              expect(res).to.eql(true);

            });

          });

        });

      });
      
    });

    describe('calling dispatch', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
      });

      it('it should work as expected', function (done) {

        var calledDispatch = false;
        denorm.eventDispatcher = {
          dispatch: function (evt, clb) {
            expect(evt.my).to.eql('evt');
            calledDispatch = true;
            clb(null, [{ noti: '1'}, { noti: '2'}]);
          }
        };

        var calledExtend = false;
        denorm.extendEvent = function (evt, clb) {
          evt.ext++;
          calledExtend = true;
          clb(null, evt);
        };
        
        var notiCalled = [];
        denorm.onNotification(function (noti) {
          notiCalled.push(noti);
        });

        var evtCalled = [];
        denorm.onEvent(function (evt) {
          evtCalled.push(evt);
        });

        denorm.dispatch({ my: 'evt', ext: 0 }, function (err, extEvt, notis) {
          expect(err).not.to.be.ok();
          expect(extEvt.ext).to.eql(1);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(2);
          expect(notis[0].noti).to.eql(1);
          expect(notis[1].noti).to.eql(2);
          
          expect(notiCalled.length).to.eql(2);
          expect(notiCalled[0].noti).to.eql(1);
          expect(notiCalled[1].noti).to.eql(2);
          expect(evtCalled.length).to.eql(1);
          expect(evtCalled[0].ext).to.eql(1);
          
          expect(calledDispatch).to.eql(true);
          expect(calledExtend).to.eql(true);
          done();
        });

      });

    });
    
    describe('calling handle', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
      });
      
      describe('not working with revisions', function () {

        it('it should work as expected', function (done) {

          denorm.defineEvent({
            name: 'my'
          });

          var cmdRejCalled = false;
          denorm.isCommandRejected = function (evt, clb) {
            expect(evt.my).to.eql('evt');
            cmdRejCalled = true;
            return false;
          };

          var dispCalled = false;
          denorm.dispatch = function (evt, clb) {
            expect(evt.my).to.eql('evt');
            dispCalled = true;
            clb(null, evt, [{ noti: 1 }]);
          };
          
          var guardCalled = false;
          var guardDoneCalled = false;
          denorm.revisionGuard = {
            guard: function (evt, clb) {
              guardCalled = true;
              clb(null, function (c) {
                guardDoneCalled = true;
                c(null);
              });
            }
          };

          denorm.handle({ my: 'evt' }, function (err, extEvt, notis) {
            expect(err).not.be.ok();
            expect(extEvt.my).to.eql('evt');
            expect(notis).to.be.an('array');
            expect(notis.length).to.eql(1);
            expect(notis[0].noti).to.eql(1);

            expect(cmdRejCalled).to.eql(true);
            expect(dispCalled).to.eql(true);
            expect(guardCalled).to.eql(false);
            expect(guardDoneCalled).to.eql(false);

            done();
          });

        });
        
      });

      describe('working with revisions', function () {

        it('it should work as expected', function (done) {

          denorm.defineEvent({
            name: 'my',
            aggregate: 'aggregate.name',
            aggregateId: 'aggregate.id',
            revision: 'aggregate.revision'
          });

          var cmdRejCalled = false;
          denorm.isCommandRejected = function (evt, clb) {
            expect(evt.my).to.eql('evt');
            cmdRejCalled = true;
            return false;
          };

          var dispCalled = false;
          denorm.dispatch = function (evt, clb) {
            expect(evt.my).to.eql('evt');
            dispCalled = true;
            clb(null, evt, [{ noti: 1 }]);
          };

          var guardCalled = false;
          var guardDoneCalled = false;
          denorm.revisionGuard = {
            guard: function (evt, clb) {
              expect(evt.my).to.eql('evt');
              guardCalled = true;
              clb(null, function (c) {
                guardDoneCalled = true;
                c(null);
              });
            }
          };

          denorm.handle({ my: 'evt', aggregate: { id: 'aggId', name: 'agg', revision: 4 } }, function (err, extEvt, notis) {
            expect(err).not.be.ok();
            expect(extEvt.my).to.eql('evt');
            expect(notis).to.be.an('array');
            expect(notis.length).to.eql(1);
            expect(notis[0].noti).to.eql(1);

            expect(cmdRejCalled).to.eql(true);
            expect(dispCalled).to.eql(true);
            expect(guardCalled).to.eql(true);
            expect(guardDoneCalled).to.eql(true);

            done();
          });

        });

      });
      
    });

    describe('calling replay', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
      });

      it('it should work as expected', function (done) {
        
        var events = [{ evt: 1 }, { evt: 2 }];
        var callback = function () {
          console.log('haha');
        };

        denorm.replayHandler = {
          replay: function (evts, clb) {
            expect(evts).to.eql(events);
            expect(clb).to.eql(callback);
            done();
          }
        };

        denorm.replay(events, callback);
        
      });

    });

    describe('calling replayStreamed', function () {

      var denorm;

      beforeEach(function () {
        denorm = api({ denormalizerPath: __dirname });
      });

      it('it should work as expected', function (done) {

        var replFn = function () {
          console.log('haha');
        };

        denorm.replayHandler = {
          replayStreamed: function (fn) {
            expect(fn).to.eql(replFn);
            done();
          }
        };

        denorm.replayStreamed(replFn);

      });

    });
    
  });

});
