## [v1.12.5](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.12.4...v1.12.5)
- fixing dynamodb DocumentClient initialization [#65](https://github.com/adrai/node-cqrs-eventdenormalizer/pull/65) thanks to [nanov](https://github.com/nanov)

## [v1.12.4](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.12.3...v1.12.4)
- [optimization] skip to load vm if viewbuilder has not requested it via shouldHandle function

## [v1.12.3](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.12.2...v1.12.3)
- update viewmodel

## [v1.12.2](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.12.1...v1.12.2)
- update viewmodel

## [v1.12.1](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.12.0...v1.12.1)
- fixing dynamodb DocumentClient initialization [#60](https://github.com/adrai/node-cqrs-eventdenormalizer/pull/60) thanks to [Glockenbeat](https://github.com/Glockenbeat)

## [v1.12.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.11.0...v1.12.0)
- Support default exports [#58](https://github.com/adrai/node-cqrs-eventdenormalizer/pull/59) thanks to [IRT-fbachmann](https://github.com/IRT-fbachmann)

## [v1.11.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.10.5...v1.11.0)
- dynamodb revisionGuardStore implementation [#58](https://github.com/adrai/node-cqrs-eventdenormalizer/pull/58) thanks to [emmkong](https://github.com/emmkong)

## [v1.10.5](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.10.4...v1.10.5)
- update viewmodel

## [v1.10.4](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.10.3...v1.10.4)
- update viewmodel

## [v1.10.3](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.10.2...v1.10.3)
- update viewmodel

## [v1.10.2](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.10.1...v1.10.2)
- Added non-breaking db implementation specific settings support to collection definition. [#56](https://github.com/adrai/node-cqrs-eventdenormalizer/pull/56) thanks to [nanov](https://github.com/nanov) and his company [eCollect](https://github.com/eCollect) which enabled him to work also during working hours

## [v1.10.1](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.10.0...v1.10.1)
- respect preEventExtenders in replayHandler

## [v1.10.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.46...v1.10.0)
- introduced preEventExtenders

## [v1.9.46](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.45...v1.9.46)
- optimize handling for commandRejected

## [v1.9.45](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.43...v1.9.45)
- fix for new mongodb driver

## [v1.9.43](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.41...v1.9.43)
- set proper this context

## [v1.9.41](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.40...v1.9.41)
- update deps

## [v1.9.40](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.39...v1.9.40)
- downgrade async to 1.5.2 because of RangeError: Maximum call stack size exceeded when rebuilding a lot of events

## [v1.9.39](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.38...v1.9.39)
- filter falsable notifications

## [v1.9.38](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.37...v1.9.38)
- update viewmodel

## [v1.9.37](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.36...v1.9.37)
- edgecase in revisionGuard

## [v1.9.36](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.35...v1.9.36)
- redis, mongodb: call disconnect on ping error

## [v1.9.35](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.34...v1.9.35)
- Fix events getting lost at high concurrency

## [v1.9.34](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.31...v1.9.34)
- Support mongo connection string

## [v1.9.31](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.30...v1.9.31)
- fix replay race condition when deleting and creating multiple times

## [v1.9.30](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.29...v1.9.30)
- updated viewmodel

## [v1.9.29](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.28...v1.9.29)
- redis, mongodb: call disconnect on ping error

## [v1.9.28](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.26...v1.9.28)
- fix replay race condition when deleting multiple times
- do abort/finish denormalization handling when calling this.retry() wile replaying

## [v1.9.26](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.24...v1.9.26)
- revisionGuard: optional startRevisionNumber

## [v1.9.24](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.23...v1.9.24)
- redis: added optional heartbeat

## [v1.9.23](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.22...v1.9.23)
- updated viewmodel

## [v1.9.22](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.21...v1.9.22)
- if event is not extended return the original event

## [v1.9.21](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.20...v1.9.21)
- revisionGuard fix

## [v1.9.20](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.19...v1.9.20)
- redis: fix for new redis lib

## [v1.9.19](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.18...v1.9.19)
- mongodb: added optional heartbeat

## [v1.9.18](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.15...v1.9.18)
- fix a replay inmemory issue

## [v1.9.15](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.14...v1.9.15)
- update viewmodel

## [v1.9.14](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.12...v1.9.14)
- optimize loader

## [v1.9.12](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.11...v1.9.12)
- collection added loadViewModelIfExists function

## [v1.9.11](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.10...v1.9.11)
- update viewmodel

## [v1.9.10](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.9...v1.9.10)
- optimize handling of guarding the first events

## [v1.9.9](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.8...v1.9.9)
- do not call onAfterCommit during replay

## [v1.9.8](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.7...v1.9.8)
- optimize performance while replaying

## [v1.9.7](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.6...v1.9.7)
- remove trycatch dependency due to memory leaks

## [v1.9.6](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.5...v1.9.6)
- optimize performance while replaying

## [v1.9.5](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.4...v1.9.5)
- fix replay behaviour
- give possibility to use mongodb with authSource

## [v1.9.4](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.3...v1.9.4)
- warn log when async try catch

## [v1.9.3](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.2...v1.9.3)
- update some deps

## [v1.9.2](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.1...v1.9.2)
- fix replay handling when fetching by query

## [v1.9.1](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.9.0...v1.9.1)
- update viewmodel dependency

## [v1.9.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.8.5...v1.9.0)
- viewbuilder: introduce onAfterCommit function

## [v1.8.5](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.8.4...v1.8.5)
- fix defaultPayload stuff for viewbuilder

## [v1.8.4](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.8.3...v1.8.4)
- optimization for `npm link`'ed development
- viewbuilder for multiple events [#24](https://github.com/adrai/node-cqrs-eventdenormalizer/issues/24) thanks to [TomKaltz](https://github.com/TomKaltz)

## [v1.8.3](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.8.0...v1.8.3)
- update viewmodel dependency

## [v1.8.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.12...v1.8.0)
- introduce priority for viewBuilder

## [v1.7.12](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.11...v1.7.12)
- do not use defaultPayload of collection for event extenders

## [v1.7.11](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.9...v1.7.11)
- catch throwing errors when calling callback

## [v1.7.9](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.7...v1.7.9)
- update viewmodel dependency

## [v1.7.7](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.6...v1.7.7)
- expose warnings during initialization

## [v1.7.6](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.5...v1.7.6)
- better catch for userland errors

## [v1.7.5](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.4...v1.7.5)
- fix alreadyInQueue check

## [v1.7.4](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.3...v1.7.4)
- update viewmodel dependency

## [v1.7.3](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.2...v1.7.3)
- because of shouldHandle, return all possible viewBuilders (not just one)

## [v1.7.2](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.1...v1.7.2)
- filter null notifications

## [v1.7.1](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.7.0...v1.7.1)
- fix replay handling caused by introduction of shouldHandle

## [v1.7.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.6.0...v1.7.0)
- introduce possibility to define a shouldHandle function

## [v1.6.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.5.1...v1.6.0)
- when using revisionGuard, always save the last event
- when using revisionGuard, added possibility to fetch the last denormalized event

## [v1.5.1](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.5.0...v1.5.1)
- little fix

## [v1.5.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.4.0...v1.5.0)
- add retry mechanism for viewBuilder

## [v1.4.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.11...v1.4.0)
- fix revisionGuard when handling duplicate events at the same time

## [v1.3.11](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.10...v1.3.11)
- update viewmodel dependency

## [v1.3.10](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.9...v1.3.10)
- correct actionOnCommit handling during replay

## [v1.3.9](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.8...v1.3.9)
- update viewmodel dependency
- added mongodb driver 2.x support

## [v1.3.8](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.7...v1.3.8)
- update viewmodel dependency
- add autoCreate option to view builder thanks to [#9](https://github.com/adrai/node-cqrs-eventdenormalizer/pull/9) thanks to [andywer](https://github.com/andywer)
- added mongodb driver 2.x support

## [v1.3.7](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.6...v1.3.7)
- update viewmodel dependency

## [v1.3.6](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.2...v1.3.6)
- optimize structureParser

## [v1.3.2](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.1...v1.3.2)
- introduce noReplay flag on collection

## [v1.3.1](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.3.0...v1.3.1)
- cloneDeep init values of executeForEach

## [v1.3.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.2.5...v1.3.0)
- added executeForEach function for viewBuilders

## [v1.2.5](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.2.4...v1.2.5)
- added payload functionality for eventExtenders

## [v1.2.4](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.2.3...v1.2.4)
- update viewmodel dependency

## [v1.2.3](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.2.1...v1.2.3)
- fix usage with own db implementation

## [v1.2.1](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.2.0...v1.2.1)
- fix revisionGuard in replay

## [v1.2.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.11...v1.2.0)
- added getInfo function

## [v1.1.11](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.10...v1.1.11)
- fix deepClone issue in collection
- added clear function to be used for rebuilding the readmodel

## [v1.1.10](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.9...v1.1.10)
- update viewmodel dependency

## [v1.1.9](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.8...v1.1.9)
- update viewmodel dependency

## [v1.1.8](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.7...v1.1.8)
- prevent events being denormalized out of order during replayStreamed thanks to [#6](https://github.com/adrai/node-cqrs-eventdenormalizer/pull/6) thanks to [andywer](https://github.com/andywer)

## [v1.1.7](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.6...v1.1.7)
- added possibility to denormalize multiple viewmodels in same collection with intelligent queries in an async way

## [v1.1.6](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.5...v1.1.6)
- added possibility to denormalize multiple viewmodels in same collection with intelligent queries

## [v1.1.5](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.4...v1.1.5)
- async viewBuilders

## [v1.1.4](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.3...v1.1.4)
- update viewmodel dependency

## [v1.1.3](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.2...v1.1.3)
- handle case of same aggregateId in different contexts or aggregates

## [v1.1.2](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.1...v1.1.2)
- update viewmodel dependency

## [v1.1.1](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.1.0...v1.1.1)
- little optimization for replay

## [v1.1.0](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.0.10...v1.1.0)
- added possibility to denormalize multiple viewmodels in same collection

## [v1.0.10](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.0.6...v1.0.10)
- fixed replay handling

## [v1.0.6](https://github.com/adrai/node-cqrs-eventdenormalizer/compare/v1.0.4...v1.0.6)
- update viewmodel dependency

## v1.0.4
- handle crappy events with an error

## v1.0.2
- update viewmodel dependency

## v1.0.1
- clone event payload before passing to handle function

## v1.0.0
- refactored whole module
- added possibility to define aggregateId, aggregate and context
- generic message structure for events
- added a lot of tests
- stabilized everything
- optimized performance
- added notification feature
- IMPORTANT: changed API!!!

## v0.4.1
- do not use newer viewmodel version

## v0.4.0
- updated node-queue

## v0.3.6
- make use of viewmodel indexes

## v0.3.5
- emit missingEvent if commandRejected and revision not in sync

## v0.3.4
- handle versioned events

## v0.3.3
- little fix in replay streamed

## v0.3.2
- introduced optional revisionStart (default = 1)

## v0.3.1
- optimized guard for first event for a new denormalized aggregate id

## v0.3.0 (BREAKING CHANGES!!!)
- introduction of revisionGuard
- contextEventDenormalizer is now eventDenormalizer
- eventMissing notification (for atomic replay)
- eventDenormalizer.replay to replay (from scratch)
- eventDenormalizerBase is now viewBuilderBase
- viewBuilderBase new signature (see documentation or tests)

## v0.2.6
- use new concurrency feature of viewmodel

## v0.2.4
- added disableQueuing and ignoreRevision flag
