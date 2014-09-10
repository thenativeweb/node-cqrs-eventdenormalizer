var denorm = require('cqrs-eventdenormalizer')({
  sagaPath: '/path/to/my/files',
  retryOnConcurrencyTimeout: 1000,
  
  repository: {
    type: 'mongodb',
    host: 'localhost',                          // optional
    port: 27017,                                // optional
    dbName: 'readmodel',                        // optional
    timeout: 10000                              // optional
    // username: 'technicalDbUser',                // optional
    // password: 'secret'                          // optional
  },

  revisionGuard: {
    type: 'redis',
    host: 'localhost',                          // optional
    port: 6379,                                 // optional
    db: 0,                                      // optional
    prefix: 'denormalizer_revision',            // optional
    timeout: 10000,                             // optional
    // password: 'secret',                         // optional
    queueTimeout: 1000,
    queueTimeoutMaxLoops: 3
  }
});


// repository
denorm.repository.on('connect', function() {
  console.log('repository connected');
});

denorm.repository.on('disconnect', function() {
  console.log('repository disconnected');
});
// revisionGuard
denorm.revisionGuard.on('connect', function() {
  console.log('revisionGuard connected');
});

denorm.revisionGuard.on('disconnect', function() {
  console.log('revisionGuard disconnected');
});

// anything (repository or revisionGuard)
denorm.on('connect', function() {
  console.log('something connected');
});

denorm.on('disconnect', function() {
  console.log('something disconnected');
});


denorm.defineEvent({
  // optional, default is 'name'
  name: 'name',
  
  // optional, only makes sense if contexts are defined in the 'domainPath' structure 
  context: 'context.name',
  
  // optional, only makes sense if aggregates with names are defined in the 'domainPath' structure
  aggregate: 'aggregate.name',
  
  // optional
  version: 'version',
  
  // optional, if defined theses values will be copied to the command (can be used to transport information like userId, etc..)
  meta: 'meta'
});

denorm.defineNotification({
  // // optional, default is 'name'
  // name: 'name',
  
  // // optional, only makes sense if contexts are defined in the 'domainPath' structure 
  // context: 'context.name',
  
  // // optional, only makes sense if aggregates with names are defined in the 'domainPath' structure
  // aggregate: 'aggregate.name',
  
  // // optional
  // version: 'version',
  
  // // optional, if defined theses values will be copied to the command (can be used to transport information like userId, etc..)
  // meta: 'meta'
});


// pass events to bus
denorm.onEvent(function (evt) {
  bus.emit('event', evt);
});
// or
// pass events to bus
denorm.onEvent(function (evt, callback) {
  bus.emit('event', evt, function ack () {
    callback();
  });
});

// pass notifications to bus
denorm.onNotification(function (noti) {
  bus.emit('notification', noti);
});
// or
// pass events to bus
denorm.onNotification(function (noti, callback) {
  bus.emit('notification', noti, function ack () {
    callback();
  });
});

// denorm.on('eventMissing', function (id, aggregateRevision, eventRevision, evt) {
//   // request the appropriate missing events from domain...
// }),
// denorm.onEventMissing(function (id, aggregateRevision, eventRevision, evt) {
//   // request the appropriate missing events from domain...
// }),

// // to replay
// denorm.replay([] /* array of ordered events */, function(err) {});

// // to replay streamed
// denorm.replayStreamed(function(replay, done) {

//   replay(evt1);
//   replay(evt2);
//   replay(evt3);

//   done(function(err) { });

// });


// optional
denorm.defaultEventExtension(function (evt) {
  evt.receiver = [evt.meta.userId];
});


denorm.init(function (err) {
  // this callback is called when all is ready...
});

// or
denorm.init(); // callback is optional


denorm.handle({
  id: 'b80ade36-dd05-4340-8a8b-846eea6e286f',
  name: 'orderCreated',
  aggregate: {
    id: '3b4d44b0-34fb-4ceb-b212-68fe7a7c2f70',
    name: 'order'
  },
  context: {
    name: 'sale'
  },
  payload: {
    totalCosts: 520,
    seats: ['4f', '8a']
  },
  meta: {
    userId: 'ccd65819-4da4-4df9-9f24-5b10bf89ef89'
  }
}, function (errs, evts, notifications, viewModels) {

});





