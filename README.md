# Introduction

[![travis](https://img.shields.io/travis/adrai/node-cqrs-eventdenormalizer.svg)](https://travis-ci.org/adrai/node-cqrs-eventdenormalizer) [![npm](https://img.shields.io/npm/v/cqrs-eventdenormalizer.svg)](https://npmjs.org/package/cqrs-eventdenormalizer)

Node-cqrs-eventdenormalizer is a node.js module that implements the cqrs pattern.
It can be very useful as eventdenormalizer component if you work with (d)ddd, cqrs, domain, host, etc.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
  - [Catch connect ad disconnect events](#catch-connect-ad-disconnect-events)
  - [Define the event structure](#define-the-event-structure)
  - [Define the notification structure](#define-the-notification-structure)
  - [Define the id generator function [optional]](#define-the-id-generator-function-optional)
    - [you can define a synchronous function](#you-can-define-a-synchronous-function)
    - [or you can define an asynchronous function](#or-you-can-define-an-asynchronous-function)
  - [Wire up events [optional]](#wire-up-events-optional)
    - [you can define a synchronous function](#you-can-define-a-synchronous-function-1)
    - [or you can define an asynchronous function](#or-you-can-define-an-asynchronous-function-1)
  - [Wire up notifications [optional]](#wire-up-notifications-optional)
    - [you can define a synchronous function](#you-can-define-a-synchronous-function-2)
    - [or you can define an asynchronous function](#or-you-can-define-an-asynchronous-function-2)
  - [Wire up event missing [optional]](#wire-up-event-missing-optional)
    - [you can define a synchronous function](#you-can-define-a-synchronous-function-3)
  - [Define default event extension [optional]](#define-default-event-extension-optional)
    - [you can define a synchronous function](#you-can-define-a-synchronous-function-4)
    - [or you can define an asynchronous function](#or-you-can-define-an-asynchronous-function-3)
  - [Initialization](#initialization)
  - [Handling an event](#handling-an-event)
    - [or](#or)
  - [Request denormalizer information](#request-denormalizer-information)
- [Components definition](#components-definition)
  - [Collection](#collection)
  - [ViewBuilder](#viewbuilder)
    - [ViewBuilder for multiple viewmodels in a collection](#viewbuilder-for-multiple-viewmodels-in-a-collection)
  - [EventExtender](#eventextender)
    - [for a collection (in a collection folder)](#for-a-collection-in-a-collection-folder)
    - [not for a collection](#not-for-a-collection)
  - [Replay events](#replay-events)
    - [streamed](#streamed)
    - [if you want to clear the readModel before replaying...](#if-you-want-to-clear-the-readmodel-before-replaying)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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
	  // currently supports: mongodb, redis, tingodb, couchdb, azuretable, dynamodb and inmemory
	  // hint: [viewmodel](https://github.com/adrai/node-viewmodel#connecting-to-any-repository-mongodb-in-the-example--modewrite)
	  // hint settings like: [eventstore](https://github.com/adrai/node-eventstore#provide-implementation-for-storage)
	  repository: {
	    type: 'mongodb',
	    host: 'localhost',                          // optional
	    port: 27017,                                // optional
	    dbName: 'readmodel',                        // optional
	    timeout: 10000                              // optional
      // authSource: 'authedicationDatabase',        // optional
	    // username: 'technicalDbUser',                // optional
	    // password: 'secret'                          // optional
      // url: 'mongodb://user:pass@host:port/db?opts // optional
	  },

	  // optional, default is in-memory
	  // currently supports: mongodb, redis, tingodb, dynamodb and inmemory
	  // hint settings like: [eventstore](https://github.com/adrai/node-eventstore#provide-implementation-for-storage)
	  revisionGuard: {
	    queueTimeout: 1000,                         // optional, timeout for non-handled events in the internal in-memory queue
	    queueTimeoutMaxLoops: 3,                    // optional, maximal loop count for non-handled event in the internal in-memory queue
	    startRevisionNumber: 1,			// optional, if defined the denormaizer waits for an event with that revision to be used as first event

	    type: 'redis',
	    host: 'localhost',                          // optional
	    port: 6379,                                 // optional
	    db: 0,                                      // optional
	    prefix: 'readmodel_revision',               // optional
	    timeout: 10000                              // optional
	    // password: 'secret'                          // optional
	  }
	});


## Catch connect ad disconnect events

	// repository
	denormalizer.repository.on('connect', function() {
	  console.log('repository connected');
	});

	denormalizer.repository.on('disconnect', function() {
	  console.log('repository disconnected');
	});

	// revisionGuardStore
	denormalizer.revisionGuardStore.on('connect', function() {
	  console.log('revisionGuardStore connected');
	});

	denormalizer.revisionGuardStore.on('disconnect', function() {
	  console.log('revisionGuardStore disconnected');
	});


	// anything (repository or revisionGuardStore)
	denormalizer.on('connect', function() {
	  console.log('something connected');
	});

	denormalizer.on('disconnect', function() {
	  console.log('something disconnected');
	});


## Define the event structure
The values describes the path to that property in the event message.

	denormalizer.defineEvent({
	  // optional, default is 'correlationId'
	  // will use the command id as correlationId, so you can match it in the sender
	  // will be used to copy the correlationId to the notification
	  correlationId: 'correlationId',

	  // optional, default is 'id'
	  id: 'id',

	  // optional, default is 'name'
	  name: 'name',

	  // optional, default is 'aggregate.id'
	  aggregateId: 'aggregate.id',

	  // optional
	  context: 'context.name',

	  // optional
	  aggregate: 'aggregate.name',

	  // optional, default is 'payload'
	  payload: 'payload',

	  // optional, default is 'revision'
	  // will represent the aggregate revision, can be used in next command
	  revision: 'revision',

	  // optional
	  version: 'version',

	  // optional, if defined the values of the command will be copied to the event (can be used to transport information like userId, etc..)
	  meta: 'meta'
	});


## Define the notification structure
The values describes the path to that property in the notification message.

	denormalizer.defineNotification({
	  // optional, default is 'correlationId'
	  // will use the command id as correlationId, so you can match it in the sender
	  // will be used to copy the correlationId from the event
	  correlationId: 'correlationId',

	  // optional, default is 'id'
	  id: 'id',

	  // optional, default is 'name'
	  action: 'name',

	  // optional, default is 'collection'
	  collection: 'collection',

	  // optional, default is 'payload'
	  payload: 'payload',

	  // optional, will be copied from event
	  aggregateId: 'meta.aggregate.id',

	  // optional, will be copied from event
	  context: 'meta.context.name',

	  // optional, will be copied from event
	  aggregate: 'meta.aggregate.name',

	  // optional, will be copied from event
	  // will represent the aggregate revision, can be used in next command
	  revision: 'meta.aggregate.revision',

	  // optional, will be copied from event
	  eventId: 'meta.event.id',

	  // optional, will be copied from event
	  event: 'meta.event.name',

	  // optional, if defined the values of the event will be copied to the notification (can be used to transport information like userId, etc..)
	  meta: 'meta'
	});


## Define the id generator function [optional]
### you can define a synchronous function

	denormalizer.idGenerator(function () {
	  var id = require('uuid').v4().toString();
	  return id;
	});

### or you can define an asynchronous function

	denormalizer.idGenerator(function (callback) {
	  setTimeout(function () {
	    var id = require('uuid').v4().toString();
	    callback(null, id);
	  }, 50);
	});


## Wire up events [optional]
### you can define a synchronous function

	// pass events to bus
	denormalizer.onEvent(function (evt) {
	  bus.emit('event', evt);
	});

### or you can define an asynchronous function

	// pass events to bus
	denormalizer.onEvent(function (evt, callback) {
	  bus.emit('event', evt, function ack () {
	    callback();
	  });
	});


## Wire up notifications [optional]
### you can define a synchronous function

	// pass notifications to bus
	denormalizer.onNotification(function (noti) {
	  bus.emit('event', evt);
	});

### or you can define an asynchronous function

	// pass notifications to bus
	denormalizer.onNotification(function (noti, callback) {
	  bus.emit('notification', noti, function ack () {
	    callback();
	  });
	});


## Wire up event missing [optional]
### you can define a synchronous function

	denormalizer.onEventMissing(function (info, evt) {
	  console.log(info);
	  console.log(evt);
	});


## Define default event extension [optional]
### you can define a synchronous function

	denormalizer.defaultEventExtension(function (evt) {
	  evt.receiver = [evt.meta.userId];
	  return evt;
	});

### or you can define an asynchronous function

	denormalizer.defaultEventExtension(function (evt, callback) {
	  evt.receiver = [evt.meta.userId];
	  callback(null, evt);
	});


## Initialization

	denormalizer.init(function (err, warnings) {
	  // this callback is called when all is ready...
	  // warnings: if no warnings warnings is null, else it's an array containing errors during require of files
	});

	// or

	denormalizer.init(); // callback is optional


## Handling an event

	denormalizer.handle({
	  id: 'b80ade36-dd05-4340-8a8b-846eea6e286f',
	  correlationId: 'c80ada33-dd05-4340-8a8b-846eea6e151d',
	  name: 'enteredNewPerson',
	  aggregate: {
	    id: '3b4d44b0-34fb-4ceb-b212-68fe7a7c2f70',
	    name: 'person'
	  },
	  context: {
	    name: 'hr'
	  },
	  payload: {
	    firstname: 'Jack',
	    lastname: 'Huston'
	  },
	  revision: 1,
	  version: 0,
	  meta: {
	    userId: 'ccd65819-4da4-4df9-9f24-5b10bf89ef89'
	  }
	}); // callback is optional

### or

	denormalizer.handle({
	  id: 'b80ade36-dd05-4340-8a8b-846eea6e286f',
	  correlationId: 'c80ada33-dd05-4340-8a8b-846eea6e151d',
	  name: 'enteredNewPerson',
	  aggregate: {
	    id: '3b4d44b0-34fb-4ceb-b212-68fe7a7c2f70',
	    name: 'person'
	  },
	  context: {
	    name: 'hr'
	  },
	  payload: {
	    firstname: 'Jack',
	    lastname: 'Huston'
	  },
	  revision: 1,
	  version: 0,
	  meta: {
	    userId: 'ccd65819-4da4-4df9-9f24-5b10bf89ef89'
	  }
	}, function (errs, evt, notifications) {
	  // this callback is called when event is handled successfully or unsuccessfully
	  // errs can be of type:
	  // - null
	  // - Array of Errors
	  //
	  // evt: same as passed in 'onEvent' function
	  //
	  // notifications: Array of viewmodel changes
	});


## Request denormalizer information

After the initialization you can request the denormalizer information:

	denorm.init(function (err) {
	  denorm.getInfo();
	  // ==>
	  // {
	  //   "collections": [
	  //     {
	  //       "name": "person",
	  //       "viewBuilders": [
	  //         {
	  //           "name": "enteredNewPerson",
	  //           "aggregate": "person",
	  //           "context": "hr",
	  //           "version": 2,
      //           "priority": 223
	  //         },
	  //         {
	  //           "name": "registeredEMailAddress",
	  //           "aggregate": "person",
	  //           "context": "hr",
	  //           "version": 2,
      //           "priority": 312
	  //         }
	  //       ],
	  //       "eventExtenders": [
	  //         {
	  //           "name": "enteredNewPerson",
	  //           "aggregate": "person",
	  //           "context": "hr",
	  //           "version": 2
	  //         }
	  //       ],
	  //       "preEventExtenders": [
	  //         {
	  //           "name": "enteredNewPerson",
	  //           "aggregate": "person",
	  //           "context": "hr",
	  //           "version": 2
	  //         }
	  //       ]
	  //     },
	  //     {
	  //       "name": "personDetail",
	  //       "viewBuilders": [
	  //         {
	  //           "name": "enteredNewPerson",
	  //           "aggregate": "person",
	  //           "context": "hr",
	  //           "version": 2,
      //           "priority": 110
	  //         },
	  //         {
	  //           "name": "registeredEMailAddress",
	  //           "aggregate": "person",
	  //           "context": "hr",
	  //           "version": 2,
      //           "priority": Infinity
	  //         }
	  //       ],
	  //       "eventExtenders": [],
	  //       "preEventExtenders": []
	  //     }
	  //   ],
	  //   "generalEventExtenders": [
	  //     {
	  //       "name": "",
	  //       "aggregate": null,
	  //       "context": null,
	  //       "version": -1
	  //     }
	  //   ],
	  //   "generalPreEventExtenders": []
	  // }
	});


# Components definition

## Collection

	module.exports = require('cqrs-eventdenormalizer').defineCollection({
	  // optional, default is folder name
    name: 'personDetail'

	  // optional, default ''
	  defaultPayload: 'payload',

	  // optional, default false
	  noReplay: false,

	  // indexes: [ // for mongodb
	  //   'profileId',
	  //   // or:
	  //   { profileId: 1 },
	  //   // or:
	  //   { index: {profileId: 1}, options: {} }
	  // ],

		// repositorySettings: { // optional
		//  mongodb : { // for mongo db
	  //		indexes: [ // same as above
	  //   		'profileId',
	  //   		// or:
	  //   		{ profileId: 1 },
	  //   		// or:
	  //   		{ index: {profileId: 1}, options: {} }
	  // 		]			
		//	},
		//	elasticsearch6 : { // for elasticsearch 5.x and 6.x ( elasticsearch6 type / implementation / driver )
    //  	refresh: 'wait_for', // refresh behaviour on index, default is true ( ie. force index refresh ) https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-refresh.html
		//    waitForActiveShards: 2, // optional, defaults to 1 ( ie. wait only for primary ) https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-create-index.html#create-index-wait-for-active-shards
		//		index: { // optional applied on index create, https://www.elastic.co/guide/en/elasticsearch/reference/6.x/indices-create-index.html
		//			settings : { // will be merged with the default ones,
		//				number_of_shards: 3, // optional, otherwise taken from type settings, defaults to 1,
		//				number_of_replicas: 1 // optional otherwise taken from type settings, defaults to 0,
		//			},
		//		mappings : { // optiona will be merged with the default ones, 
		//				properties: { // specific properties to not be handled by dynamic mapper
		//					title: { 
		//						type: "text"
		//					}
		//				}                    
		//			}
		//		}
		//  }
		// }
		//

	},

	// optionally, define some initialization data for new view models...
	{
	  emails: ['default@mycomp.org'],
	  phoneNumbers: []
	});

If you need an information from an other collection while denormalizing an event, you can require such a collection and make some lookups.
for example

	col.findViewModels({ my: 'value' }, function (err, vms) {});

or

	col.loadViewModel('id', function (err, vm) {});

or

	col.loadViewModelIfExists('id', function (err, vm) {});

But be careful with this!

## ViewBuilder
Each viewBuilder is dedicated to a specific event. It reacts on an event and denormalizes that event in an appropriate collection.

Viewbuilders are structured by collection (not by context).

	module.exports = require('cqrs-eventdenormalizer').defineViewBuilder({
	  // optional, default is file name without extension,
	  // if name is '' it will handle all events that matches
	  name: 'enteredNewPerson',

	  // optional
	  aggregate: 'person',

	  // optional
	  context: 'hr',

	  // optional, default is 0
	  version: 2,

	  // optional, if not defined or not found it will generate a new viewmodel with new id
	  id: 'aggregate.id',

	  // optional, suppresses auto-creation of new view model if none matching the id can be found, default is true
      autoCreate: true,

	  // optional, if not defined it will pass the whole event...
	  payload: 'payload',

	  // optional, default Infinity, all view-builders will be sorted by this value
      priority: 1
	}, function (data, vm) { // instead of function you can define
	                         // a string with default handling ('create', 'update', 'delete')
	                         // or function that expects a callback (i.e. function (data, vm, callback) {})

	  // if you have multiple concurrent events that targets the same vm, you can catch it like this:
	  // during a replay the denormalization finishes and the retry does not happen
	  if (vm.actionOnCommit === 'create') {
	  	return this.retry(); // hint: do not use arrow function in this scope when using this.retry()
	  	// or
	  	//return this.retry(100); // retries to denormalize again in 0-100ms
	  	// or
	  	//return this.retry({ from: 500, to: 8000 }); // retries to denormalize again in 500-8000ms
	  }

	  vm.set('firstname', data.firstname);
	  vm.set('lastname', data.lastname);
	});

### ViewBuilder for multiple viewmodels in a collection

Be careful with the query!

A lot of viewmodels can slow down the denormalization process!

	module.exports = require('cqrs-eventdenormalizer').defineViewBuilder({
	  // optional, default is file name without extension,
	  // if name is '' it will handle all events that matches
	  name: 'enteredNewPerson',

	  // optional
	  aggregate: 'person',

	  // optional
	  context: 'hr',

	  // optional, default is 0
	  version: 2,

	  // optional, if not defined or not found it will generate a new viewmodel with new id
	  query: { group: 'admins' },

	  // optional, if not defined it will pass the whole event...
	  payload: 'payload',

	  // optional, default Infinity, all view-builders will be sorted by this value
	  priority: 1
	}, function (data, vm) { // instead of function you can define
	                         // a string with default handling ('create', 'update', 'delete')
	                         // or function that expects a callback (i.e. function (data, vm, callback) {})handling ('create', 'update', 'delete')
	  vm.set('firstname', data.firstname);
	  vm.set('lastname', data.lastname);
	  //this.remindMe({ that: 'important value' });
	  //this.retry();
	});
	// optional define a function that returns a query that will be used as query to find the viewmodels (but do not define the query in the options)
	//.useAsQuery(function (evt) {
	//  return { my: evt.payload.my };
	//});
	// or async
	//.useAsQuery(function (evt, callback) {
	//  callback(null, { my: evt.payload.my });
	//});
	// optional define a function that returns a list of items, for each the viewbuilder will run.
	//.executeForEach(function (evt) {
	//  return [{ init: 'value1' }, { init: 'value2' }];
	//});
	// or async
	//.executeForEach(function (evt, callback) {
	//  callback(null, [{ init: 'value1' }, { init: 'value2' }]);
	//});
	//
	// optional define a function that checks if an event should be handled
	//.defineShouldHandle(function (evt, vm) {
	//  return true;
	//});
	// or
	//.defineShouldHandle(function (evt, vm, callback) {
	//  callback(null, true');
	//});
	//
	// optional define a function that checks if an event should be handled
	//.onAfterCommit(function (evt, vm) {
	//  //var memories = this.getReminder();
	//  //console.log(memories.that); // 'important value'
	//  //doSomethingStrange()
	//});
	// or
	//.onAfterCommit(function (evt, vm, callback) {
	//  var memories = this.getReminder();
	//  //console.log(memories.that); // 'important value'
	//  // doSomethingStrange(callback)
	//  callback(memories.that === 'important value' ? null : new Error('important value not set'));
	//});

## EventExtender

### for a collection (in a collection folder)

	module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
  // module.exports = require('cqrs-eventdenormalizer').definePreEventExtender({ // same api as normal EventExtenders but executed before viewBuilder so the extended event can be used
	  // optional, default is file name without extension,
	  // if name is '' it will handle all events that matches
	  name: 'enteredNewPerson',

	  // optional
	  aggregate: 'person',

	  // optional
	  context: 'hr',

	  // optional, default is 0
	  // if set to -1, it will ignore the version
	  version: 2//,

	  // optional, if not defined it will pass the whole event...
	  // payload: 'payload'
	}, function (evt, col, callback) {
	  // col.loadViewModel()... or from somewhere else... (col.findViewModels( /* see https://github.com/adrai/node-viewmodel#find */ ))
	  evt.extended = true;
	  callback(null, evt);
	});

	// or

	module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
	  // optional, default is file name without extension,
	  // if name is '' it will handle all events that matches
	  name: 'enteredNewPerson',

	  // optional
	  aggregate: 'person',

	  // optional
	  context: 'hr',

	  // optional, default is 0
	  // if set to -1, it will ignore the version
	  version: 2,

	  // if defined it will load the viewmodel
	  id: 'payload.id'//,

	  // optional, if not defined it will pass the whole event...
	  // payload: 'payload'
	},
	function (evt, vm) {
	  evt.extended = vm.get('myValue');
	  return evt;
	});

	// or

	module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
	  // optional, default is file name without extension,
	  // if name is '' it will handle all events that matches
	  name: 'enteredNewPerson',

	  // optional
	  aggregate: 'person',

	  // optional
	  context: 'hr',

	  // optional, default is 0
	  // if set to -1, it will ignore the version
	  version: 2,

	  // if defined it will load the viewmodel
	  id: 'payload.id'//,

	  // optional, if not defined it will pass the whole event...
	  // payload: 'payload'
	},
	function (evt, vm, callback) {
	  evt.extended = vm.get('myValue');
	  callback(null, evt);
	});

### not for a collection

	module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
	  // optional, default is file name without extension,
	  // if name is '' it will handle all events that matches
	  name: 'enteredNewPerson',

	  // optional
	  aggregate: 'person',

	  // optional
	  context: 'hr',

	  // optional, default is 0
	  // if set to -1, it will ignore the version
	  version: 2//,

	  // optional, if not defined it will pass the whole event...
	  // payload: 'payload'
	}, function (evt) {
	  evt.extended = true;
	  return evt;
	});

	// or

	module.exports = require('cqrs-eventdenormalizer').defineEventExtender({
	  // optional, default is file name without extension,
	  // if name is '' it will handle all events that matches
	  name: 'enteredNewPerson',

	  // optional
	  aggregate: 'person',

	  // optional
	  context: 'hr',

	  // optional, default is 0
	  // if set to -1, it will ignore the version
	  version: 2//,

	  // optional, if not defined it will pass the whole event...
	  // payload: 'payload'
	}, function (evt, callback) {
	  evt.extended = true;
	  callback(null, evt);
	});


## Replay events

Replay whenever you want...

	denormalizer.replay([/* ordered array of events */], function (err) {
	  if (err) { console.log(err); }
	});

or when catching some events:

	denormalizer.onEventMissing(function (info, evt) {

	  // grab the missing events, depending from info values...
	  // info.aggregateId
	  // info.aggregateRevision
	  // info.aggregate
	  // info.context
	  // info.guardRevision
	  // and call handle...
	  denormalizer.handle(missingEvent, function (err) {
	    if (err) { console.log(err); }
	  });

	});

or depending on the last guarded event:

	denormalizer.getLastEvent(function (err, evt) {

	  if (event.occurredAt < Date.now()) {
	  	// ...
	  }

	});

### streamed

	denormalizer.replayStreamed(function (replay, done) {

	  replay(evt1);
	  replay(evt2);
	  replay(evt3);

	  done(function (err) {
	    if (err) { console.log(err); }
	  });

	});

### if you want to clear the readModel before replaying...

	denormalizer.clear(function (err) {
	});

## ES6 default exports
Importing ES6 style default exports is supported for all definitions where you also use `module.exports`:
```
module.exports = defineCollection({...});
```
works as well as 
```
exports.default = defineCollection({...});
```
as well as (must be transpiled by babel or tsc to be runnable in node)
```
export default defineCollection({...});
```

Also: 
```
exports.default = defineViewBuilder({...});
exports.default = defineEventExtender({...});
// etc...
```
Exports other than the default export are then ignored by this package's structure loader.

[Release notes](https://github.com/adrai/node-cqrs-eventdenormalizer/blob/master/releasenotes.md)


# License

Copyright (c) 2015 Adriano Raiano

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
