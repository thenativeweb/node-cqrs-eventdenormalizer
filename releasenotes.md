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
