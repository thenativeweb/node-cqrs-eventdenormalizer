# Introduction

[![Build Status](https://secure.travis-ci.org/adrai/node-cqrs-eventdenormalizer.png)](http://travis-ci.org/adrai/node-cqrs-eventdenormalizer)

Node-cqrs-eventdenormalizer is a node.js module that implements the cqrs pattern.
It can be very useful as eventdenormalizer component if you work with (d)ddd, cqrs, domain, host, etc.

# Installation

    $ npm install cqrs-eventdenormalizer

# Usage

## Initialization

	var contextEventDenormalizer = require('cqrs-eventdenormalizer').contextEventDenormalizer;

	contextEventDenormalizer.on('event', function(evt) {
        // send to clients
    });
    contextEventDenormalizer.initialize({
        denormalizersPath: __dirname + '/eventDenormalizers',
        extendersPath: __dirname + '/eventExtenders',
        ignoreRevision: false,
        disableQueuing: false
    }, function(err) {

    });

    contextEventDenormalizer.denormalize({ id: 'msgId', event: 'dummyChanged', payload: { id: '23445' } }, function(err) {

    });

## Define eventdenormalizers...

    var base = require('node-cqrs-eventdenormalizer').eventDenormalizerBase;

    module.exports = base.extend({

        events: ['dummied', {'dummyCreated': 'create'}, {'dummyChanged': 'update'}, {'dummyDeleted': 'delete'}],
        collectionName: 'dummies',

        dummied: function(evt, aux, callback) {
            callback(null);
        }

    });

See [tests](https://github.com/adrai/node-cqrs-eventdenormalizer/tree/master/test) for detailed information...


# Release Notes

## v0.2.4

- added disableQueuing and ignoreRevision flag


# License

Copyright (c) 2013 Adriano Raiano

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