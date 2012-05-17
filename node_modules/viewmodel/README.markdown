# Introduction

[![Build Status](https://secure.travis-ci.org/adrai/node-viewmodel.png)](http://travis-ci.org/adrai/node-viewmodel)

Node-viewmodel is a node.js module for multiple databases.
It can be very useful if you work with (d)ddd, cqrs, eventdenormalizer, host, etc.

# Installation

    $ npm install viewmodel

# Usage

## Connecting to an in-memory repository in read mode

	var repo = require('viewmodel').read;

	repo.init(function(err) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }
    });

## Connecting to any repository (mongodb in the example / mode=write)
Make shure you have installed the required driver, in this example run: 'npm install mongodb'.

    var repo = require('viewmodel').write;

    repo.init(
        {
            type: 'mongoDb',
            host: 'localhost',      // optional
            port: 27017,            // optional
            dbName: 'viewmodel',    // optional
            collectionName: 'dummy',// optional and only if you directly want to use a collection, so repo.extend() is not necessary...
        }, 
        function(err) {
            if(err) {
                console.log('ohhh :-(');
                return;
            }
        }
    );

## Define a collection...

    var dummyRepo = repo.extend({
        collectionName: 'dummy'
    });

## Create a new viewmodel (only in write mode)

    dummyRepo.get(function(err, vm) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        vm.set('myProp', 'myValue');
        vm.color = 'green';

        dummyRepo.commit(vm, function(err) {
        });
        // or you can call commit directly on vm...
        vm.commit(function(err) {
        });
    });

## Find...

    // the query object ist like in mongoDb...
    dummyRepo.find({ color: 'green' }, function(err, vms) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        // vms is an array of all what is in the repository
        var firstItem = vms[0];
        console.log('the id: ' + firstItem.id);
        console.log('the saved value: ' + firstItem.color);
    });

## Find by id...

    // the query object ist like in mongoDb...
    dummyRepo.get('myId', function(err, vm) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        console.log('the id: ' + vm.id);
        console.log('the saved value: ' + vm.color);
    });

## Delete a viewmodel (only in write mode)

    dummyRepo.get('myId', function(err, vm) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        vm.destroy();

        dummyRepo.commit(vm, function(err) {
        });
        // or you can call commit directly on vm...
        vm.commit(function(err) {
        });
    });

## Obtain a new id

    myQueue.getNewId(function(err, newId) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        console.log('the new id is: ' + newId);
    });


# Database Support
Currently these databases are supported:

1. inMemory
2. mongoDb ([node-mongodb-native] (https://github.com/mongodb/node-mongodb-native))

# License

Copyright (c) 2012 Adriano Raiano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.