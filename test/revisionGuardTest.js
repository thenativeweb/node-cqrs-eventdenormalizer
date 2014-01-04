var expect = require('expect.js')
  , async = require('async')
  , revisionGuard = require('../lib/revisionGuard')
  , revisionGuardStore = require('../lib/revisionGuardStore')
  , eventDispatcher = require('../lib/eventDispatcher')
  , eventEmitter = require('../lib/eventEmitter')
  , guardStore;

describe('RevisionGuard', function() {

    before(function(done) {
        revisionGuardStore.connect(function(err, revGuardStore) {
            guardStore = revGuardStore;
            revisionGuard.configure(function() {
                this.use(eventDispatcher);
                this.use(revGuardStore);
            });
            done();
        });
    });

    describe('being initialized', function() {

        before(function(done) {
            guardStore.clear(function() {
                revisionGuard.initialize(done);
            });
        });

        describe('calling guard', function() {

            var evt;

            beforeEach(function() {
                evt = {
                    id: '82517',
                    event: 'dummyChanged',
                    head: {
                        revision: 1
                    },
                    payload: {
                        id: '237891231234124212'
                    }
                };
            });

            it('it should callback with success', function(done) {
                evt.head.revision = 1;

                revisionGuard.guard(evt, function(err) {
                    expect(err).not.to.be.ok();
                    done();
                });
            });

            it('the guardStore should contain the correct revision', function(done) {
                evt.head.revision = 2;

                revisionGuard.guard(evt, function(err) {
                    guardStore.getRevision(evt.payload.id, function(err, entry) {
                        expect(entry.revision).to.eql(3);
                        done();
                    });
                });
            });

        });

    });

});