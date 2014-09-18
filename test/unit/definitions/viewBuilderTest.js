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
  
  });

});
