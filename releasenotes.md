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
