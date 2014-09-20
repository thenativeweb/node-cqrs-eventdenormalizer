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
            eventName: 'evtName',
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
          expect(denorm.definitions.notification.eventName).to.eql('evtName');
          expect(defaults.eventName).not.to.eql(denorm.definitions.notification.eventName);
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
        denorm.extendEvent = null;
      });

      describe('in a synchronous way', function() {

        it('it should be transformed internally to an asynchronous way', function(done) {

          var called = false;
          denorm.defaultEventExtension(function (evt) {
            expect(evt.my).to.eql('evt');
            called = true;
          });

          denorm.extendEvent({ my: 'evt' }, function (err) {
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

          denorm.extendEvent({ my: 'evt' }, function (err) {
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
          eventName: 'evtName',
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
    
  });

});
