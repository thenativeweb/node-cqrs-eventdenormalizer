var expect = require('expect.js')
  , async = require('async')
  , _ = require('underscore')
  , repository = require('../lib/databases/inMemory')
  , dummyRepo;

repository = repository.extend({
    getNewViewModel: function(id) {
        return this.fromObject({ id: id, actionOnCommit: 'create', _revision: 1 });
    },
    fromViewModel: function(vm) {
        var obj = _.clone(vm);
        delete obj.actionOnCommit;
        delete obj.destroy;
        delete obj.commit;
        delete obj.set;
        delete obj.get;
        return obj;
    },
    fromObject: function(obj) {
        var vm = _.clone(obj);
        var self = this;
        vm.actionOnCommit = vm.actionOnCommit || 'update';
        vm.destroy = function() {
            this.actionOnCommit = 'delete';
        };
        vm.commit = function(callback) {
            self.commit(this, callback);
        };
        vm.set = function(data) {
            if (arguments.length === 2) {
                this[arguments[0]] = arguments[1];
            } else {
                for(var m in data) {
                    this[m] = data[m];
                }
            }
        };
        vm.get = function(attr) {
            return this[attr];
        };
        return vm;
    }
});

function cleanRepo(done) {
    dummyRepo.find(function(err, results) {
        async.forEach(results, function(item, callback) {
            item.destroy();
            dummyRepo.commit(item, callback);
        }, function(err) {
            if (!err) done();
        });
    });
}

describe('Write-Repository', function() {

    describe('calling connect', function() {

        it('it should callback without an error', function(done) {

            repository.connect(function(err) {
                expect(err).not.to.be.ok();
                done();
            });

        });

    });

    describe('having connected', function() {

        before(function() {
            dummyRepo = repository.extend({
                collectionName: 'dummies'
            });
        });

        beforeEach(function(done) {
            cleanRepo(done);
        });

        it('it should be marked as connected', function() {

            expect(repository.isConnected).to.be.ok();

        });

        describe('calling connect', function() {

            it('it should callback without an error', function(done) {

                dummyRepo.connect(function(err) {
                    expect(err).not.to.be.ok();
                    done();
                });

            });

        });

        describe('calling getNewId', function() {

            it('it should callback with a new Id as string', function(done) {

                dummyRepo.getNewId(function(err, id) {
                    expect(err).not.to.be.ok();
                    expect(id).to.be.an('string');
                    done();
                });

            });

        });

        describe('calling get', function() {        

            describe('without an id', function() {

                it('it should return a new object with a new id', function(done) {

                    dummyRepo.get(function(err, obj) {
                        expect(obj.id).to.be.ok();
                        done();
                    });

                });

                it('the returned object should have an actionOnCommit of create', function(done) {

                    dummyRepo.get('1234', function(err, obj) {
                        expect(obj).to.have.property('actionOnCommit', 'create');
                        done();
                    });

                });

                it('the returned object should have a set and a get and a destroy and a commit function', function(done) {

                    dummyRepo.get('1234', function(err, obj) {
                        expect(obj.set).to.be.a('function');
                        expect(obj.get).to.be.a('function');
                        expect(obj.destroy).to.be.a('function');
                        expect(obj.commit).to.be.a('function');
                        done();
                    });

                });

                it('the returned object should have a revision of 1', function(done) {

                    dummyRepo.get('1234', function(err, obj) {
                        expect(obj).to.have.property('_revision', 1);
                        done();
                    });

                });

            });

            describe('with an id of a non-existing record', function() {

                it('it should return a new object with the given id', function(done) {

                    dummyRepo.get('1234', function(err, obj) {
                        expect(obj.id).to.eql('1234');
                        done();
                    });

                });

                it('the returned object should have an actionOnCommit of create', function(done) {

                    dummyRepo.get('1234', function(err, obj) {
                        expect(obj).to.have.property('actionOnCommit', 'create');
                        done();
                    });

                });

                it('the returned object should have a revision of 1', function(done) {

                    dummyRepo.get('1234', function(err, obj) {
                        expect(obj).to.have.property('_revision', 1);
                        done();
                    });

                });

            });

            describe('with an id of an existing record', function() {

                it('it should return a new object with the data of the record that matches the given id', function(done) {

                    dummyRepo.get('2345', function(err, obj) {
                        obj.foo = 'bar';
                        dummyRepo.commit(obj, function(err) {
                            dummyRepo.get(obj.id, function(err, obj2) {
                                expect(obj2.id).to.eql(obj.id);
                                expect(obj2).to.have.property('foo', obj.foo);
                                done();
                            });
                        });
                    });

                });

                it('the returned object should have an actionOnCommit of update', function(done) {

                    dummyRepo.get('3456', function(err, obj) {
                        obj.foo = 'bar';
                        dummyRepo.commit(obj, function(err) {
                            dummyRepo.get(obj.id, function(err, obj2) {
                                expect(obj2).to.have.property('actionOnCommit', 'update');
                                done();
                            });
                        });
                    });

                });

            });

        });

        describe('calling find', function() {

            describe('without a query object', function() {

                describe('having no records', function() {

                    it('it should return an empty array', function(done) {

                        dummyRepo.find(function(err, results) {
                            expect(results).to.be.an('array');
                            expect(results).to.have.length(0);
                            done();
                        });

                    });

                });

                describe('having any records', function() {

                    beforeEach(function(done) {

                        dummyRepo.get('4567', function(err, vm) {
                            dummyRepo.commit(vm, function(err) {
                                dummyRepo.get('4568', function(err, vm) {
                                    dummyRepo.commit(vm, done);
                                });
                            });
                        });

                    });

                    it('it should return all records within an array', function(done) {

                        dummyRepo.get('4567', function(err, vm1) {
                            dummyRepo.get('4568', function(err, vm2) {
                                dummyRepo.find(function(err, results) {
                                    expect(results).to.have.length(2);
                                    expect(results[0].id).to.eql(vm1.id);
                                    expect(results[1].id).to.eql(vm2.id);
                                    done();
                                });
                            });
                        });

                    });

                    it('the containing objects should  have an actionOnCommit property', function(done) {

                        dummyRepo.get('4567', function(err, vm1) {
                            dummyRepo.get('4568', function(err, vm2) {
                                dummyRepo.find(function(err, results) {
                                    expect(results[0]).to.have.property('actionOnCommit');
                                    expect(results[1]).to.have.property('actionOnCommit');
                                    done();
                                });
                            });
                        });

                    });

                    it('the containing objects should have a set and a get and a destroy and a commit function', function(done) {

                        dummyRepo.get('4567', function(err, vm1) {
                            dummyRepo.get('4568', function(err, vm2) {
                                dummyRepo.find(function(err, results) {
                                    expect(results[0].set).to.be.a('function');
                                    expect(results[1].set).to.be.a('function');
                                    expect(results[0].get).to.be.a('function');
                                    expect(results[1].get).to.be.a('function');
                                    expect(results[0].destroy).to.be.a('function');
                                    expect(results[1].destroy).to.be.a('function');
                                    expect(results[0].commit).to.be.a('function');
                                    expect(results[1].commit).to.be.a('function');
                                    done();
                                });
                            });
                        });

                    });

                });

            });

            describe('with a query object', function() {

                describe('having no records', function() {

                    it('it should return an empty array', function(done) {

                        dummyRepo.find({}, function(err, results) {
                            expect(results).to.be.an('array');
                            expect(results).to.have.length(0);
                            done();
                        });

                    });

                });

                describe('having any records', function() {

                    beforeEach(function(done) {

                        dummyRepo.get('4567', function(err, vm) {
                            vm.foo = 'bar';

                            dummyRepo.commit(vm, function(err) {
                                dummyRepo.get('4568', function(err, vm2) {

                                    vm2.foo = 'wat';
                                    dummyRepo.commit(vm2, done);
                                });
                            });
                        });

                    });

                    describe('not matching the query object', function() {

                        it('it should return an empty array', function(done) {

                            dummyRepo.find({ foo: 'bas' }, function(err, results) {
                                expect(results).to.be.an('array');
                                expect(results).to.have.length(0);
                                done();
                            });

                        });

                    });

                    describe('matching the query object', function() {

                        it('it should return all matching records within an array', function(done) {

                            dummyRepo.find({ foo: 'bar' }, function(err, results) {
                                expect(results).to.be.an('array');
                                expect(results).to.have.length(1);
                                done();
                            });

                        });

                    });

                    describe('matching the query object, that queries an array', function() {

                        beforeEach(function(done) {

                            dummyRepo.get('4567', function(err, vm) {
                                vm.foos = [ {foo: 'bar' } ];
                                dummyRepo.commit(vm, done);
                            });

                        });

                        it('it should return all matching records within an array', function(done) {

                            dummyRepo.find({ 'foos.foo': 'bar' }, function(err, results) {
                                expect(results).to.be.an('array');
                                expect(results).to.have.length(1);
                                done();
                            });

                        });

                    });

                });

            });

        });

        describe('calling commit', function() {

            describe('with a single object', function() {

                describe('not having an actionOnCommit', function() {

                    it('it should not modify the view model database', function(done) {

                        var obj = {
                            foo: 'bar'
                        };

                        dummyRepo.commit(obj, function(err) {
                            dummyRepo.find(function(err, results) {
                                expect(results).to.be.an('array');
                                expect(results).to.have.length(0);
                                done();
                            });
                        });

                    });

                    it('it should callback with error', function(done) {

                        var obj = {
                            foo: 'bar'
                        };

                        dummyRepo.commit(obj, function(err) {
                            expect(err).to.be.ok();
                            done();
                        });

                    });

                });

                describe('having an invalid actionOnCommit', function() {

                    it('it should not modify the view model database', function(done) {

                        var obj = {
                            actionOnCommit: 'nufta',
                            foo: 'bar'
                        };

                        dummyRepo.commit(obj, function(err) {
                            dummyRepo.find(function(err, results) {
                                expect(results).to.be.an('array');
                                expect(results).to.have.length(0);
                                done();
                            });
                        });

                    });

                    it('it should callback with error', function(done) {

                        var obj = {
                            actionOnCommit: 'nufta',
                            foo: 'bar'
                        };

                        dummyRepo.commit(obj, function(err) {
                            expect(err).to.be.ok();
                            done();
                        });

                    });

                });

                describe('having an actionOnCommit', function() {

                    beforeEach(function(done) {

                        dummyRepo.get('4567', function(err, vm) {
                            vm.foo = 'bar';

                            dummyRepo.commit(vm, function(err) {
                                dummyRepo.get('4568', function(err, vm2) {

                                    vm2.foo = 'wat';
                                    dummyRepo.commit(vm2, done);
                                });
                            });
                        });

                    });

                    describe('of create', function() {

                        describe('on an existing record', function() {

                            it('it should update the existing record', function(done) {

                                dummyRepo.get('4567', function(err, vm) {
                                    vm.actionOnCommit = 'create';
                                    vm.foo = 'baz';
                                    dummyRepo.commit(vm, function(err) {
                                        dummyRepo.get('4567', function(err, vm2) {
                                            vm.actionOnCommit = 'update';
                                            expect(vm2.id).to.eql(vm.id);
                                            expect(vm2.foo).to.eql(vm.foo);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                        describe('on a non-existing record', function() {

                            it('it should insert a new record', function(done) {

                                dummyRepo.get('4569', function(err, vm) {
                                    vm.foo = 'baz';
                                    dummyRepo.commit(vm, function(err) {
                                        dummyRepo.get('4569', function(err, vm2) {
                                            vm.actionOnCommit = 'update';
                                            expect(vm2.id).to.eql(vm.id);
                                            expect(vm2.foo).to.eql(vm.foo);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                    });

                    describe('of update', function() {

                        describe('on a non-existing record', function() {

                            it('it should insert a new record', function(done) {

                                dummyRepo.get('4569', function(err, vm) {
                                    vm.actionOnCommit = 'update';
                                    vm.foo = 'baz';
                                    dummyRepo.commit(vm, function(err) {
                                        dummyRepo.get('4569', function(err, vm2) {
                                            expect(vm2.id).to.eql(vm.id);
                                            expect(vm2.foo).to.eql(vm.foo);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                        describe('on an existing record', function() {

                            it('it should update the existing record', function(done) {

                                dummyRepo.get('4567', function(err, vm) {
                                    vm.foo = 'baz';
                                    dummyRepo.commit(vm, function(err) {
                                        dummyRepo.get('4567', function(err, vm2) {
                                            expect(vm2.id).to.eql(vm.id);
                                            expect(vm2.foo).to.eql(vm.foo);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                    });

                    describe('of delete', function() {

                        describe('on a non-existing record', function() {

                            it('it should not modify the view model database', function(done) {

                                dummyRepo.get('4567', function(err, vm) {
                                    vm.id = '4569';
                                    vm.destroy();

                                    dummyRepo.commit(vm, function(err) {
                                        dummyRepo.find(function(err, results) {
                                            expect(results).to.be.an('array');
                                            expect(results).to.have.length(2);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                        describe('on an existing record', function() {

                            it('it should delete the existing record', function(done) {

                                dummyRepo.get('4567', function(err, vm) {
                                    vm.destroy();

                                    dummyRepo.commit(vm, function(err) {
                                        dummyRepo.find(function(err, results) {
                                            expect(results).to.be.an('array');
                                            expect(results).to.have.length(1);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                    });

                });

            });

            describe('on a single object', function() {

                describe('having an actionOnCommit', function() {

                    beforeEach(function(done) {

                        dummyRepo.get('4567', function(err, vm) {
                            vm.foo = 'bar';

                            dummyRepo.commit(vm, function(err) {
                                dummyRepo.get('4568', function(err, vm2) {

                                    vm2.foo = 'wat';
                                    dummyRepo.commit(vm2, done);
                                });
                            });
                        });

                    });

                    describe('of create', function() {

                        describe('on an existing record', function() {

                            it('it should update the existing record', function(done) {

                                dummyRepo.get('4567', function(err, vm) {
                                    vm.actionOnCommit = 'create';
                                    vm.foo = 'baz';
                                    vm.commit(function(err) {
                                        dummyRepo.get('4567', function(err, vm2) {
                                            vm.actionOnCommit = 'update';
                                            expect(vm2.id).to.eql(vm.id);
                                            expect(vm2.foo).to.eql(vm.foo);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                        describe('on a non-existing record', function() {

                            it('it should insert a new record', function(done) {

                                dummyRepo.get('4569', function(err, vm) {
                                    vm.foo = 'baz';
                                    vm.commit(function(err) {
                                        dummyRepo.get('4569', function(err, vm2) {
                                            vm.actionOnCommit = 'update';
                                            expect(vm2.id).to.eql(vm.id);
                                            expect(vm2.foo).to.eql(vm.foo);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                    });

                    describe('of update', function() {

                        describe('on a non-existing record', function() {

                            it('it should insert a new record', function(done) {

                                dummyRepo.get('4569', function(err, vm) {
                                    vm.actionOnCommit = 'update';
                                    vm.foo = 'baz';
                                    vm.commit(function(err) {
                                        dummyRepo.get('4569', function(err, vm2) {
                                            expect(vm2.id).to.eql(vm.id);
                                            expect(vm2.foo).to.eql(vm.foo);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                        describe('on an existing record', function() {

                            it('it should update the existing record', function(done) {

                                dummyRepo.get('4567', function(err, vm) {
                                    vm.foo = 'baz';
                                    vm.commit(function(err) {
                                        dummyRepo.get('4567', function(err, vm2) {
                                            expect(vm2.id).to.eql(vm.id);
                                            expect(vm2.foo).to.eql(vm.foo);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                    });

                    describe('of delete', function() {

                        describe('on a non-existing record', function() {

                            it('it should not modify the view model database', function(done) {

                                dummyRepo.get('4567', function(err, vm) {
                                    vm.id = '4569';
                                    vm.destroy();

                                    vm.commit(function(err) {
                                        dummyRepo.find(function(err, results) {
                                            expect(results).to.be.an('array');
                                            expect(results).to.have.length(2);
                                            done();
                                        });
                                    });
                                });

                            });

                        });

                        describe('on an existing record', function() {

                            it('it should delete the existing record', function(done) {

                                dummyRepo.get('4567', function(err, vm) {
                                    vm.destroy();

                                    vm.commit(function(err) {
                                        dummyRepo.find(function(err, results) {
                                            expect(results).to.be.an('array');
                                            expect(results).to.have.length(1);
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