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
