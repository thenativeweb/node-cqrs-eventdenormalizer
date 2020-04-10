var expect = require('expect.js'),
  _ = require('lodash'),
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
        event: 'meta.event.name',
        meta: 'meta'
      });

      denorm.defaultEventExtension(function (evt) {
        evt.defForAllExt = true;
        return evt;
      });

      expect(function () {
        denorm.getInfo();
      }).to.throwError('/init');

      denorm.init(function (err, warns) {
        expect(warns).not.to.be.ok();
        done(err);
      });
    });

    describe('requesting information', function () {

      it('it should return the expected information', function () {

        function expectInNamedArray(col, name, test) {
          var obj = _.find(col, function(v) { return v.name === name; });
          expect(obj).to.be.an('object');
          test(obj);
        }

        var info = denorm.getInfo();
        expect(info.collections.length).to.eql(2);

        var found = _.find(info.collections, function (col) {
          return col.name === 'person';
        });

        var viewBuilders = found.viewBuilders;

        expect(found.name).to.eql('person');
        expect(viewBuilders.length).to.eql(3);

        expectInNamedArray(viewBuilders, 'enteredNewPerson', function(vb) {
          expect(vb.name).to.eql('enteredNewPerson');
          expect(vb.aggregate).to.eql('person');
          expect(vb.context).to.eql('hr');
          expect(vb.version).to.eql(2);
        });

        expectInNamedArray(viewBuilders, 'personLeaved', function(vb) {
          expect(vb.aggregate).to.eql('person');
          expect(vb.context).to.eql('hr');
          expect(vb.version).to.eql(0);
        });

        expectInNamedArray(viewBuilders, 'registeredEMailAddress', function(vb) {
          expect(vb.aggregate).to.eql('person');
          expect(vb.context).to.eql('hr');
          expect(vb.version).to.eql(2);
        });

        expect(found.eventExtenders.length).to.eql(1);
        expect(found.eventExtenders[0].name).to.eql('enteredNewPerson');
        expect(found.eventExtenders[0].aggregate).to.eql('person');
        expect(found.eventExtenders[0].context).to.eql('hr');
        expect(found.eventExtenders[0].version).to.eql(2);
        expect(found.preEventExtenders.length).to.eql(1);
        expect(found.preEventExtenders[0].name).to.eql('enteredNewPerson');
        expect(found.preEventExtenders[0].aggregate).to.eql('person');
        expect(found.preEventExtenders[0].context).to.eql('hr');
        expect(found.preEventExtenders[0].version).to.eql(2);

        var found = _.find(info.collections, function (col) {
          return col.name === 'personDetail';
        });
        expect(found.name).to.eql('personDetail');
        expect(found.viewBuilders.length).to.eql(4);
        expect(found.viewBuilders[1].name).to.eql('enteredNewPerson');
        expect(found.viewBuilders[1].aggregate).to.eql('person');
        expect(found.viewBuilders[1].context).to.eql('hr');
        expect(found.viewBuilders[1].version).to.eql(2);
        expect(found.viewBuilders[3].name).to.eql('registeredEMailAddress');
        expect(found.viewBuilders[3].aggregate).to.eql('person');
        expect(found.viewBuilders[3].context).to.eql('hr');
        expect(found.viewBuilders[3].version).to.eql(2);
        expect(found.eventExtenders.length).to.eql(0);
        expect(found.preEventExtenders.length).to.eql(0);

        expect(info.generalEventExtenders.length).to.eql(1);
        expect(info.generalEventExtenders[0].name).to.eql('');
        expect(info.generalEventExtenders[0].aggregate).to.eql(null);
        expect(info.generalEventExtenders[0].context).to.eql(null);
        expect(info.generalEventExtenders[0].version).to.eql(-1);

        expect(info.generalPreEventExtenders.length).to.eql(0);

      });

    });

    describe('handling an event that is not a json object', function () {

      it('it should not publish any notification and it should callback with an error and without event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        denorm.handle('crappy', function (errs, e, notis) {
          expect(errs).to.be.ok();
          expect(errs.length).to.eql(1);
          expect(errs[0].message).to.match(/valid/i);
          expect(e).not.to.be.ok();
          expect(notis).not.to.be.ok();

          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);

          done();
        });

      });

    });

    describe('handling an event that has no name', function () {

      it('it should not publish any notification and it should callback with an error and without event', function (done) {

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
//          name: 'evtName',
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

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).to.be.ok();
          expect(errs.length).to.eql(1);
          expect(errs[0].message).to.match(/valid/i);
          expect(e).not.to.be.ok();
          expect(notis).not.to.be.ok();

          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);

          done();
        });

      });

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
          for (var m in evt) {
            expect(e[m]).to.eql(evt[m]);
          }
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
          for (var m in evt) {
            expect(publishedEvents[0][m]).to.eql(evt[m]);
          }
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

    describe('handling an event that will be handled by 2 viewBuilder and a generic eventExtender', function () {

      it('it should publish 2 notification and it should callback without an error but with an extended event', function (done) {

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
          expect(notis.length).to.eql(2);
          expect(notis[0].name).to.eql('update');
          expect(notis[0].collection).to.eql('person');
          expect(notis[0].payload.id).to.eql('1234');
          expect(notis[0].payload.firstname).to.eql('Jack');
          expect(notis[0].payload.lastname).to.eql('Joe');
          expect(notis[0].payload.email).not.to.be.ok();
          expect(notis[0].payload.generalEmail).to.eql('xyz@r.f');
          expect(notis[0].id).to.be.a('string');
          expect(notis[0].correlationId).to.eql('cmdId');
          expect(notis[0].meta.event.id).to.eql('evtId');
          expect(notis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[0].meta.userId).to.eql('userId');
          expect(notis[0].meta.aggregate.id).to.eql('1234');
          expect(notis[0].meta.aggregate.name).to.eql('person');
          expect(notis[0].meta.aggregate.revision).to.eql(2);
          expect(notis[0].meta.context.name).to.eql('hr');
          expect(notis[1].name).to.eql('update');
          expect(notis[1].collection).to.eql('personDetail');
          expect(notis[1].payload.id).to.eql('1234');
          expect(notis[1].payload.firstname).to.eql('Jack');
          expect(notis[1].payload.lastname).to.eql('Joe');
          expect(notis[1].payload.email).to.eql('xyz@r.f');
          expect(notis[1].id).to.be.a('string');
          expect(notis[1].correlationId).to.eql('cmdId');
          expect(notis[1].meta.event.id).to.eql('evtId');
          expect(notis[1].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[1].meta.userId).to.eql('userId');
          expect(notis[1].meta.aggregate.id).to.eql('1234');
          expect(notis[1].meta.aggregate.name).to.eql('person');
          expect(notis[1].meta.aggregate.revision).to.eql(2);
          expect(notis[1].meta.context.name).to.eql('hr');

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).not.to.be.ok();
          expect(publishedEvents[0].extendedDefault).to.eql(true);
          expect(publishedNotis.length).to.eql(2);
          expect(publishedNotis[0].name).to.eql('update');
          expect(publishedNotis[0].collection).to.eql('person');
          expect(publishedNotis[0].payload.id).to.eql('1234');
          expect(publishedNotis[0].payload.firstname).to.eql('Jack');
          expect(publishedNotis[0].payload.lastname).to.eql('Joe');
          expect(publishedNotis[0].payload.email).not.to.be.ok();
          expect(publishedNotis[0].payload.generalEmail).to.eql('xyz@r.f');
          expect(publishedNotis[0].id).to.be.a('string');
          expect(publishedNotis[0].correlationId).to.eql('cmdId');
          expect(publishedNotis[0].meta.event.id).to.eql('evtId');
          expect(publishedNotis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[0].meta.userId).to.eql('userId');
          expect(publishedNotis[0].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[0].meta.aggregate.name).to.eql('person');
          expect(publishedNotis[0].meta.aggregate.revision).to.eql(2);
          expect(publishedNotis[0].meta.context.name).to.eql('hr');
          expect(publishedNotis[1].name).to.eql('update');
          expect(publishedNotis[1].collection).to.eql('personDetail');
          expect(publishedNotis[1].payload.id).to.eql('1234');
          expect(publishedNotis[1].payload.firstname).to.eql('Jack');
          expect(publishedNotis[1].payload.lastname).to.eql('Joe');
          expect(publishedNotis[1].payload.email).to.eql('xyz@r.f');
          expect(publishedNotis[1].id).to.be.a('string');
          expect(publishedNotis[1].correlationId).to.eql('cmdId');
          expect(publishedNotis[1].meta.event.id).to.eql('evtId');
          expect(publishedNotis[1].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[1].meta.userId).to.eql('userId');
          expect(publishedNotis[1].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[1].meta.aggregate.name).to.eql('person');
          expect(publishedNotis[1].meta.aggregate.revision).to.eql(2);
          expect(publishedNotis[1].meta.context.name).to.eql('hr');

          done();
        });

      });

    });

    describe('handling an event that will be handled by 2 viewBuilder and a generic eventExtender and a generic preEventExtender', function () {

      it('it should publish 2 notification and it should callback without an error but with an extended event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtIdaranew',
          correlationId: 'cmdId',
          name: 'enteredNewPerson',
          aggregate: {
            id: '12345678aranew',
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
          for (var m in evt) {
            expect(e[m]).to.eql(evt[m]);
          }
          expect(e.defForAllExt).to.eql(true);
          expect(e.extended).to.eql(true);
          expect(e.preExtended).to.eql(true);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(2);
          expect(notis[0].name).to.eql('create');
          expect(notis[0].collection).to.eql('person');
          expect(notis[0].payload.id).to.eql('12345678aranew');
          expect(notis[0].payload.firstname).to.eql('Jack');
          expect(notis[0].payload.lastname).to.eql('Joe');
          expect(notis[0].payload.email).not.to.be.ok();
          expect(notis[0].id).to.be.a('string');
          expect(notis[0].correlationId).to.eql('cmdId');
          expect(notis[0].meta.event.id).to.eql('evtIdaranew');
          expect(notis[0].meta.event.name).to.eql('enteredNewPerson');
          expect(notis[0].meta.userId).to.eql('userId');
          expect(notis[0].meta.aggregate.id).to.eql('12345678aranew');
          expect(notis[0].meta.aggregate.name).to.eql('person');
          expect(notis[0].meta.aggregate.revision).to.eql(1);
          expect(notis[0].meta.context.name).to.eql('hr');
          expect(notis[1].name).to.eql('create');
          expect(notis[1].collection).to.eql('personDetail');
          expect(notis[1].payload.id).to.eql('12345678aranew');
          expect(notis[1].payload.firstname).to.eql('Jack');
          expect(notis[1].payload.lastname).to.eql('Joe');
          expect(notis[1].payload.email).to.eql('a@b.c');
          expect(notis[1].id).to.be.a('string');
          expect(notis[1].correlationId).to.eql('cmdId');
          expect(notis[1].meta.event.id).to.eql('evtIdaranew');
          expect(notis[1].meta.event.name).to.eql('enteredNewPerson');
          expect(notis[1].meta.userId).to.eql('userId');
          expect(notis[1].meta.aggregate.id).to.eql('12345678aranew');
          expect(notis[1].meta.aggregate.name).to.eql('person');
          expect(notis[1].meta.aggregate.revision).to.eql(1);
          expect(notis[1].meta.context.name).to.eql('hr');

          expect(publishedEvents.length).to.eql(1);
          for (var m in evt) {
            expect(publishedEvents[0][m]).to.eql(evt[m]);
          }
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).to.eql(true);
          expect(publishedEvents[0].preExtended).to.eql(true);
          expect(publishedNotis.length).to.eql(2);
          expect(publishedNotis[0].name).to.eql('create');
          expect(publishedNotis[0].collection).to.eql('person');
          expect(publishedNotis[0].payload.id).to.eql('12345678aranew');
          expect(publishedNotis[0].payload.firstname).to.eql('Jack');
          expect(publishedNotis[0].payload.lastname).to.eql('Joe');
          expect(publishedNotis[0].payload.email).not.to.be.ok();
          expect(publishedNotis[0].payload.wasExtendedByPreExtender).to.eql(true);
          expect(publishedNotis[0].id).to.be.a('string');
          expect(publishedNotis[0].correlationId).to.eql('cmdId');
          expect(publishedNotis[0].meta.event.id).to.eql('evtIdaranew');
          expect(publishedNotis[0].meta.event.name).to.eql('enteredNewPerson');
          expect(publishedNotis[0].meta.userId).to.eql('userId');
          expect(publishedNotis[0].meta.aggregate.id).to.eql('12345678aranew');
          expect(publishedNotis[0].meta.aggregate.name).to.eql('person');
          expect(publishedNotis[0].meta.aggregate.revision).to.eql(1);
          expect(publishedNotis[0].meta.context.name).to.eql('hr');
          expect(publishedNotis[1].name).to.eql('create');
          expect(publishedNotis[1].collection).to.eql('personDetail');
          expect(publishedNotis[1].payload.id).to.eql('12345678aranew');
          expect(publishedNotis[1].payload.firstname).to.eql('Jack');
          expect(publishedNotis[1].payload.lastname).to.eql('Joe');
          expect(publishedNotis[1].payload.email).to.eql('a@b.c');
          expect(publishedNotis[1].payload.wasExtendedByPreExtender).not.to.be.ok();
          expect(publishedNotis[1].id).to.be.a('string');
          expect(publishedNotis[1].correlationId).to.eql('cmdId');
          expect(publishedNotis[1].meta.event.id).to.eql('evtIdaranew');
          expect(publishedNotis[1].meta.event.name).to.eql('enteredNewPerson');
          expect(publishedNotis[1].meta.userId).to.eql('userId');
          expect(publishedNotis[1].meta.aggregate.id).to.eql('12345678aranew');
          expect(publishedNotis[1].meta.aggregate.name).to.eql('person');
          expect(publishedNotis[1].meta.aggregate.revision).to.eql(1);
          expect(publishedNotis[1].meta.context.name).to.eql('hr');

          done();
        });

      });

    });

    describe('handling an event that will be handled by 2 viewBuilder and a generic eventExtender', function () {

      it('it should publish 3 notification and it should callback without an error but with an extended event', function (done) {

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
            id: '1234'
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
          expect(notis.length).to.eql(3);
          expect(notis[0].name).to.eql('update');
          expect(notis[0].collection).to.eql('person');
          expect(notis[0].payload.id).to.eql('1234');
          expect(notis[0].payload.firstname).to.eql('Jack');
          expect(notis[0].payload.lastname).to.eql('Joe');
          expect(notis[0].payload.email).not.to.be.ok();
          expect(notis[0].payload.generalEmail).to.eql('abc@d.e');
          expect(notis[0].id).to.be.a('string');
          expect(notis[0].correlationId).to.eql('cmdId');
          expect(notis[0].meta.event.id).to.eql('evtId');
          expect(notis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[0].meta.userId).to.eql('userId');
          expect(notis[0].meta.aggregate.id).to.eql('1234');
          expect(notis[0].meta.aggregate.name).not.to.be.ok();
          expect(notis[0].meta.aggregate.revision).to.eql(3);
          expect(notis[0].meta.context.name).not.to.be.ok();
          expect(notis[1].name).to.eql('update');
          expect(notis[1].collection).to.eql('person');
          expect(notis[1].payload.id).to.eql('12345678aranew');
          expect(notis[1].payload.firstname).to.eql('Jack');
          expect(notis[1].payload.lastname).to.eql('Joe');
          expect(notis[1].payload.email).not.to.be.ok();
          expect(notis[1].payload.generalEmail).to.eql('abc@d.e');
          expect(notis[1].id).to.be.a('string');
          expect(notis[1].correlationId).to.eql('cmdId');
          expect(notis[1].meta.event.id).to.eql('evtId');
          expect(notis[1].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[1].meta.userId).to.eql('userId');
          expect(notis[1].meta.aggregate.id).to.eql('1234');
          expect(notis[1].meta.aggregate.name).not.to.be.ok();
          expect(notis[1].meta.aggregate.revision).to.eql(3);
          expect(notis[1].meta.context.name).not.to.be.ok();
          expect(notis[2].name).to.eql('update');
          expect(notis[2].collection).to.eql('personDetail');
          expect(notis[2].payload.id).to.eql('1234');
          expect(notis[2].payload.firstname).to.eql('Jack');
          expect(notis[2].payload.lastname).to.eql('Joe');
          expect(notis[2].payload.email).to.eql('abc@d.e');
          expect(notis[2].id).to.be.a('string');
          expect(notis[2].correlationId).to.eql('cmdId');
          expect(notis[2].meta.event.id).to.eql('evtId');
          expect(notis[2].meta.event.name).to.eql('registeredEMailAddress');
          expect(notis[2].meta.userId).to.eql('userId');
          expect(notis[2].meta.aggregate.id).to.eql('1234');
          expect(notis[2].meta.aggregate.name).not.to.be.ok();
          expect(notis[2].meta.aggregate.revision).to.eql(3);
          expect(notis[2].meta.context.name).not.to.be.ok();

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedEvents[0].defForAllExt).to.eql(true);
          expect(publishedEvents[0].extended).not.to.be.ok();
          expect(publishedEvents[0].extendedDefault).to.eql(true);
          expect(publishedNotis.length).to.eql(3);
          expect(publishedNotis[0].name).to.eql('update');
          expect(publishedNotis[0].collection).to.eql('person');
          expect(publishedNotis[0].payload.id).to.eql('1234');
          expect(publishedNotis[0].payload.firstname).to.eql('Jack');
          expect(publishedNotis[0].payload.lastname).to.eql('Joe');
          expect(publishedNotis[0].payload.email).not.to.be.ok();
          expect(publishedNotis[0].payload.generalEmail).to.eql('abc@d.e');
          expect(publishedNotis[0].id).to.be.a('string');
          expect(publishedNotis[0].correlationId).to.eql('cmdId');
          expect(publishedNotis[0].meta.event.id).to.eql('evtId');
          expect(publishedNotis[0].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[0].meta.userId).to.eql('userId');
          expect(publishedNotis[0].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[0].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[0].meta.aggregate.revision).to.eql(3);
          expect(publishedNotis[0].meta.context.name).not.to.be.ok();
          expect(publishedNotis[1].name).to.eql('update');
          expect(publishedNotis[1].collection).to.eql('person');
          expect(publishedNotis[1].payload.id).to.eql('12345678aranew');
          expect(publishedNotis[1].payload.firstname).to.eql('Jack');
          expect(publishedNotis[1].payload.lastname).to.eql('Joe');
          expect(publishedNotis[1].payload.email).not.to.be.ok();
          expect(publishedNotis[1].payload.generalEmail).to.eql('abc@d.e');
          expect(publishedNotis[1].id).to.be.a('string');
          expect(publishedNotis[1].correlationId).to.eql('cmdId');
          expect(publishedNotis[1].meta.event.id).to.eql('evtId');
          expect(publishedNotis[1].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[1].meta.userId).to.eql('userId');
          expect(publishedNotis[1].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[1].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[1].meta.aggregate.revision).to.eql(3);
          expect(publishedNotis[1].meta.context.name).not.to.be.ok();
          expect(publishedNotis[2].name).to.eql('update');
          expect(publishedNotis[2].collection).to.eql('personDetail');
          expect(publishedNotis[2].payload.id).to.eql('1234');
          expect(publishedNotis[2].payload.firstname).to.eql('Jack');
          expect(publishedNotis[2].payload.lastname).to.eql('Joe');
          expect(publishedNotis[2].payload.email).to.eql('abc@d.e');
          expect(publishedNotis[2].id).to.be.a('string');
          expect(publishedNotis[2].correlationId).to.eql('cmdId');
          expect(publishedNotis[2].meta.event.id).to.eql('evtId');
          expect(publishedNotis[2].meta.event.name).to.eql('registeredEMailAddress');
          expect(publishedNotis[2].meta.userId).to.eql('userId');
          expect(publishedNotis[2].meta.aggregate.id).to.eql('1234');
          expect(publishedNotis[2].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[2].meta.aggregate.revision).to.eql(3);
          expect(publishedNotis[2].meta.context.name).not.to.be.ok();

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
            id: '1234'//,
            //name: 'person'
          },
          context: {
            //name: 'hr'
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

      it('it should fire an eventMissing event', function (done) {

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
          expect(info.guardRevision).to.eql(3);
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

    describe('handling some events multiple times', function () {

      before(function (done) {
        denorm.clear(done);
      });

      it('it should work as expected', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt1 = {
          id: 'evtIdb',
          correlationId: 'cmdIdb',
          name: 'enteredNewPerson',
          aggregate: {
            id: '12345678b',
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

        var evt2 = {
          id: 'evtId2b',
          correlationId: 'cmdId2b',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678b',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'd@e.f'
          },
          revision: 2,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt3 = {
          id: 'evtId3b',
          correlationId: 'cmdId3b',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678b',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'g@h.i'
          },
          revision: 3,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt4 = {
          id: 'evtId4b',
          correlationId: 'cmdId4b',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678b',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'g@h.i'
          },
          revision: 4,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        denorm.handle(evt1, function (errs, e, notis) {
          var count = 1;

          function check () {
            count++;

            if (count >= 10) {
              denorm.getLastEvent(function (err, evt) {
                expect(err).not.be.ok();

                expect(evt.revision).to.eql(4);

                done();
              });
            }
          }
          denorm.handle(evt4, function (errs, e, notis) {
            check();
          });
          denorm.handle(evt3, function (errs, e, notis) {
            check();
          });
          denorm.handle(evt2, function (errs, e, notis) {
            check();
          });
          denorm.handle(evt2, function (errs, e, notis) {
            check();
          });
          denorm.handle(evt2, function (errs, e, notis) {
            check();
          });
          denorm.handle(evt4, function (errs, e, notis) {
            check();
          });

          denorm.handle(evt2, function (errs, e, notis) {
            check();
          });
          denorm.handle(evt3, function (errs, e, notis) {
            check();
          });
          denorm.handle(evt4, function (errs, e, notis) {
            check();
          });

        });

      });

    });

    describe('replaying some events', function () {

      before(function (done) {
        denorm.clear(done);
      });

      it('it should work as expected', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt1 = {
          id: 'evtId',
          correlationId: 'cmdId',
          name: 'enteredNewPerson',
          aggregate: {
            id: '12345678',
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

        var evt2 = {
          id: 'evtId2',
          correlationId: 'cmdId2',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'd@e.f'
          },
          revision: 2,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt3 = {
          id: 'evtId3',
          correlationId: 'cmdId3',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'g@h.i'
          },
          revision: 3,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        denorm.replay([evt1, evt2, evt2], function (err) {
          expect(err).not.to.be.ok();

          denorm.handle(evt3, function (errs, e, notis) {
            expect(errs).not.to.be.ok();
            expect(e).to.eql(evt3);
            expect(e.defForAllExt).to.eql(true);
            expect(e.extended).not.to.be.ok();
            expect(e.extendedDefault).to.eql(true);
            expect(notis).to.be.an('array');
            expect(notis.length).to.eql(2);
            expect(notis[0].name).to.eql('update');
            expect(notis[0].collection).to.eql('person');
            expect(notis[0].payload.id).to.eql('12345678');
            expect(notis[0].payload.firstname).to.eql('Jack');
            expect(notis[0].payload.lastname).to.eql('Joe');
            expect(notis[0].payload.email).not.to.be.ok();
            expect(notis[0].payload.generalEmail).to.eql('g@h.i');
            expect(notis[0].payload.incr).to.eql(2);
            expect(notis[0].payload.ref.obj.added).not.to.be.ok();
            expect(notis[0].id).to.be.a('string');
            expect(notis[0].correlationId).to.eql('cmdId3');
            expect(notis[0].meta.event.id).to.eql('evtId3');
            expect(notis[0].meta.event.name).to.eql('registeredEMailAddress');
            expect(notis[0].meta.userId).to.eql('userId');
            expect(notis[0].meta.aggregate.id).to.eql('12345678');
            expect(notis[0].meta.aggregate.name).to.eql('person');
            expect(notis[0].meta.aggregate.revision).to.eql(3);
            expect(notis[0].meta.context.name).to.eql('hr');
            expect(notis[1].name).to.eql('update');
            expect(notis[1].collection).to.eql('personDetail');
            expect(notis[1].payload.id).to.eql('12345678');
            expect(notis[1].payload.firstname).to.eql('Jack');
            expect(notis[1].payload.lastname).to.eql('Joe');
            expect(notis[1].payload.email).to.eql('g@h.i');
            expect(notis[1].id).to.be.a('string');
            expect(notis[1].correlationId).to.eql('cmdId3');
            expect(notis[1].meta.event.id).to.eql('evtId3');
            expect(notis[1].meta.event.name).to.eql('registeredEMailAddress');
            expect(notis[1].meta.userId).to.eql('userId');
            expect(notis[1].meta.aggregate.id).to.eql('12345678');
            expect(notis[1].meta.aggregate.name).to.eql('person');
            expect(notis[1].meta.aggregate.revision).to.eql(3);
            expect(notis[1].meta.context.name).to.eql('hr');

            expect(publishedEvents.length).to.eql(1);
            expect(publishedEvents[0]).to.eql(evt3);
            expect(publishedEvents[0].defForAllExt).to.eql(true);
            expect(publishedEvents[0].extended).not.to.be.ok();
            expect(publishedEvents[0].extendedDefault).to.eql(true);
            expect(publishedNotis.length).to.eql(2);
            expect(publishedNotis[0].name).to.eql('update');
            expect(publishedNotis[0].collection).to.eql('person');
            expect(publishedNotis[0].payload.id).to.eql('12345678');
            expect(publishedNotis[0].payload.firstname).to.eql('Jack');
            expect(publishedNotis[0].payload.lastname).to.eql('Joe');
            expect(publishedNotis[0].payload.email).not.to.be.ok();
            expect(publishedNotis[0].payload.generalEmail).to.eql('g@h.i');
            expect(publishedNotis[0].id).to.be.a('string');
            expect(publishedNotis[0].correlationId).to.eql('cmdId3');
            expect(publishedNotis[0].meta.event.id).to.eql('evtId3');
            expect(publishedNotis[0].meta.event.name).to.eql('registeredEMailAddress');
            expect(publishedNotis[0].meta.userId).to.eql('userId');
            expect(publishedNotis[0].meta.aggregate.id).to.eql('12345678');
            expect(publishedNotis[0].meta.aggregate.name).to.eql('person');
            expect(publishedNotis[0].meta.aggregate.revision).to.eql(3);
            expect(publishedNotis[0].meta.context.name).to.eql('hr');
            expect(publishedNotis[1].name).to.eql('update');
            expect(publishedNotis[1].collection).to.eql('personDetail');
            expect(publishedNotis[1].payload.id).to.eql('12345678');
            expect(publishedNotis[1].payload.firstname).to.eql('Jack');
            expect(publishedNotis[1].payload.lastname).to.eql('Joe');
            expect(publishedNotis[1].payload.email).to.eql('g@h.i');
            expect(publishedNotis[1].id).to.be.a('string');
            expect(publishedNotis[1].correlationId).to.eql('cmdId3');
            expect(publishedNotis[1].meta.event.id).to.eql('evtId3');
            expect(publishedNotis[1].meta.event.name).to.eql('registeredEMailAddress');
            expect(publishedNotis[1].meta.userId).to.eql('userId');
            expect(publishedNotis[1].meta.aggregate.id).to.eql('12345678');
            expect(publishedNotis[1].meta.aggregate.name).to.eql('person');
            expect(publishedNotis[1].meta.aggregate.revision).to.eql(3);
            expect(publishedNotis[1].meta.context.name).to.eql('hr');

            done();
          });
        });

      });

    });

    describe('replaying some events in parts', function () {

      before(function (done) {
        denorm.clear(done);
      });

      it('it should work as expected', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt1 = {
          id: 'evtIdp',
          correlationId: 'cmdIdp',
          name: 'enteredNewPerson',
          aggregate: {
            id: '12345678p',
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

        var evt2 = {
          id: 'evtId2p',
          correlationId: 'cmdId2p',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678p',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'd@e.f'
          },
          revision: 2,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt3 = {
          id: 'evtId3p',
          correlationId: 'cmdId3p',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678p',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'g@h.i'
          },
          revision: 3,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt4 = {
          id: 'evtId4p',
          correlationId: 'cmdId4p',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678p',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'g@h.i2'
          },
          revision: 4,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt5 = {
          id: 'evtId5p',
          correlationId: 'cmdId5p',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '12345678p',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'g@h.i3'
          },
          revision: 5,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt6 = {
          id: 'evtId6p',
          correlationId: 'cmdId6p',
          name: 'enteredNewPerson',
          aggregate: {
            id: '32145876',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            firstname: 'Jane',
            lastname: 'Jonson',
            email: 'a@b.com'
          },
          revision: 0,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt7 = {
          id: 'evtId7p',
          correlationId: 'cmdId7p',
          name: 'blockedEmail',
          aggregate: {
            id: 'dont-care',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'g@h.i3'
          },
          revision: 0,
          version: 0,
          meta: {
            userId: 'userId'
          }
        };

        var evt8 = {
          id: 'evtId8p',
          correlationId: 'cmdId8p',
          name: 'exitedPerson',
          aggregate: {
            id: '12345678p',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {},
          revision: 7,
          version: 0,
          meta: {
            userId: 'userId'
          }
        };

        var evt9 = {
          id: 'evtId9p',
          correlationId: 'cmdId9p',
          name: 'blockedEmail',
          aggregate: {
            id: 'dont-care-2',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'a@b.com'
          },
          revision: 0,
          version: 0,
          meta: {
            userId: 'userId'
          }
        };

        denorm.replayStreamed(function (replay, finished) {

          replay(evt1);
          replay(evt2);

          process.nextTick(function () {
            finished(function (err) {
              expect(err).not.to.be.ok();

              denorm.replayStreamed(function (replay, finished) {

                replay(evt3);

                finished(function (err) {
                  expect(err).not.to.be.ok();

                  denorm.handle(evt4, function (errs, e, notis) {
                    expect(errs).not.to.be.ok();
                    expect(e).to.eql(evt4);
                    expect(e.defForAllExt).to.eql(true);
                    expect(e.extended).not.to.be.ok();
                    expect(e.extendedDefault).to.eql(true);
                    expect(notis).to.be.an('array');
                    expect(notis.length).to.eql(2);
                    expect(notis[0].name).to.eql('update');
                    expect(notis[0].collection).to.eql('person');
                    expect(notis[0].payload.id).to.eql('12345678p');
                    expect(notis[0].payload.firstname).to.eql('Jack');
                    expect(notis[0].payload.lastname).to.eql('Joe');
                    expect(notis[0].payload.email).not.to.be.ok();
                    expect(notis[0].payload.generalEmail).to.eql('g@h.i2');
                    expect(notis[0].id).to.be.a('string');
                    expect(notis[0].correlationId).to.eql('cmdId4p');
                    expect(notis[0].meta.event.id).to.eql('evtId4p');
                    expect(notis[0].meta.event.name).to.eql('registeredEMailAddress');
                    expect(notis[0].meta.userId).to.eql('userId');
                    expect(notis[0].meta.aggregate.id).to.eql('12345678p');
                    expect(notis[0].meta.aggregate.name).to.eql('person');
                    expect(notis[0].meta.aggregate.revision).to.eql(4);
                    expect(notis[0].meta.context.name).to.eql('hr');
                    expect(notis[1].name).to.eql('update');
                    expect(notis[1].collection).to.eql('personDetail');
                    expect(notis[1].payload.id).to.eql('12345678p');
                    expect(notis[1].payload.firstname).to.eql('Jack');
                    expect(notis[1].payload.lastname).to.eql('Joe');
                    expect(notis[1].payload.email).to.eql('g@h.i2');
                    expect(notis[1].id).to.be.a('string');
                    expect(notis[1].correlationId).to.eql('cmdId4p');
                    expect(notis[1].meta.event.id).to.eql('evtId4p');
                    expect(notis[1].meta.event.name).to.eql('registeredEMailAddress');
                    expect(notis[1].meta.userId).to.eql('userId');
                    expect(notis[1].meta.aggregate.id).to.eql('12345678p');
                    expect(notis[1].meta.aggregate.name).to.eql('person');
                    expect(notis[1].meta.aggregate.revision).to.eql(4);
                    expect(notis[1].meta.context.name).to.eql('hr');

                    expect(publishedEvents.length).to.eql(1);
                    expect(publishedEvents[0]).to.eql(evt4);
                    expect(publishedEvents[0].defForAllExt).to.eql(true);
                    expect(publishedEvents[0].extended).not.to.be.ok();
                    expect(publishedEvents[0].extendedDefault).to.eql(true);
                    expect(publishedNotis.length).to.eql(2);
                    expect(publishedNotis[0].name).to.eql('update');
                    expect(publishedNotis[0].collection).to.eql('person');
                    expect(publishedNotis[0].payload.id).to.eql('12345678p');
                    expect(publishedNotis[0].payload.firstname).to.eql('Jack');
                    expect(publishedNotis[0].payload.lastname).to.eql('Joe');
                    expect(publishedNotis[0].payload.email).not.to.be.ok();
                    expect(publishedNotis[0].payload.generalEmail).to.eql('g@h.i2');
                    expect(publishedNotis[0].id).to.be.a('string');
                    expect(publishedNotis[0].correlationId).to.eql('cmdId4p');
                    expect(publishedNotis[0].meta.event.id).to.eql('evtId4p');
                    expect(publishedNotis[0].meta.event.name).to.eql('registeredEMailAddress');
                    expect(publishedNotis[0].meta.userId).to.eql('userId');
                    expect(publishedNotis[0].meta.aggregate.id).to.eql('12345678p');
                    expect(publishedNotis[0].meta.aggregate.name).to.eql('person');
                    expect(publishedNotis[0].meta.aggregate.revision).to.eql(4);
                    expect(publishedNotis[0].meta.context.name).to.eql('hr');
                    expect(publishedNotis[1].name).to.eql('update');
                    expect(publishedNotis[1].collection).to.eql('personDetail');
                    expect(publishedNotis[1].payload.id).to.eql('12345678p');
                    expect(publishedNotis[1].payload.firstname).to.eql('Jack');
                    expect(publishedNotis[1].payload.lastname).to.eql('Joe');
                    expect(publishedNotis[1].payload.email).to.eql('g@h.i2');
                    expect(publishedNotis[1].id).to.be.a('string');
                    expect(publishedNotis[1].correlationId).to.eql('cmdId4p');
                    expect(publishedNotis[1].meta.event.id).to.eql('evtId4p');
                    expect(publishedNotis[1].meta.event.name).to.eql('registeredEMailAddress');
                    expect(publishedNotis[1].meta.userId).to.eql('userId');
                    expect(publishedNotis[1].meta.aggregate.id).to.eql('12345678p');
                    expect(publishedNotis[1].meta.aggregate.name).to.eql('person');
                    expect(publishedNotis[1].meta.aggregate.revision).to.eql(4);
                    expect(publishedNotis[1].meta.context.name).to.eql('hr');

                    denorm.replayStreamed(function (replay, finished) {
                      replay(evt5);
                      replay(evt6);
                      replay(evt7);
                      replay(evt8);

                      finished(function (err) {
                        expect(err).not.to.be.ok();

                        denorm.handle(evt9, function (errs, e, notis) {
                          expect(errs).not.to.be.ok();
                          expect(e).to.eql(evt9);
                          expect(notis).to.be.an('array');
                          expect(notis.length).to.eql(1);
                          expect(notis[0].name).to.eql('update');
                          expect(notis[0].collection).to.eql('personDetail');
                          expect(notis[0].payload.id).to.eql('32145876');
                          expect(notis[0].payload.firstname).to.eql('Jane');
                          expect(notis[0].payload.lastname).to.eql('Jonson');
                          expect(notis[0].payload.email).to.eql('a@b.com');
                          expect(notis[0].payload.blocked).to.eql(true);

                          expect(notis[0].id).to.be.a('string');
                          expect(notis[0].correlationId).to.eql('cmdId9p');
                          expect(notis[0].meta.event.id).to.eql('evtId9p');
                          expect(notis[0].meta.event.name).to.eql('blockedEmail');
                          expect(notis[0].meta.userId).to.eql('userId');
                          expect(notis[0].meta.aggregate.id).to.eql('dont-care-2');
                          expect(notis[0].meta.aggregate.name).to.eql('person');
                          expect(notis[0].meta.aggregate.revision).to.eql(0);
                          expect(notis[0].meta.context.name).to.eql('hr');

                          expect(publishedEvents.length).to.eql(2);
                          expect(publishedEvents[1]).to.eql(evt9);
                          expect(publishedEvents[1].defForAllExt).to.eql(true);
                          expect(publishedEvents[1].extended).not.to.be.ok();
                          expect(publishedEvents[1].extendedDefault).to.eql(true);
                          expect(publishedNotis.length).to.eql(3);
                          expect(publishedNotis[2].name).to.eql('update');
                          expect(publishedNotis[2].collection).to.eql('personDetail');
                          expect(publishedNotis[2].payload.id).to.eql('32145876');
                          expect(publishedNotis[2].payload.firstname).to.eql('Jane');
                          expect(publishedNotis[2].payload.lastname).to.eql('Jonson');
                          expect(publishedNotis[2].payload.email).to.eql('a@b.com');
                          expect(publishedNotis[2].payload.blocked).to.eql(true);
                          expect(publishedNotis[2].id).to.be.a('string');
                          expect(publishedNotis[2].correlationId).to.eql('cmdId9p');
                          expect(publishedNotis[2].meta.event.id).to.eql('evtId9p');
                          expect(publishedNotis[2].meta.event.name).to.eql('blockedEmail');
                          expect(publishedNotis[2].meta.userId).to.eql('userId');
                          expect(publishedNotis[2].meta.aggregate.id).to.eql('dont-care-2');
                          expect(publishedNotis[2].meta.aggregate.name).to.eql('person');
                          expect(publishedNotis[2].meta.aggregate.revision).to.eql(0);
                          expect(publishedNotis[2].meta.context.name).to.eql('hr');

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

    });

    describe('handling an event that denormalizes multiple viewmodels in same collection', function () {

      before(function (done) {
        denorm.clear(done);
      });

      it('it should publish 2 notification and it should callback without an error but with an extended event', function (done) {

        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt11 = {
          id: 'evtId',
          correlationId: 'cmdId',
          name: 'enteredNewPerson',
          aggregate: {
            id: '71632',
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

        var evt12 = {
          id: 'evtId2',
          correlationId: 'cmdId2',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '71632',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'd@e.f'
          },
          revision: 2,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        var evt21 = {
          id: 'evtId3',
          correlationId: 'cmdId',
          name: 'enteredNewPerson',
          aggregate: {
            id: '14123',
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

        var evt22 = {
          id: 'evtId4',
          correlationId: 'cmdId2',
          name: 'registeredEMailAddress',
          aggregate: {
            id: '14123',
            name: 'person'
          },
          context: {
            name: 'hr'
          },
          payload: {
            email: 'd@e.f'
          },
          revision: 2,
          version: 2,
          meta: {
            userId: 'userId'
          }
        };

        denorm.handle(evt11, function (errs, e, notis) {
          expect(errs).not.to.be.ok();

          denorm.handle(evt12, function (errs, e, notis) {
            expect(errs).not.to.be.ok();

            denorm.handle(evt21, function (errs, e, notis) {
              expect(errs).not.to.be.ok();

              denorm.handle(evt22, function (errs, e, notis) {
                expect(errs).not.to.be.ok();

                expect(publishedEvents.length).to.eql(4);
                for (var m in evt11) {
                  expect(publishedEvents[0][m]).to.eql(evt11[m]);
                }
                for (var m in evt11) {
                  expect(publishedEvents[1][m]).to.eql(evt12[m]);
                }
                for (var m in evt11) {
                  expect(publishedEvents[2][m]).to.eql(evt21[m]);
                }
                for (var m in evt11) {
                  expect(publishedEvents[3][m]).to.eql(evt22[m]);
                }

                expect(publishedNotis.length).to.eql(9);
                expect(publishedNotis[0].name).to.eql('create');
                expect(publishedNotis[0].collection).to.eql('person');
                expect(publishedNotis[0].payload.id).to.eql('71632');
                expect(publishedNotis[1].name).to.eql('create');
                expect(publishedNotis[1].collection).to.eql('personDetail');
                expect(publishedNotis[1].payload.id).to.eql('71632');
                expect(publishedNotis[2].name).to.eql('update');
                expect(publishedNotis[2].collection).to.eql('person');
                expect(publishedNotis[2].payload.id).to.eql('71632');
                expect(publishedNotis[3].name).to.eql('update');
                expect(publishedNotis[3].collection).to.eql('personDetail');
                expect(publishedNotis[3].payload.id).to.eql('71632');
                expect(publishedNotis[4].name).to.eql('create');
                expect(publishedNotis[4].collection).to.eql('person');
                expect(publishedNotis[4].payload.id).to.eql('14123');
                expect(publishedNotis[5].name).to.eql('create');
                expect(publishedNotis[5].collection).to.eql('personDetail');
                expect(publishedNotis[5].payload.id).to.eql('14123');
                expect(publishedNotis[6].name).to.eql('update');
                expect(publishedNotis[6].collection).to.eql('person');
                expect(publishedNotis[6].payload.id).to.eql('14123');
                expect(publishedNotis[7].name).to.eql('update');
                expect(publishedNotis[7].collection).to.eql('person');
                expect(publishedNotis[7].payload.id).to.eql('71632');
                expect(publishedNotis[8].name).to.eql('update');
                expect(publishedNotis[8].collection).to.eql('personDetail');
                expect(publishedNotis[8].payload.id).to.eql('14123');

                done();
              });
            });
          });
        });

      });

    });

    describe('handling an event that will be handled by 1 viewBuilder and an onAfterCommit function', function () {

      it('it should publish 1 notification and it should callback without an error', function (done) {

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
          name: 'personLeaved',
          aggregate: {
            id: '1234special'
//            name: 'person'
          },
          context: {
//            name: 'hr'
          },
          payload: {
            special: 'important value'
          },
          revision: 1,
          version: 0,
          meta: {
            userId: 'userId'
          }
        };

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(1);
          expect(notis[0].name).to.eql('create');
          expect(notis[0].collection).to.eql('person');
          expect(notis[0].payload.sp).to.eql('important value');
          expect(notis[0].id).to.be.a('string');
          expect(notis[0].correlationId).to.eql('cmdId');
          expect(notis[0].meta.event.id).to.eql('evtId');
          expect(notis[0].meta.event.name).to.eql('personLeaved');
          expect(notis[0].meta.userId).to.eql('userId');
          expect(notis[0].meta.aggregate.id).to.eql('1234special');
          expect(notis[0].meta.aggregate.name).not.to.be.ok();
          expect(notis[0].meta.aggregate.revision).to.eql(1);
          expect(notis[0].meta.context.name).not.to.be.ok();

          expect(publishedEvents.length).to.eql(1);
          expect(publishedEvents[0]).to.eql(evt);
          expect(publishedNotis.length).to.eql(1);
          expect(publishedNotis[0].name).to.eql('create');
          expect(publishedNotis[0].collection).to.eql('person');
          expect(publishedNotis[0].payload.sp).to.eql('important value');
          expect(publishedNotis[0].id).to.be.a('string');
          expect(publishedNotis[0].correlationId).to.eql('cmdId');
          expect(publishedNotis[0].meta.event.id).to.eql('evtId');
          expect(publishedNotis[0].meta.event.name).to.eql('personLeaved');
          expect(publishedNotis[0].meta.userId).to.eql('userId');
          expect(publishedNotis[0].meta.aggregate.id).to.eql('1234special');
          expect(publishedNotis[0].meta.aggregate.name).not.to.be.ok();
          expect(publishedNotis[0].meta.aggregate.revision).to.eql(1);
          expect(publishedNotis[0].meta.context.name).not.to.be.ok();

          done();
        });

      });

    });

    describe('skip event extender - handling an event that will be handled by 2 viewBuilder and a generic eventExtender and a generic preEventExtender', function () {

      before(function (done) {
        denorm = api({
          denormalizerPath: __dirname + '/fixture/set1',
          commandRejectedEventName: 'rejectedCommand',
          revisionGuard: { queueTimeout: 200, queueTimeoutMaxLoops: 2 },
          skipOnNotification: true, // has to be set
          skipExtendEvent: true, // has to be set
          skipOnEvent: true // has to be set
        });
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
          event: 'meta.event.name',
          meta: 'meta'
        });

        denorm.defaultEventExtension(function (evt) {
          evt.defForAllExt = true;
          return evt;
        });

        expect(function () {
          denorm.getInfo();
        }).to.throwError('/init');

        denorm.init(function (err, warns) {
          expect(warns).not.to.be.ok();
          done(err);
        });

      })

      it('it should not publish notifications, the event shall not be extended, the event shall not be published', function (done) {
        var publishedEvents = [];
        denorm.onEvent(function (evt) {
          publishedEvents.push(evt);
        });

        var publishedNotis = [];
        denorm.onNotification(function (noti) {
          publishedNotis.push(noti);
        });

        var evt = {
          id: 'evtIdaranew',
          correlationId: 'cmdId',
          name: 'enteredNewPerson',
          aggregate: {
            id: '12345678aranew',
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
          for (var m in evt) {
            expect(e[m]).to.eql(evt[m]);
          }
          expect(e.defForAllExt).to.eql(undefined);
          expect(e.extended).to.eql(undefined);
          expect(e.extendedDefault).to.eql(undefined);
          expect(e.preExtended).to.eql(true);
          expect(notis).to.be.an('array');
          expect(notis.length).to.eql(2);
          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);
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
        event: 'meta.event.name',
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

          for (var m in evt) {
            expect(e[m]).to.eql(evt[m]);
          }
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
          for (var m in evt) {
            expect(publishedEvents[0][m]).to.eql(evt[m]);
          }
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

      it('it should fire an eventMissing event', function (done) {

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

    describe('handling an command rejected event', function () {
      before(function (done) {
        denorm = api({
          denormalizerPath: __dirname + '/fixture/set2',
          commandRejectedEventName: 'commandRejected',
          revisionGuard: { queueTimeout: 200, queueTimeoutMaxLoops: 2 },
          skipOnEventMissing: true // has to be set
        });
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
          event: 'meta.event.name',
          meta: 'meta'
        });
        denorm.defaultEventExtension(function (evt) {
          evt.defForAllExt = true;
          return evt;
        });
        denorm.init(done);

      })

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
          eventMissingCalled = true;
        });

        denorm.handle(evt, function (errs, e, notis) {
          expect(errs).not.to.be.ok();
          expect(e).to.eql(evt);
          expect(notis.length).to.eql(0);
          expect(publishedEvents.length).to.eql(0);
          expect(publishedNotis.length).to.eql(0);
          expect(eventMissingCalled).to.eql(false);
          done();
        });

      });

    });

  });

});
