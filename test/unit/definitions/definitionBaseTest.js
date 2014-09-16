var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase');

describe('base definition', function () {

  describe('creating a new definition', function () {

    it('it should not throw an error', function () {

      expect(function () {
        new DefinitionBase();
      }).not.to.throwError();

    });

    it('it should return a correct object', function () {

      var def = new DefinitionBase();
      expect(def.definitions).to.be.an('object');
      expect(def.definitions.notification).to.be.an('object');
      expect(def.definitions.event).to.be.an('object');
      expect(def.defineNotification).to.be.a('function');
      expect(def.defineEvent).to.be.a('function');
      expect(def.defineOptions).to.be.a('function');

    });

    describe('passing a name in meta infos', function () {

      it('it should return a correct object', function () {

        var def = new DefinitionBase({ name: 'myName' });
        expect(def.name).to.eql('myName');
        expect(def.definitions).to.be.an('object');
        expect(def.definitions.notification).to.be.an('object');
        expect(def.definitions.event).to.be.an('object');
        expect(def.defineNotification).to.be.a('function');
        expect(def.defineEvent).to.be.a('function');
        expect(def.defineOptions).to.be.a('function');

      });

    });

    describe('defining options', function() {

      var def;

      beforeEach(function () {
        def = new DefinitionBase({ name: 'myName' });
      });

      it('it should work as expected', function() {

        def.defineOptions({
          my: 'options',
          of: {
            some: 'deep'
          }
        });

        expect(def.options.my).to.eql('options');
        expect(def.options.of.some).to.eql('deep');

      });

    });

    describe('defining the notification structure', function() {

      var def;

      beforeEach(function () {
        def = new DefinitionBase({ name: 'myName' });
      });

      describe('using the defaults', function () {

        it('it should apply the defaults', function() {

          var defaults = _.cloneDeep(def.definitions.notification);

          def.defineNotification({
            collection: 'col',
            payload: 'data',
            context: 'meta.context.name',
            aggregate: 'meta.aggregate.name'
          });

          expect(defaults.correlationId).to.eql(def.definitions.notification.correlationId);
          expect(defaults.id).to.eql(def.definitions.notification.id);
          expect(def.definitions.notification.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(def.definitions.notification.payload);
          expect(def.definitions.notification.collection).to.eql('col');
          expect(defaults.collection).not.to.eql(def.definitions.notification.collection);
          expect(def.definitions.notification.context).to.eql('meta.context.name');
          expect(defaults.context).not.to.eql(def.definitions.notification.context);
          expect(def.definitions.notification.aggregate).to.eql('meta.aggregate.name');
          expect(defaults.aggregate).not.to.eql(def.definitions.notification.aggregate);
          expect(defaults.action).to.eql(def.definitions.notification.action);
          expect(defaults.meta).to.eql(def.definitions.notification.meta);

        });

      });

      describe('overwriting the defaults', function () {

        it('it should apply them correctly', function() {

          var defaults = _.cloneDeep(def.definitions.notification);

          def.defineNotification({
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

          expect(def.definitions.notification.correlationId).to.eql('corrId');
          expect(defaults.correlationId).not.to.eql(def.definitions.notification.correlationId);
          expect(def.definitions.notification.id).to.eql('notId');
          expect(defaults.id).not.to.eql(def.definitions.notification.id);
          expect(def.definitions.notification.action).to.eql('n');
          expect(defaults.action).not.to.eql(def.definitions.notification.action);
          expect(def.definitions.notification.collection).to.eql('c');
          expect(defaults.collection).not.to.eql(def.definitions.notification.collection);
          expect(def.definitions.notification.payload).to.eql('p');
          expect(defaults.payload).not.to.eql(def.definitions.notification.payload);
          expect(def.definitions.notification.context).to.eql('ctx');
          expect(defaults.context).not.to.eql(def.definitions.notification.context);
          expect(def.definitions.notification.aggregate).to.eql('agg');
          expect(defaults.aggregate).not.to.eql(def.definitions.notification.aggregate);
          expect(def.definitions.notification.aggregateId).to.eql('aggId');
          expect(defaults.aggregateId).not.to.eql(def.definitions.notification.aggregateId);
          expect(def.definitions.notification.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(def.definitions.notification.revision);
          expect(def.definitions.notification.eventId).to.eql('evtId');
          expect(defaults.eventId).not.to.eql(def.definitions.notification.eventId);
          expect(def.definitions.notification.eventName).to.eql('evtName');
          expect(defaults.eventName).not.to.eql(def.definitions.notification.eventName);
          expect(def.definitions.notification.meta).to.eql('m');
          expect(defaults.meta).not.to.eql(def.definitions.notification.meta);

        });

      });

    });

    describe('defining the event structure', function() {

      var def;

      beforeEach(function () {
        def = new DefinitionBase({ name: 'myName' });
      });

      describe('using the defaults', function () {

        it('it should apply the defaults', function() {

          var defaults = _.cloneDeep(def.definitions.event);

          def.defineEvent({
            payload: 'data',
            aggregate: 'aggName',
            context: 'ctx.Name',
            revision: 'rev',
            version: 'v.',
            meta: 'pass'
          });

          expect(defaults.correlationId).to.eql(def.definitions.event.correlationId);
          expect(defaults.id).to.eql(def.definitions.event.id);
          expect(def.definitions.event.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(def.definitions.event.payload);
          expect(defaults.name).to.eql(def.definitions.event.name);
          expect(defaults.aggregateId).to.eql(def.definitions.event.aggregateId);
          expect(def.definitions.event.aggregate).to.eql('aggName');
          expect(defaults.aggregate).not.to.eql(def.definitions.event.aggregate);
          expect(def.definitions.event.context).to.eql('ctx.Name');
          expect(defaults.context).not.to.eql(def.definitions.event.context);
          expect(def.definitions.event.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(def.definitions.event.revision);
          expect(def.definitions.event.version).to.eql('v.');
          expect(defaults.version).not.to.eql(def.definitions.event.version);
          expect(def.definitions.event.meta).to.eql('pass');
          expect(defaults.meta).not.to.eql(def.definitions.event.meta);

        });

      });

      describe('overwriting the defaults', function () {

        it('it should apply them correctly', function() {

          var defaults = _.cloneDeep(def.definitions.event);

          def.defineEvent({
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


          expect(def.definitions.event.correlationId).to.eql('cmdId');
          expect(defaults.correlationId).not.to.eql(def.definitions.event.correlationId);
          expect(def.definitions.event.id).to.eql('eventId');
          expect(defaults.id).not.to.eql(def.definitions.event.id);
          expect(def.definitions.event.payload).to.eql('data');
          expect(defaults.payload).not.to.eql(def.definitions.event.payload);
          expect(def.definitions.event.name).to.eql('defName');
          expect(defaults.name).not.to.eql(def.definitions.event.name);
          expect(def.definitions.event.aggregateId).to.eql('path.to.aggId');
          expect(defaults.aggregateId).not.to.eql(def.definitions.event.aggregateId);
          expect(def.definitions.event.aggregate).to.eql('aggName');
          expect(defaults.aggregate).not.to.eql(def.definitions.event.aggregate);
          expect(def.definitions.event.context).to.eql('ctx.Name');
          expect(defaults.context).not.to.eql(def.definitions.event.context);
          expect(def.definitions.event.revision).to.eql('rev');
          expect(defaults.revision).not.to.eql(def.definitions.event.revision);
          expect(def.definitions.event.version).to.eql('v.');
          expect(defaults.version).not.to.eql(def.definitions.event.version);
          expect(def.definitions.event.meta).to.eql('pass');
          expect(defaults.meta).not.to.eql(def.definitions.event.meta);

        });

      });

    });

  });

});
