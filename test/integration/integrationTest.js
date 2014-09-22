var expect = require('expect.js'),
  api = require('../../index');

describe('integration', function () {

  describe('format 1', function () {

    var denorm;

    before(function (done) {
      denorm = api({ denormalizerPath: __dirname + '/fixture/set1', commandRejectedEventName: 'rejectedCommand', revisionGuard: { queueTimeout: 200, queueTimeoutMaxLoops: 2 } });
      denorm.defineEvent({
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

      denorm.defineNotification({
        id: 'id',
        action: 'name',
        collection: 'collection',
        payload: 'payload',
        context: 'meta.context.name',
        aggregate: 'meta.aggregate.name',
        aggregateId: 'meta.aggregate.id',
        revision: 'meta.aggregate.revision',
        eventId: 'meta.event.id',
        eventName: 'meta.event.name',
        meta: 'meta'
      });
      
      denorm.defaultEventExtension(function (evt) {
        evt.defForAllExt = true;
        return evt;
      });

      denorm.init(done);
    });

    describe('handling an event that will not be handled by any viewBuilder or any specific eventExtender', function () {

      it('it should not publish any notification and it should callback without an error but with same event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          correlationId: 'cmdId',
          id: 'evtId',
          name: 'evtName',
          aggregate: {
            id: 'aggregateId',
            name: 'aggregate'
          },
          context: {
            name: 'context'
          },
          payload: 'payload',
          revision: 1,
          version: 0,
          meta: {
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (err, e, notis) {
          expect(err).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).not.to.be.ok();
          expect(e.extendedDefault).to.eql(true);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(0);
          
          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).not.to.be.ok();
          expect(publishedEvents[0].extendedDefault).to.eql(true);
          expect(publishedNotis.length).to.eql(0);

          done();
        });

      });

    });

    describe('handling an event that will be handled by 2 viewBuilders and a specific eventExtender', function () {

      it('it should publish 2 notifications and it should callback without an error but with an extended event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          correlationId: 'cmdId',
          name: 'enteredNewPerson',
          aggregate: {
            id: '1234',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            firstname: 'Jack',
            lastname: 'Joe',
            email: 'a@b.c'
          },
          revision: 1,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).to.eql(true);
          expect(e.extendedDefault).not.to.be.ok();
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(2);
          
          var personIndex = 0;
          var personDetailIndex = 1;
          if (notis[0].collection !== 'person') {
            personIndex = 1;
            personDetailIndex = 0;
          }
          
          expect(notis[personIndex].name).to.eql('create');
          expect(notis[personIndex].collection).to.eql('person');
          expect(notis[personIndex].payload.id).to.eql('1234');
          expect(notis[personIndex].payload.firstname).to.eql('Jack');
          expect(notis[personIndex].payload.lastname).to.eql('Joe');
          expect(notis[personIndex].payload.email).not.to.be.ok();
          expect(notis[personIndex].id).to.be.a('string');
          expect(notis[personIndex].correlationId).to.eql('cmdId');
          expect(notis[personIndex].meta.event.id).to.eql('evtId');
          expect(notis[personIndex].meta.event.name).to.eql('enteredNewPerson');
          expect(notis[personIndex].meta.userId).to.eql('userId');
          expect(notis[personIndex].meta.aggregate.id).to.eql('1234');
          expect(notis[personIndex].meta.aggregate.name).to.eql('person');
          expect(notis[personIndex].meta.aggregate.revision).to.eql(1);
          expect(notis[personIndex].meta.context.name).to.eql('hr');
          expect(notis[personDetailIndex].name).to.eql('create');
          expect(notis[personDetailIndex].collection).to.eql('personDetail');
          expect(notis[personDetailIndex].payload.id).to.eql('1234');
          expect(notis[personDetailIndex].payload.firstname).to.eql('Jack');
          expect(notis[personDetailIndex].payload.lastname).to.eql('Joe');
          expect(notis[personDetailIndex].payload.email).to.eql('a@b.c');
          expect(notis[personDetailIndex].id).to.be.a('string');
          expect(notis[personDetailIndex].correlationId).to.eql('cmdId');
          expect(notis[personDetailIndex].meta.event.id).to.eql('evtId');
          expect(notis[personDetailIndex].meta.event.name).to.eql('enteredNewPerson');
          expect(notis[personDetailIndex].meta.userId).to.eql('userId');
          expect(notis[personDetailIndex].meta.aggregate.id).to.eql('1234');
          expect(notis[personDetailIndex].meta.aggregate.name).to.eql('person');
          expect(notis[personDetailIndex].meta.aggregate.revision).to.eql(1);
          expect(notis[personDetailIndex].meta.context.name).to.eql('hr');

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).to.eql(true);
          expect(publishedEvents[0].extendedDefault).not.to.be.ok();
          expect(publishedNotis.length).to.eql(2);
          expect(publishedNotis[personIndex].name).to.eql('create');
          expect(publishedNotis[personIndex].collection).to.eql('person');
          expect(publishedNotis[personIndex].payload.id).to.eql('1234');
          expect(publishedNotis[personIndex].payload.firstname).to.eql('Jack');
          expect(publishedNotis[personIndex].payload.lastname).to.eql('Joe');
          expect(publishedNotis[personIndex].payload.email).not.to.be.ok();
          expect(publishedNotis[personIndex].id).to.be.a('string');
          expect(publishedNotis[personIndex].correlationId).to.eql('cmdId');
          expect(publishedNotis[personIndex].meta.event.id).to.eql('evtId');
          expect(publishedNotis[personIndex].meta.event.name).to.eql('enteredNewPerson');
          expect(publishedNotis[personIndex].meta.userId).to.eql('userId');
          expect(publishedNotis[personIndex].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[personIndex].meta.aggregate.name).to.eql('person');
          expect(publishedNotis[personIndex].meta.aggregate.revision).to.eql(1);
          expect(publishedNotis[personIndex].meta.context.name).to.eql('hr');
          expect(publishedNotis[personDetailIndex].name).to.eql('create');
          expect(publishedNotis[personDetailIndex].collection).to.eql('personDetail');
          expect(publishedNotis[personDetailIndex].payload.id).to.eql('1234');
          expect(publishedNotis[personDetailIndex].payload.firstname).to.eql('Jack');
          expect(publishedNotis[personDetailIndex].payload.lastname).to.eql('Joe');
          expect(publishedNotis[personDetailIndex].payload.email).to.eql('a@b.c');
          expect(publishedNotis[personDetailIndex].id).to.be.a('string');
          expect(publishedNotis[personDetailIndex].correlationId).to.eql('cmdId');
          expect(publishedNotis[personDetailIndex].meta.event.id).to.eql('evtId');
          expect(publishedNotis[personDetailIndex].meta.event.name).to.eql('enteredNewPerson');
          expect(publishedNotis[personDetailIndex].meta.userId).to.eql('userId');
          expect(publishedNotis[personDetailIndex].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[personDetailIndex].meta.aggregate.name).to.eql('person');
          expect(publishedNotis[personDetailIndex].meta.aggregate.revision).to.eql(1);
          expect(publishedNotis[personDetailIndex].meta.context.name).to.eql('hr');

          done();
        });

      });

    });

    describe('handling an event that will be handled by 1 viewBuilder and a generic eventExtender', function () {

      it('it should publish 1 notification and it should callback without an error but with an extended event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          correlationId: 'cmdId',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '1234',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'xyz@r.f'
          },
          revision: 2,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).not.to.be.ok();
          expect(e.extendedDefault).to.eql(true);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(1);
          expect(notis[0].name).to.eql('update');
          expect(notis[0].collection).to.eql('personDetail');
          expect(notis[0].payload.id).to.eql('1234');
          expect(notis[0].payload.firstname).to.eql('Jack');
          expect(notis[0].payload.lastname).to.eql('Joe');
          expect(notis[0].payload.email).to.eql('xyz@r.f');
          expect(notis[0].id).to.be.a('string');
          expect(notis[0].correlationId).to.eql('cmdId');
          expect(notis[0].meta.event.id).to.eql('evtId');
          expect(notis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[0].meta.userId).to.eql('userId');
          expect(notis[0].meta.aggregate.id).to.eql('1234');
          expect(notis[0].meta.aggregate.name).to.eql('person');
          expect(notis[0].meta.aggregate.revision).to.eql(2);
          expect(notis[0].meta.context.name).to.eql('hr');

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).not.to.be.ok();
          expect(publishedEvents[0].extendedDefault).to.eql(true);
          expect(publishedNotis.length).to.eql(1);
          expect(publishedNotis[0].name).to.eql('update');
          expect(publishedNotis[0].collection).to.eql('personDetail');
          expect(publishedNotis[0].payload.id).to.eql('1234');
          expect(publishedNotis[0].payload.firstname).to.eql('Jack');
          expect(publishedNotis[0].payload.lastname).to.eql('Joe');
          expect(publishedNotis[0].payload.email).to.eql('xyz@r.f');
          expect(publishedNotis[0].id).to.be.a('string');
          expect(publishedNotis[0].correlationId).to.eql('cmdId');
          expect(publishedNotis[0].meta.event.id).to.eql('evtId');
          expect(publishedNotis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[0].meta.userId).to.eql('userId');
          expect(publishedNotis[0].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[0].meta.aggregate.name).to.eql('person');
          expect(publishedNotis[0].meta.aggregate.revision).to.eql(2);
          expect(publishedNotis[0].meta.context.name).to.eql('hr');

          done();
        });

      });

    });

    describe('handling an event that will be handled by 1 viewBuilder and a generic eventExtender', function () {

      it('it should publish 1 notification and it should callback without an error but with an extended event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          correlationId: 'cmdId',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '1234'//,
//            name: 'person'
          },
          context: {
//            name: 'hr'
          },
          payload: {
            email: 'abc@d.e'
          },
          revision: 3,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).not.to.be.ok();
          expect(e.extendedDefault).to.eql(true);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(1);
          expect(notis[0].name).to.eql('update');
          expect(notis[0].collection).to.eql('personDetail');
          expect(notis[0].payload.id).to.eql('1234');
          expect(notis[0].payload.firstname).to.eql('Jack');
          expect(notis[0].payload.lastname).to.eql('Joe');
          expect(notis[0].payload.email).to.eql('abc@d.e');
          expect(notis[0].id).to.be.a('string');
          expect(notis[0].correlationId).to.eql('cmdId');
          expect(notis[0].meta.event.id).to.eql('evtId');
          expect(notis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[0].meta.userId).to.eql('userId');
          expect(notis[0].meta.aggregate.id).to.eql('1234');
          expect(notis[0].meta.aggregate.name).not.to.be.ok();
          expect(notis[0].meta.aggregate.revision).to.eql(3);
          expect(notis[0].meta.context.name).not.to.be.ok();

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).not.to.be.ok();
          expect(publishedEvents[0].extendedDefault).to.eql(true);
          expect(publishedNotis.length).to.eql(1);
          expect(publishedNotis[0].name).to.eql('update');
          expect(publishedNotis[0].collection).to.eql('personDetail');
          expect(publishedNotis[0].payload.id).to.eql('1234');
          expect(publishedNotis[0].payload.firstname).to.eql('Jack');
          expect(publishedNotis[0].payload.lastname).to.eql('Joe');
          expect(publishedNotis[0].payload.email).to.eql('abc@d.e');
          expect(publishedNotis[0].id).to.be.a('string');
          expect(publishedNotis[0].correlationId).to.eql('cmdId');
          expect(publishedNotis[0].meta.event.id).to.eql('evtId');
          expect(publishedNotis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[0].meta.userId).to.eql('userId');
          expect(publishedNotis[0].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[0].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[0].meta.aggregate.revision).to.eql(3);
          expect(publishedNotis[0].meta.context.name).not.to.be.ok();

          done();
        });

      });

    });

    describe('handling an event that was already handled', function () {

      it('it should not publish anything and callback with an error', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          correlationId: 'cmdId',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '1234',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'abc@d.e'
          },
          revision: 3,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).to.be.ok();
          expect(errs.length).to.eql(1);
          expect(errs[0].name).to.eql('AlreadyDenormalizedError');
          expect(e).not.to.be.ok();
          expect(notis).not.to.be.ok();

          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);

          done();
        });

      });

    });

    describe('handling an event that has a bigger revision than expected', function () {

      it('it should not fire an eventMissing event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          correlationId: 'cmdId',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '1234',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'abc@d.e'
          },
          revision: 7,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        denorm.onEventMissing(function (info, e) {
          expect(info.aggregate).to.eql('person');
          expect(info.aggregateId).to.eql('1234');
          expect(info.context).to.eql('hr');
          expect(info.aggregateRevision).to.eql(7);
          expect(info.guardRevision).to.eql(4);
          expect(e).to.eql(evt);
          
          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);
          
          done();
        });

        denorm.handle(evt, function (errs, e, notis) {});

      });

    });

    describe('handling an command rejected event', function () {

      it('it should work as expected', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          correlationId: 'cmdId',
          name: 'rejectedCommand',
          aggregate: {
            id: '1234',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            reason: {
              name: 'AggregateDestroyedError',
              aggregateId: '1234',
              aggregateRevision: 6
            }
          },
          revision: 6,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };
        
        var eventMissingCalled = false;
        denorm.onEventMissing(function (info, e) {
          expect(info.aggregate).to.eql('person');
          expect(info.aggregateId).to.eql('1234');
          expect(info.context).to.eql('hr');
          expect(info.aggregateRevision).to.eql(6);
          expect(info.guardRevision).to.eql(4);
          expect(e).to.eql(evt);
          eventMissingCalled = true;
        });

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(notis.length).to.eql(0);
          
          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);
          
          expect(eventMissingCalled).to.eql(true);

          done();
        });

      });

    });
    
  });

  describe('format 2', function () {

    var denorm;

    before(function (done) {
      denorm = api({ denormalizerPath: __dirname + '/fixture/set2', commandRejectedEventName: 'commandRejected', revisionGuard: { queueTimeout: 200, queueTimeoutMaxLoops: 2 } });
      denorm.defineEvent({
        correlationId: 'commandId',
        id: 'id',
        name: 'event',
        aggregateId: 'payload.id',
        payload: 'payload',
        revision: 'head.revision',
        version: 'head.version',
        meta: 'head'
      });

      denorm.defineNotification({
        id: 'id',
        action: 'name',
        collection: 'collection',
        payload: 'payload',
        aggregateId: 'meta.aggregate.id',
        revision: 'meta.aggregate.revision',
        eventId: 'meta.event.id',
        eventName: 'meta.event.name',
        meta: 'meta'
      });

      denorm.defaultEventExtension(function (evt) {
        evt.defForAllExt = true;
        return evt;
      });

      denorm.init(done);
    });

    describe('handling an event that will not be handled by any viewBuilder or any specific eventExtender', function () {

      it('it should not publish any notification and it should callback without an error but with same event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          commandId: 'cmdId',
          event: 'evtName',
          payload: {
            id: 'aggregateId2',
            data: 'payload'
          },
          head: {
            revision: 1,
            version: 0,
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (err, e, notis) {
          expect(err).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).not.to.be.ok();
          expect(e.extendedDefault).to.eql(true);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(0);

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).not.to.be.ok();
          expect(publishedEvents[0].extendedDefault).to.eql(true);
          expect(publishedNotis.length).to.eql(0);

          done();
        });

      });

    });

    describe('handling an event that will be handled by 2 viewBuilders and a specific eventExtender', function () {

      it('it should publish 2 notifications and it should callback without an error but with an extended event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          commandId: 'cmdId',
          event: 'enteredNewPerson',
          payload: {
            id: '12342',
            firstname: 'Jack',
            lastname: 'Joe',
            email: 'a@b.c'
          },
          head: {
            revision: 1,
            version: 2,
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).to.eql(true);
          expect(e.extendedDefault).not.to.be.ok();
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(2);

          var personIndex = 0;
          var personDetailIndex = 1;
          if (notis[0].collection !== 'person') {
            personIndex = 1;
            personDetailIndex = 0;
          }

          expect(notis[personIndex].name).to.eql('create');
          expect(notis[personIndex].collection).to.eql('person');
          expect(notis[personIndex].payload.id).to.eql('12342');
          expect(notis[personIndex].payload.firstname).to.eql('Jack');
          expect(notis[personIndex].payload.lastname).to.eql('Joe');
          expect(notis[personIndex].payload.email).not.to.be.ok();
          expect(notis[personIndex].id).to.be.a('string');
          expect(notis[personIndex].correlationId).to.eql('cmdId');
          expect(notis[personIndex].meta.event.id).to.eql('evtId');
          expect(notis[personIndex].meta.event.name).to.eql('enteredNewPerson');
          expect(notis[personIndex].meta.userId).to.eql('userId');
          expect(notis[personIndex].meta.aggregate.id).to.eql('12342');
          expect(notis[personIndex].meta.aggregate.name).not.to.be.ok();
          expect(notis[personIndex].meta.aggregate.revision).to.eql(1);
          expect(notis[personIndex].meta.context).not.to.be.ok();
          expect(notis[personDetailIndex].name).to.eql('create');
          expect(notis[personDetailIndex].collection).to.eql('personDetail');
          expect(notis[personDetailIndex].payload.id).to.eql('12342');
          expect(notis[personDetailIndex].payload.firstname).to.eql('Jack');
          expect(notis[personDetailIndex].payload.lastname).to.eql('Joe');
          expect(notis[personDetailIndex].payload.email).to.eql('a@b.c');
          expect(notis[personDetailIndex].id).to.be.a('string');
          expect(notis[personDetailIndex].correlationId).to.eql('cmdId');
          expect(notis[personDetailIndex].meta.event.id).to.eql('evtId');
          expect(notis[personDetailIndex].meta.event.name).to.eql('enteredNewPerson');
          expect(notis[personDetailIndex].meta.userId).to.eql('userId');
          expect(notis[personDetailIndex].meta.aggregate.id).to.eql('12342');
          expect(notis[personDetailIndex].meta.aggregate.name).not.to.be.ok();
          expect(notis[personDetailIndex].meta.aggregate.revision).to.eql(1);
          expect(notis[personDetailIndex].meta.context).not.to.be.ok();

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).to.eql(true);
          expect(publishedEvents[0].extendedDefault).not.to.be.ok();
          expect(publishedNotis.length).to.eql(2);
          expect(publishedNotis[personIndex].name).to.eql('create');
          expect(publishedNotis[personIndex].collection).to.eql('person');
          expect(publishedNotis[personIndex].payload.id).to.eql('12342');
          expect(publishedNotis[personIndex].payload.firstname).to.eql('Jack');
          expect(publishedNotis[personIndex].payload.lastname).to.eql('Joe');
          expect(publishedNotis[personIndex].payload.email).not.to.be.ok();
          expect(publishedNotis[personIndex].id).to.be.a('string');
          expect(publishedNotis[personIndex].correlationId).to.eql('cmdId');
          expect(publishedNotis[personIndex].meta.event.id).to.eql('evtId');
          expect(publishedNotis[personIndex].meta.event.name).to.eql('enteredNewPerson');
          expect(publishedNotis[personIndex].meta.userId).to.eql('userId');
          expect(publishedNotis[personIndex].meta.aggregate.id).to.eql('12342');
          expect(publishedNotis[personIndex].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[personIndex].meta.aggregate.revision).to.eql(1);
          expect(publishedNotis[personIndex].meta.context).not.to.be.ok();
          expect(publishedNotis[personDetailIndex].name).to.eql('create');
          expect(publishedNotis[personDetailIndex].collection).to.eql('personDetail');
          expect(publishedNotis[personDetailIndex].payload.id).to.eql('12342');
          expect(publishedNotis[personDetailIndex].payload.firstname).to.eql('Jack');
          expect(publishedNotis[personDetailIndex].payload.lastname).to.eql('Joe');
          expect(publishedNotis[personDetailIndex].payload.email).to.eql('a@b.c');
          expect(publishedNotis[personDetailIndex].id).to.be.a('string');
          expect(publishedNotis[personDetailIndex].correlationId).to.eql('cmdId');
          expect(publishedNotis[personDetailIndex].meta.event.id).to.eql('evtId');
          expect(publishedNotis[personDetailIndex].meta.event.name).to.eql('enteredNewPerson');
          expect(publishedNotis[personDetailIndex].meta.userId).to.eql('userId');
          expect(publishedNotis[personDetailIndex].meta.aggregate.id).to.eql('12342');
          expect(publishedNotis[personDetailIndex].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[personDetailIndex].meta.aggregate.revision).to.eql(1);
          expect(publishedNotis[personDetailIndex].meta.context).not.to.be.ok();

          done();
        });

      });

    });

    describe('handling an event that will be handled by 1 viewBuilder and a generic eventExtender', function () {

      it('it should publish 1 notification and it should callback without an error but with an extended event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          commandId: 'cmdId',
          event: 'registeredEMailAddress',
          payload: {
            id: '12342',
            email: 'xyz@r.f'
          },
          head: {
            revision: 2,
            version: 2,
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).not.to.be.ok();
          expect(e.extendedDefault).to.eql(true);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(1);
          expect(notis[0].name).to.eql('update');
          expect(notis[0].collection).to.eql('personDetail');
          expect(notis[0].payload.id).to.eql('12342');
          expect(notis[0].payload.firstname).to.eql('Jack');
          expect(notis[0].payload.lastname).to.eql('Joe');
          expect(notis[0].payload.email).to.eql('xyz@r.f');
          expect(notis[0].id).to.be.a('string');
          expect(notis[0].correlationId).to.eql('cmdId');
          expect(notis[0].meta.event.id).to.eql('evtId');
          expect(notis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[0].meta.userId).to.eql('userId');
          expect(notis[0].meta.aggregate.id).to.eql('12342');
          expect(notis[0].meta.aggregate.name).not.to.be.ok();
          expect(notis[0].meta.aggregate.revision).to.eql(2);
          expect(notis[0].meta.context).not.to.be.ok();

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).not.to.be.ok();
          expect(publishedEvents[0].extendedDefault).to.eql(true);
          expect(publishedNotis.length).to.eql(1);
          expect(publishedNotis[0].name).to.eql('update');
          expect(publishedNotis[0].collection).to.eql('personDetail');
          expect(publishedNotis[0].payload.id).to.eql('12342');
          expect(publishedNotis[0].payload.firstname).to.eql('Jack');
          expect(publishedNotis[0].payload.lastname).to.eql('Joe');
          expect(publishedNotis[0].payload.email).to.eql('xyz@r.f');
          expect(publishedNotis[0].id).to.be.a('string');
          expect(publishedNotis[0].correlationId).to.eql('cmdId');
          expect(publishedNotis[0].meta.event.id).to.eql('evtId');
          expect(publishedNotis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[0].meta.userId).to.eql('userId');
          expect(publishedNotis[0].meta.aggregate.id).to.eql('12342');
          expect(publishedNotis[0].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[0].meta.aggregate.revision).to.eql(2);
          expect(publishedNotis[0].meta.context).not.to.be.ok();

          done();
        });

      });

    });

    describe('handling an event that will be handled by 1 viewBuilder and a generic eventExtender', function () {

      it('it should publish 1 notification and it should callback without an error but with an extended event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          commandId: 'cmdId',
          event: 'registeredEMailAddress',
          payload: {
            id: '12342',
            email: 'abc@d.e'
          },
          head: {
            revision: 3,
            version: 2,
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).not.to.be.ok();
          expect(e.extendedDefault).to.eql(true);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(1);
          expect(notis[0].name).to.eql('update');
          expect(notis[0].collection).to.eql('personDetail');
          expect(notis[0].payload.id).to.eql('12342');
          expect(notis[0].payload.firstname).to.eql('Jack');
          expect(notis[0].payload.lastname).to.eql('Joe');
          expect(notis[0].payload.email).to.eql('abc@d.e');
          expect(notis[0].id).to.be.a('string');
          expect(notis[0].correlationId).to.eql('cmdId');
          expect(notis[0].meta.event.id).to.eql('evtId');
          expect(notis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[0].meta.userId).to.eql('userId');
          expect(notis[0].meta.aggregate.id).to.eql('12342');
          expect(notis[0].meta.aggregate.name).not.to.be.ok();
          expect(notis[0].meta.aggregate.revision).to.eql(3);
          expect(notis[0].meta.context).not.to.be.ok();

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).not.to.be.ok();
          expect(publishedEvents[0].extendedDefault).to.eql(true);
          expect(publishedNotis.length).to.eql(1);
          expect(publishedNotis[0].name).to.eql('update');
          expect(publishedNotis[0].collection).to.eql('personDetail');
          expect(publishedNotis[0].payload.id).to.eql('12342');
          expect(publishedNotis[0].payload.firstname).to.eql('Jack');
          expect(publishedNotis[0].payload.lastname).to.eql('Joe');
          expect(publishedNotis[0].payload.email).to.eql('abc@d.e');
          expect(publishedNotis[0].id).to.be.a('string');
          expect(publishedNotis[0].correlationId).to.eql('cmdId');
          expect(publishedNotis[0].meta.event.id).to.eql('evtId');
          expect(publishedNotis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[0].meta.userId).to.eql('userId');
          expect(publishedNotis[0].meta.aggregate.id).to.eql('12342');
          expect(publishedNotis[0].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[0].meta.aggregate.revision).to.eql(3);
          expect(publishedNotis[0].meta.context).not.to.be.ok();

          done();
        });

      });

    });

    describe('handling an event that was already handled', function () {

      it('it should not publish anything and callback with an error', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          commandId: 'cmdId',
          event: 'registeredEMailAddress',
          payload: {
            id: '12342',
            email: 'abc@d.e'
          },
          head: {
            revision: 3,
            version: 2,
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).to.be.ok();
          expect(errs.length).to.eql(1);
          expect(errs[0].name).to.eql('AlreadyDenormalizedError');
          expect(e).not.to.be.ok();
          expect(notis).not.to.be.ok();

          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);

          done();
        });

      });

    });

    describe('handling an event that has a bigger revision than expected', function () {

      it('it should not fire an eventMissing event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          commandId: 'cmdId',
          event: 'registeredEMailAddress',
          payload: {
            id: '12342',
            email: 'abc@d.e'
          },
          head: {
            revision: 7,
            version: 2,
            userId: 'userId'
          }
        };

        denorm.onEventMissing(function (info, e) {
          expect(info.aggregate).not.to.be.ok();
          expect(info.aggregateId).to.eql('12342');
          expect(info.context).not.to.be.ok();
          expect(info.aggregateRevision).to.eql(7);
          expect(info.guardRevision).to.eql(4);
          expect(e).to.eql(evt);

          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);

          done();
        });

        denorm.handle(evt, function (errs, e, notis) {});

      });

    });

    describe('handling an command rejected event', function () {

      it('it should work as expected', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtId',
          commandId: 'cmdId',
          event: 'commandRejected',
          payload: {
            id: '12342',
            reason: {
              name: 'AggregateDestroyedError',
              aggregateId: '12342',
              aggregateRevision: 6
            }
          },
          head: {
            revision: 6,
            version: 2,
            userId: 'userId'
          }
        };

        var eventMissingCalled = false;
        denorm.onEventMissing(function (info, e) {
          expect(info.aggregate).not.to.be.ok();
          expect(info.aggregateId).to.eql('12342');
          expect(info.context).not.to.be.ok();
          expect(info.aggregateRevision).to.eql(6);
          expect(info.guardRevision).to.eql(4);
          expect(e).to.eql(evt);
          eventMissingCalled = true;
        });

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(notis.length).to.eql(0);

          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);

          expect(eventMissingCalled).to.eql(true);

          done();
        });

      });

    });

  });

});
