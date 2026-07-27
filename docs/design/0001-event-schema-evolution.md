# 0001: Event schema evolution

| Field        | Value      |
| ------------ | ---------- |
| Status       | Draft      |
| Scope        | Kernel     |
| Created      | 2026-07-26 |
| Last updated | 2026-07-26 |

## Summary

Hyperkernel will keep recorded event rows immutable while allowing event payload
contracts to evolve. Compatible additive changes may retain the same schema
version. An incompatible representation change increments an explicit integer
schema version and adds one centralized legacy decoder. A change in business
meaning creates a new event type.

Projections and aggregate reducers consume canonical decoded events rather than
implement compatibility logic independently.

## Problem

Events are the source of truth for durable domain state. Once an event is
recorded, Hyperkernel must be able to replay it for as long as it exists.
Application code will nevertheless evolve, and a current event payload contract
may no longer accept an older stored payload.

Hyperkernel needs a compatibility mechanism that preserves the original
evidence, keeps projection rebuilds deterministic, and does not distribute
historical schema handling across every consumer.

## Invariants

1. A recorded event row is never updated or deleted.
2. An existing event type and schema version keep the same stored meaning.
3. Every historical event remains interpretable for as long as it exists.
4. Incremental projection processing and clean replay remain equivalent for the
   same ordered events and projection version.
5. Compatibility code transforms events only in memory and never rewrites the
   event log.
6. New writes use only the current supported schema version for an event type.
7. Event decoding and compatibility transformations are pure, deterministic,
   synchronous, and independent of ambient mutable state.

## Decision

Every event envelope contains a stable event type and an explicit positive
integer schema version. The schema version describes the stored payload format;
it is independent of the stream version that orders events within a stream.

Event definitions own:

- the current stored payload schema;
- the current runtime event representation;
- schemas for persisted historical versions;
- one centralized decoder from each supported historical representation into
  the canonical runtime event;
- fixtures proving that every historical representation remains readable.

The event reader validates the stored payload against the schema identified by
the event type and schema version. It then produces a canonical runtime event
before dispatching it to aggregate reducers, projections, procedures, or other
consumers.

Compatibility logic is not implemented separately by each projection.

### Compatible changes

An additive field may retain the existing schema version when:

- older payloads remain valid;
- the missing field has a deterministic interpretation;
- the event's business meaning does not change;
- all supported readers tolerate the change.

For example, a newly optional field may be interpreted through an explicit
default by current code.

### Incompatible representation changes

An incompatible stored representation increments the schema version. The event
definition adds a legacy decoder that validates the historical payload and
returns the canonical runtime event.

Historical event rows retain their original type, schema version, and payload.

### Semantic changes

A change in business meaning creates a new event type rather than a new schema
version. Event names describe specific past-tense facts, such as
`UserEmailChanged` or `UserDeactivated`, instead of broad mutable objects such
as `UserChanged`.

### Unsupported versions

The reader fails explicitly when an event type or schema version is unknown. It
must not skip the event, guess its interpretation, or partially advance a
projection checkpoint.

An upgrade is not compatible if it can write new events but can no longer read
events produced by a supported earlier release.

## Considered solutions

### Rewrite stored events

Updating historical payloads would simplify current readers but destroy the
original evidence and weaken auditability. It would also make upgrades capable
of silently changing history.

This solution is rejected because it violates event immutability.

### Create a new event type for every representation change

Types such as `UserEmailChangedV1` and `UserEmailChangedV2` make stored formats
explicit without a separate schema-version field.

This solution is rejected for representation-only changes because it fragments
subscriptions, queries, procedures, reducers, and projections even when the
underlying business fact is unchanged. New event types remain the chosen
mechanism for semantic changes.

### Let every projection handle deprecated versions

Each projection could provide a current handler and separate deprecated
handlers.

This solution is rejected because compatibility work grows with both the number
of event versions and the number of consumers. Different consumers could also
interpret the same historical event inconsistently.

### Use sequential upcasters

A migration chain could transform version 1 into version 2, then version 2 into
version 3, until reaching the current representation.

This solution remains compatible with immutable storage, but a generic
migration graph is unnecessary for the initial contract. Direct centralized
legacy decoders provide the same consumer boundary with less infrastructure.
The design may be reconsidered if real event histories make direct decoders
difficult to maintain.

### Derive versions from schema hashes

A deterministic schema fingerprint could identify a stored schema without a
developer assigning an integer version.

This solution is rejected as the versioning mechanism because a hash provides
identity but no ordering, compatibility meaning, or migration path. It also
cannot represent arbitrary decoding behavior. A schema fingerprint may later
be added as an integrity check without replacing the explicit version.

### Store schemas or codecs in SQLite

Persisted JSON schemas could provide documentation, but they cannot reproduce
arbitrary TypeScript decoding behavior. Persisting executable codecs would
introduce code serialization, runtime compatibility, deployment, and security
problems.

This solution is rejected as the execution mechanism. Compatibility code
remains in reviewed, version-controlled application artifacts.

## Consequences

### Gains

- Event rows remain immutable.
- Historical compatibility has one boundary per event type.
- Reducers and projections consume one canonical event representation.
- Replay failures identify an explicit unsupported type or schema version.
- Schema evolution remains separate from stream concurrency and ordering.

### Costs and limitations

- Legacy schemas, decoders, and fixtures must remain available while matching
  events exist.
- A decoder cannot invent historical information absent from the stored event.
- A change to reducer or projection behavior can still change current
  interpretation and requires its own compatibility analysis.
- Exact reproduction of an older software release may require preserving the
  corresponding projection or application artifact.

## Evaluation

This record may advance to Development when:

- the event envelope and schema-version contracts are approved;
- the boundary between compatible, incompatible, and semantic changes is
  accepted;
- the unsupported-version failure behavior is accepted.

It may advance to Evaluation when the repository contains:

- an immutable event table;
- current and historical payload validation;
- centralized legacy decoding;
- historical fixtures for every persisted version;
- replay tests covering supported and unsupported versions.

It may advance to Stable after representative historical logs pass upgrade,
incremental-processing, and clean-replay equivalence tests.

## Status history

| Date       | Status | Reason                              |
| ---------- | ------ | ----------------------------------- |
| 2026-07-26 | Draft  | Initial design proposed for review. |
