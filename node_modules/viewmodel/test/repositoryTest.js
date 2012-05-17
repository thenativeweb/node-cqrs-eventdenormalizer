var expect = require('expect.js')
  , repository = require('../lib/repository');

describe('Repository', function() {

	describe('calling init', function() {

		describe('on read (or write)', function() {

			var read = repository.read;

			it('it should have marked as connected', function(done) {

				read.init(function(err) {
					expect(read.isConnected).to.be.ok();
					done();
				});

			});

			describe('without options', function() {

				it('it should callback without an error', function(done) {

					read.init(function(err) {
						expect(err).not.to.be.ok();
						done();
					});

				});

			});

			describe('with options containing a type property with the value of', function() {

				describe('an existing db implementation', function() {

					it('it should callback without an error', function(done) {

						read.init({ type: 'inMemory' }, function(err) {
							expect(err).not.to.be.ok();
							done();
						});

					});

				});

				describe('a non existing db implementation', function() {

					it('it should callback with an error', function(done) {

						read.init({ type: 'strangeDb' }, function(err) {
							expect(err).to.be.ok();
							done();
						});

					});

				});

			});

		});

	});

});