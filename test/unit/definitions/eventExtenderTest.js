var expect = require('expect.js'),
  _ = require('lodash'),
  DefinitionBase = require('../../../lib/definitionBase'),
  EventExtender = require('../../../lib/definitions/eventExtender'),
  api = require('../../../');

describe('eventExtender definition', function () {

  describe('creating a new eventExtender definition', function () {

    describe('without any arguments', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineEventExtender();
        }).to.throwError(/function/);

      });

    });

    describe('without eventExtender function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineEventExtender(null);
        }).to.throwError(/function/);

      });

    });

    describe('with a wrong eventExtender function', function () {

      it('it should throw an error', function () {

        expect(function () {
          api.defineEventExtender(null, 'not a function');
        }).to.throwError(/function/);

      });

    });

    describe('with a correct eventExtender function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.defineEventExtender(null, function () {
          });
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var evtExtFn = function () {
        };
        var evtExt = api.defineEventExtender(null, evtExtFn);
        expect(evtExt).to.be.a(DefinitionBase);
        expect(evtExt).to.be.a(EventExtender);
        expect(evtExt.evtExtFn).to.eql(evtExtFn);
        expect(evtExt.definitions).to.be.an('object');
        expect(evtExt.definitions.notification).to.be.an('object');
        expect(evtExt.definitions.event).to.be.an('object');
        expect(evtExt.defineNotification).to.be.a('function');
        expect(evtExt.defineEvent).to.be.a('function');
        expect(evtExt.defineOptions).to.be.a('function');

        expect(evtExt.extend).to.be.a('function');
        expect(evtExt.useCollection).to.be.a('function');

      });

    });

    describe('with some meta infos and a correct eventExtender function', function () {

      it('it should not throw an error', function () {

        expect(function () {
          api.defineEventExtender({ name: 'eventName', version: 3 }, function () {
          });
        }).not.to.throwError();

      });

      it('it should return a correct object', function () {

        var evtExtFn = function () {
        };
        var evtExt = api.defineEventExtender({ name: 'eventName', version: 3 }, evtExtFn);
        expect(evtExt).to.be.a(DefinitionBase);
        expect(evtExt).to.be.a(EventExtender);
        expect(evtExt.evtExtFn).to.eql(evtExtFn);
        expect(evtExt.definitions).to.be.an('object');
        expect(evtExt.definitions.notification).to.be.an('object');
        expect(evtExt.definitions.event).to.be.an('object');
        expect(evtExt.defineNotification).to.be.a('function');
        expect(evtExt.defineEvent).to.be.a('function');
        expect(evtExt.defineOptions).to.be.a('function');

        expect(evtExt.extend).to.be.a('function');
        expect(evtExt.useCollection).to.be.a('function');

      });

    });

    describe('extending an event', function () {

      var evtExt;

      describe('having an event extender function that wants expects 3 arguments', function () {

        it('it should work as expected', function (done) {
          var extendedEvt = { ext: 'evt' };
          var evtExtFn = function (evt, col, callback) {
            expect(evt.my).to.eql('evt');
            expect(col.name).to.eql('myCol');
            callback(null, extendedEvt);
          };
          evtExt = api.defineEventExtender({
            name: 'eventName',
            version: 3
          }, evtExtFn);

          evtExt.useCollection({
            name: 'myCol'
          });

          evtExt.extend({ my: 'evt' }, function (err, eEvt) {
            expect(err).not.to.be.ok();
            expect(eEvt).to.eql(extendedEvt);
            done();
          });
        });

      });

      describe('having an event extender function that wants expects 1 argument', function () {

        it('it should work as expected', function (done) {
          var extendedEvt = { ext: 'evt' };
          var evtExtFn = function (evt) {
            expect(evt.my).to.eql('evt');
            return extendedEvt;
          };
          evtExt = api.defineEventExtender({
            name: 'eventName',
            version: 3
          }, evtExtFn);

          evtExt.useCollection({
            name: 'myCol'
          });

          evtExt.extend({ my: 'evt' }, function (err, eEvt) {
            expect(err).not.to.be.ok();
            expect(eEvt).to.eql(extendedEvt);
            done();
          });
        });

      });

      describe('having an event extender function that wants expects 2 argument', function () {

        describe('not defining an id', function () {

          it('it should work as expected', function (done) {
            var extendedEvt = { ext: 'evt' };
            var evtExtFn = function (evt, callback) {
              expect(evt.my).to.eql('evt');
              callback(null, extendedEvt);
            };
            evtExt = api.defineEventExtender({
              name: 'eventName',
              version: 3
            }, evtExtFn);

            evtExt.useCollection({
              name: 'myCol'
            });

            evtExt.extend({ my: 'evt' }, function (err, eEvt) {
              expect(err).not.to.be.ok();
              expect(eEvt).to.eql(extendedEvt);
              done();
            });
          });

        });

        describe('defining an id', function () {

          describe('but not passing it in the event', function () {

            it('it should work as expected', function (done) {
              var extendedEvt = { ext: 'evt' };
              var viewM = { my: 'view' };
              var evtExtFn = function (evt, vm) {
                expect(evt.my).to.eql('evt');
                expect(vm).to.eql(viewM);
                expect(vm.id).to.eql('newId');
                return extendedEvt;
              };
              evtExt = api.defineEventExtender({
                name: 'eventName',
                version: 3,
                id: 'id'
              }, evtExtFn);

              evtExt.useCollection({
                name: 'myCol',
                getNewId: function (callback) { callback(null, 'newId'); },
                loadViewModel: function (id, callback) { viewM.id = id; callback(null, viewM); }
              });

              evtExt.extend({ my: 'evt' }, function (err, eEvt) {
                expect(err).not.to.be.ok();
                expect(eEvt).to.eql(extendedEvt);
                done();
              });
            });

          });

          describe('and passing it in the event', function () {

            it('it should work as expected', function (done) {
              var extendedEvt = { ext: 'evt' };
              var viewM = { my: 'view' };
              var evtExtFn = function (evt, vm) {
                expect(evt.my).to.eql('evt');
                expect(vm).to.eql(viewM);
                expect(vm.id).to.eql('idInEvt');
                return extendedEvt;
              };
              evtExt = api.defineEventExtender({
                name: 'eventName',
                version: 3,
                id: 'id'
              }, evtExtFn);

              evtExt.useCollection({
                name: 'myCol',
                getNewId: function (callback) { callback(null, 'newId'); },
                loadViewModel: function (id, callback) { viewM.id = id; callback(null, viewM); }
              });

              evtExt.extend({ my: 'evt', id: 'idInEvt' }, function (err, eEvt) {
                expect(err).not.to.be.ok();
                expect(eEvt).to.eql(extendedEvt);
                done();
              });
            });

          });
          
        });

      });

    });

  });

});
