var expect = require('expect.js')
  , async = require('async')
  , _ = require('underscore')
  , repository = require('../lib/databases/inMemory')
  , dummyRepo;

function setRead() {
    dummyRepo.getNewViewModel = function(id) {
        return null;
    };
    dummyRepo.fromViewModel = function(vm) {
        var obj = _.clone(vm);
        delete obj.actionOnCommit;
        delete obj.destroy;
        delete obj.commit;
        delete obj.set;
        delete obj.get;
        return obj;
    };
    dummyRepo.fromObject = function(obj) {
        return obj;
    };
}

function setWrite() {
    dummyRepo.getNewViewModel = function(id) {
        return this.fromObject({ id: id, actionOnCommit: 'create', _revision: 1 });
    };
    dummyRepo.fromViewModel = function(vm) {
        var obj = _.clone(vm);
        delete obj.actionOnCommit;
        delete obj.destroy;
        delete obj.commit;
        delete obj.set;
        delete obj.get;
        return obj;
    };
    dummyRepo.fromObject = function(obj) {
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
    };
}

function cleanRepo(done) {
    setWrite();
    dummyRepo.find(function(err, results) {
        async.forEach(results, function(item, callback) {
            item.destroy();
            dummyRepo.commit(item, callback);
        }, function(err) {
            setRead();
            if (!err) done();
        });
    });
}

describe('Read-Repository', function() {

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
            setRead();
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

                it('it should return null', function(done) {

                    dummyRepo.get(function(err, obj) {
                        expect(obj).to.not.be.ok();
                        done();
                    });

                });

            });

            describe('with an id of a non-existing record', function() {

                it('it should return null', function(done) {

                    dummyRepo.get('1234', function(err, obj) {
                        expect(obj).to.not.be.ok();
                        done();
                    });

                });

            });

            describe('with an id of an existing record', function() {

                it('it should return a new object with the data of the record that matches the given id', function(done) {

                    setWrite();
                    dummyRepo.get('2345', function(err, obj) {
                        obj.foo = 'bar';
                        dummyRepo.commit(obj, function(err) {
                            setRead();
                            dummyRepo.get(obj.id, function(err, obj2) {
                                expect(obj2.id).to.eql(obj.id);
                                expect(obj2).to.have.property('foo', obj.foo);
                                done();
                            });
                        });
                    });

                });

                it('the returned object should not have an actionOnCommit property', function(done) {

                    setWrite();
                    dummyRepo.get('3456', function(err, obj) {
                        obj.foo = 'bar';
                        dummyRepo.commit(obj, function(err) {
                            setRead();
                            dummyRepo.get(obj.id, function(err, obj2) {
                                expect(obj2).to.not.have.property('actionOnCommit');
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

                        setWrite();
                        dummyRepo.get('4567', function(err, vm) {
                            dummyRepo.commit(vm, function(err) {
                                dummyRepo.get('4568', function(err, vm) {
                                    dummyRepo.commit(vm, function(err) {
                                        setRead();
                                        done();
                                    });
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

                    it('the containing objects should not have an actionOnCommit property', function(done) {

                        dummyRepo.get('4567', function(err, vm1) {
                            dummyRepo.get('4568', function(err, vm2) {
                                dummyRepo.find(function(err, results) {
                                    expect(results[0]).to.not.have.property('actionOnCommit');
                                    expect(results[1]).to.not.have.property('actionOnCommit');
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

                        setWrite();
                        dummyRepo.get('4567', function(err, vm) {
                            vm.foo = 'bar';

                            dummyRepo.commit(vm, function(err) {
                                dummyRepo.get('4568', function(err, vm2) {

                                    vm2.foo = 'wat';
                                    dummyRepo.commit(vm2, function(err) {
                                        setRead();
                                        done();
                                    });
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

                            setWrite();
                            dummyRepo.get('4567', function(err, vm) {
                                vm.foos = [ {foo: 'bar' } ];
                                dummyRepo.commit(vm, function(err) {
                                    setRead();
                                    done();
                                });
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

            it('it should return an error', function(done) {

                dummyRepo.commit({}, function(err) {
                    expect(err).to.be.ok();
                    done();
                });

            });

        });

    });

});