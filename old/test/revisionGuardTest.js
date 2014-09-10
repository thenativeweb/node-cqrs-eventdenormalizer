var expect = require('expect.js')
  , async = require('async')
  , revisionGuard = require('../lib/revisionGuard')
  , revisionGuardStore = require('../lib/revisionGuardStore')
  , eventDispatcher = require('../lib/eventDispatcher')
  , eventEmitter = require('../lib/eventEmitter')
  , queue = require('node-queue')
  , eventQueue
  , guardStore;

describe('RevisionGuard', function() {

    before(function(done) {
        queue.createQueue(function(err, evtQueue) {
            eventQueue = evtQueue;
            eventDispatcher.configure(function() {
                this.use(eventQueue);
            });

            revisionGuardStore.connect({ revisionStart: null }, function(err, revGuardStore) {
                guardStore = revGuardStore;
                revisionGuard.configure(function() {
                    this.use(eventDispatcher);
                    this.use(revGuardStore);
                    this.use(eventQueue);
                });
                done();
            });
        });
    });

    describe('being initialized', function() {

        before(function(done) {
            guardStore.clear(function() {
                revisionGuard.initialize({ queueTimeout: 500 }, done);
            });
        });

        describe('calling guard', function() {

            var evt;

            beforeEach(function() {
                evt = {
                    id: '82517',
                    event: 'dummyChanged',
                    head: {
                        revision: 15
                    },
                    payload: {
                        id: '237891231234124212'
                    }
                };
            });

            it('it should callback with success', function(done) {
                evt.head.revision = 15;

                revisionGuard.guard(evt, function(err) {
                    expect(err).not.to.be.ok();
                    done();
                });
            });

            it('the guardStore should contain the correct revision', function(done) {
                evt.head.revision = 16;

                revisionGuard.guard(evt, function(err) {
                    guardStore.getRevision(evt.payload.id, function(err, entry) {
                        expect(entry.revision).to.eql(17);
                        done();
                    });
                });
            });

        });

    });

});