# Introduction

[![travis](https://img.shields.io/travis/adrai/node-cqrs-eventdenormalizer.svg)](https://travis-ci.org/adrai/node-cqrs-eventdenormalizer) [![npm](https://img.shields.io/npm/v/cqrs-eventdenormalizer.svg)](https://npmjs.org/package/cqrs-eventdenormalizer)

Node-cqrs-eventdenormalizer is a node.js module that implements the cqrs pattern.
It can be very useful as eventdenormalizer component if you work with (d)ddd, cqrs, domain, host, etc.

# Installation

    npm install cqrs-eventdenormalizer

# Usage

	var denormalizer = require('cqrs-eventdenormalizer')({
	  // the path to the "working directory"
	  // can be structured like
	  // [set 1](https://github.com/adrai/node-cqrs-eventdenormalizer/tree/master/test/integration/fixture/set1) or
	  // [set 2](https://github.com/adrai/node-cqrs-eventdenormalizer/tree/master/test/integration/fixture/set2)
	  denormalizerPath: '/path/to/my/files',
	  
	  // optional, default is 'commandRejected'
	  // will be used to catch AggregateDestroyedError from cqrs-domain
	  commandRejectedEventName: 'rejectedCommand',
	  
	  // optional, default is 800
	  // if using in scaled systems, this module tries to catch the concurrency issues and
	  // retries to handle the event after a timeout between 0 and the defined value
	  retryOnConcurrencyTimeout: 1000,
	  
	  // optional, default is in-memory
	  // currently supports: mongodb, redis, tingodb, couchdb and inmemory
	  // hint: [viewmodel](https://github.com/adrai/node-viewmodel#connecting-to-any-repository-mongodb-in-the-example--modewrite)
	  // hint settings like: [eventstore](https://github.com/adrai/node-eventstore#provide-implementation-for-storage)
	  repository: {
	    type: 'mongodb',
	    host: 'localhost',                          // optional
	    port: 27017,                                // optional
	    dbName: 'readmodel',                        // optional
	    timeout: 10000                              // optional
	    // username: 'technicalDbUser',                // optional
	    // password: 'secret'                          // optional
	  },
     	  
	  // optional, default is in-memory
	  // currently supports: mongodb, redis, tingodb and inmemory
	  // hint settings like: [eventstore](https://github.com/adrai/node-eventstore#provide-implementation-for-storage)
	  revisionGuard: {
	    queueTimeout: 1000,                         // optional, timeout for non-handled events in the internal in-memory queue
	    queueTimeoutMaxLoops: 3                     // optional, maximal loop count for non-handled event in the internal in-memory queue
	    
	    type: 'redis',
	    host: 'localhost',                          // optional
	    port: 6379,                                 // optional
	    db: 0,                                      // optional
	    prefix: 'readmodel_revision',               // optional
	    timeout: 10000                              // optional
	    // password: 'secret'                          // optional
	  }
	});


[Release notes](https://github.com/adrai/node-cqrs-eventdenormalizer/blob/master/releasenotes.md)


# License

Copyright (c) 2014 Adriano Raiano

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
