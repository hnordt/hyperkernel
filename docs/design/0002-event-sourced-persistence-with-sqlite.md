# 0002: Event-sourced persistence with SQLite

| Field        | Value       |
| ------------ | ----------- |
| Status       | Development |
| Scope        | Kernel      |
| Created      | 2026-07-27  |
| Last updated | 2026-07-27  |

## Summary

Hyperkernel will make an ordered, immutable event log authoritative for durable
domain state and derive relational projections for application reads.
Operational logs remain diagnostic and are not replay inputs.

SQLite is the only supported database engine for the initial single-process,
self-hosted architecture. Its serialized write transactions fit the ordered
event commit path, and one local transaction can atomically commit the command
decision, events, required kernel projections, and checkpoints. Another engine
requires a measured need and a separate design record; Hyperkernel will not
build a speculative database abstraction.

This is a target production design. The event store, projection runtime,
rebuild flow, backup guarantees, and operating envelope are not yet implemented
and evaluated.

## Problem

Hyperkernel is intended to run modular applications that share platform
contracts for durable state, permissions, events, audit history, and recovery.
Applications need read models shaped for their own queries while the platform
preserves one authoritative explanation of how committed domain state changed.

The persistence architecture must support:

- complete and ordered domain history;
- corrections that preserve the original fact and its correction;
- deterministic recovery of current state;
- new or changed projections rebuilt from historical events;
- historical inspection and time travel;
- multiple applications consuming the same accepted facts;
- self-hosting with low operational overhead for independent developers, small
  teams, and small organizations.

A standard CRUD architecture makes mutable current-state tables authoritative.
Logs, audit rows, or change records then describe changes to that state as a
secondary concern. Hyperkernel would have to prove that every write path,
migration, administrative operation, and integration updates both
representations with equivalent meaning.

The decision is not whether the system may execute `INSERT`, `UPDATE`, or
`DELETE` statements. Projections will use normal relational operations. The
decision is which representation is authoritative: mutable current state or
immutable accepted facts.

## Invariants

1. Every durable domain change enters through the command boundary.
2. A committed state-changing command appends one or more immutable events.
3. The ordered event log is the sole source of truth for durable domain state.
4. A recorded event is never updated or deleted. Corrections, reversals, and
   logical deletion append new events.
5. The kernel allocates a unique, monotonic logical event position inside the
   append transaction. Timestamps are metadata, not authoritative ordering.
6. The final command decision, event append, required synchronous kernel
   projections, and their checkpoints commit atomically.
7. Projections are derived, disposable, and deterministically rebuildable.
   Incremental processing and clean replay of the same events with the same
   projection version produce equivalent state.
8. An extension projection commits its state changes and checkpoint atomically.
   It may lag or fail without corrupting or rolling back the canonical event
   log.
9. Any supported database must preserve atomic append, unique logical
   positions, expected stream versions, idempotency, isolation, replay, and
   recovery.

## Decision

### Authoritative state

A command records immutable actor intent. Append-only decision records capture
its received, rejected, failed, or committed lifecycle outcome. A rejected
command appends no domain-state event. A committed state-changing command
appends events that describe specific past-tense domain facts.

The event log is authoritative. Applications do not update authoritative
current-state tables directly.

Projections transform ordered events into relational tables shaped for
application and platform queries. They may maintain current state, search
indexes, summaries, timelines, authorization views, or other specialized read
models. Only its projector or controlled rebuild machinery may update derived
projection state.

Normal reads query projections rather than replaying the event log on demand.
A projection may be discarded and rebuilt without changing authoritative
domain state.

Exact reproduction of an older interpretation also requires the corresponding
projection artifact and versioned configuration.

Transient interface state such as hover, focus, and unsubmitted drafts is
outside this contract. External effects are also outside projections because
replay cannot undo or safely repeat an effect in another system.

### Supported database

Hyperkernel will initially support SQLite only, through the built-in
`node:sqlite` module and the centralized server database boundary.

The immutable received command is recorded first. Its later final decision,
events, synchronous kernel projections, and their checkpoints share one SQLite
transaction. A crash may leave a received command without a final decision;
recovery must preserve and resolve that explicit state. Extension projections
advance after the authoritative transaction from durable event positions.

The implementation will use SQLite's actual transaction, isolation, constraint,
and failure semantics. It will not introduce an ORM, lowest-common-denominator
SQL dialect, or generic database adapter solely to imply future portability.
Database access remains behind the kernel boundary so a future engine can be
introduced intentionally rather than through application-level direct writes.

Support for another database is not prohibited or promised. It requires a
measured need, an explicit compatibility contract, migration and recovery
tooling, and a new design record. A material change to either coordinated
decision supersedes this record as a whole, although its replacement may carry
the other decision forward unchanged.

## Why event sourcing and projections

The material difference from CRUD plus logs is the authority assigned to each
record:

| Concern                | Mutable CRUD state plus logs                                  | Event sourcing plus projections                      |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Source of truth        | Current-state rows                                            | Ordered accepted domain facts                        |
| History                | Secondary record with separately enforced completeness        | Part of the authoritative domain contract            |
| Meaning                | Often row changes or diagnostic messages                      | Versioned domain facts with actor, cause, and order  |
| Correction             | Overwrite state and separately explain the change             | Append a corrective or compensating fact             |
| Recovery               | Restore and repair current-state tables                       | Restore the log and rebuild derived state            |
| New read model         | Backfill from current state and whatever history was retained | Replay the canonical history                         |
| New application        | Observe exposed current state or future changes               | Consume relevant historical and future facts         |
| Consistency obligation | Keep mutable authority and secondary history equivalent       | Append authoritative facts and rebuild derived state |
| Query performance      | Query current-state tables                                    | Query purpose-built relational projections           |
| Initial complexity     | Lower                                                         | Higher event, replay, and compatibility cost         |

Operational and audit logs may be structured, durable, and transactional. If
they are complete, ordered, immutable, versioned, and sufficient to rebuild
domain state, they function as an event store. If they are not, they cannot
satisfy Hyperkernel's replay contract. Hyperkernel therefore makes replayable
history authoritative and treats current-state tables as projections.

This choice has a higher initial cost than CRUD. Hyperkernel accepts that cost
because auditability, correction history, deterministic recovery, historical
inspection, and application composition are product requirements rather than
optional logging features.

## Why SQLite fits Hyperkernel

SQLite is not universally the best database. It is selected because it is a
strong fit for Hyperkernel's current bounded deployment assumptions and its
properties align directly with the kernel's required data flow:

| Hyperkernel requirement     | SQLite property                             | Architectural effect                                                      |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| Simple self-hosting         | Embedded in the application process         | No separate database service, network, credentials, or connection pool    |
| One ordered event log       | Write transactions are serialized           | A stable commit position and expected stream versions are straightforward |
| One command commit boundary | Local transactions with explicit durability | The complete outcome commits or rolls back together                       |
| Purpose-built read models   | Relational tables, constraints, and indexes | Each projection can optimize for its own queries                          |
| Small trusted kernel        | One engine with concrete semantics          | Locking, migrations, recovery, and failures have one test matrix          |

SQLite permits one writer at a time. For Hyperkernel's initial architecture,
that is an alignment before it is a limitation. The kernel already requires a
single stable order for accepted events, and the initial deployment has one
active Hyperkernel writer process per database. SQLite serializes the write
transactions that assign this order. The kernel must keep transactions short,
bound lock waiting, and handle contention explicitly.

Embedding the database removes an independent service from every self-hosted
installation. There is no database daemon to provision, secure, connect, pool,
monitor separately, or upgrade on another lifecycle. Self-hosting also
distributes load by installation instead of concentrating every user's workload
in one mandatory shared cluster. SQLite is therefore evaluated against a
supported installation's workload, not the aggregate scale of every
installation.

## Operational boundaries

SQLite support requires an explicit operating contract:

- A persistent database uses reliable local storage on the same host as the
  Hyperkernel process. WAL mode is not used over a network filesystem. Startup
  verifies the effective journal mode, durability settings, foreign-key
  enforcement, and embedded SQLite version.
- The current shared `DatabaseSync` connection does not provide application
  read/write concurrency. A multi-connection WAL topology remains unsupported
  until its embedded SQLite version contains every applicable integrity fix and
  its concurrent write and checkpoint behavior passes recovery tests.
- Write transactions remain short and contain no network calls, external
  effects, unbounded computation, or user-supplied execution. Lock waiting,
  admission, whole-command retry, and overload responses are bounded and
  explicit.
- The kernel must not acknowledge a committed command before the event
  transaction satisfies the configured durability guarantee. In WAL mode,
  `synchronous=NORMAL` can lose recent committed transactions after an
  operating-system crash or power loss. A production event store must use
  stronger durability, such as `synchronous=FULL`, unless the canonical
  durability contract is intentionally changed together with a new design
  record.
- Projection fan-out inside the authoritative transaction remains limited to
  kernel projections that require strong consistency. An extension projection
  commits each batch and its checkpoint atomically, and its failure does not
  lengthen or roll back the authoritative event commit.
- Live backups use a SQLite-aware consistent snapshot procedure. Copying only
  the main database file while WAL activity continues is not a backup contract.
  Restoration and integrity checking are tested.
- Lock contention, `SQLITE_BUSY` failures, command latency, database and WAL
  size, checkpoint progress, disk capacity, projection lag, rebuild time, and
  recovery time are observable. Long database work is bounded or isolated from
  the synchronous Node.js application path.

These are required production capabilities. The existing SQLite connection and
architecture spike do not prove them.

## Considered solutions

### Mutable CRUD state plus diagnostic or audit logs

This solution has the lowest initial cost and is appropriate when current state
is authoritative and history is primarily diagnostic. Transactional audit
tables or triggers can ensure that every row change also appends history.

It is rejected because Hyperkernel requires the historical representation
itself to support correction, replay, new projections, and recovery. Keeping
mutable rows authoritative would preserve a separate equivalence obligation
between current state and history.

### Mutable CRUD state plus a replayable domain-event stream

The system could update authoritative CRUD tables and publish complete domain
events through an atomic outbox. This gives consumers semantic history and
avoids a publication race.

It is rejected because a complete stream that can rebuild domain state already
functions as the event store. Keeping CRUD tables independently authoritative
would retain duplicate authority without simplifying the replay contract.

### Event sourcing on PostgreSQL from the first release

PostgreSQL provides concurrent writers, remote client-server access, mature
server administration, and high-availability deployment options.

Those capabilities also require a separate service, credentials, network
security, connection pooling, independent upgrades, and a larger operational
failure surface for every installation. Hyperkernel does not yet have a
measured workload or availability requirement that justifies that cost.

This solution is rejected for the initial architecture. A client-server
database remains a candidate if SQLite fails a validated project requirement.

### SQLite and PostgreSQL through one abstraction

Supporting both engines would provide more deployment choices and make a later
migration appear easier.

It would also multiply migration, query, locking, transaction, backup, restore,
crash-recovery, and compatibility tests before the storage contract is proven.
Isolation, concurrency, DDL, failure behavior, and operational procedures
cannot be safely reduced to a thin generic interface.

This solution is rejected because speculative portability would enlarge the
trusted kernel and encourage lowest-common-denominator persistence.

### External event store or distributed log

A dedicated event store or broker could provide event distribution,
partitioning, and cross-node processing.

It would introduce another service and a distributed transaction boundary
between the authoritative event append and relational projections. Hyperkernel
does not currently require cross-node event ingestion or distributed
consumers.

This solution is rejected for the initial architecture because it adds
coordination and operations without satisfying a present project goal.

## Consequences

### Gains

- Every committed durable domain change is represented in the authoritative log
  while the kernel boundary is preserved.
- Corrections preserve both the original fact and the corrective fact.
- Projections can be repaired, replaced, or added by replaying one canonical
  history.
- Modular applications can consume stable domain facts without writing into
  another application's current-state tables.
- Current-state queries remain normal indexed relational queries.
- The command outcome and required kernel state share one local atomic
  transaction.
- Self-hosting requires fewer services, credentials, network boundaries, and
  independent upgrade procedures.
- One supported engine keeps the kernel, operational contract, and verification
  matrix smaller.

### Costs and limitations

- Event types and schema versions become long-lived compatibility contracts.
- Projection execution, checkpoints, lag, failure, rebuild, and cutover require
  first-class kernel tooling.
- The event log grows continuously. Storage, backup, restore, replay, and
  upgrade duration must be measured and managed.
- Secrets are forbidden in immutable payloads. Erasable personal data requires
  approved indirection, tokenization, or encryption and key-destruction design
  before persistence.
- Event sourcing does not undo external effects or replace operational logs.
- Replay can derive only information represented by recorded events. New
  consumers must support the relevant historical schemas and remain authorized
  to consume them.
- Projection fan-out creates write amplification and can extend SQLite's write
  lock duration.
- SQLite provides one concurrent writer per database and no native
  multi-primary or multi-region write architecture.
- A single-host database does not provide the automatic failover of a managed
  client-server database cluster.
- WAL adds checkpointing and companion-file operational requirements.
- The synchronous `node:sqlite` API can block the application thread during
  long database work.
- SQLite-specific projection schemas and queries may require adaptation if
  another engine is added. A future database is not a transparent driver swap.
- Event immutability is a kernel contract, not proof against a privileged host
  administrator modifying the database file. Tamper evidence requires a
  separate security design.

## Reconsideration criteria

Hyperkernel will not add another database merely because a client-server engine
has a higher theoretical limit. Reconsideration requires a supported goal that
SQLite cannot meet with acceptable operational complexity.

Evidence may include:

- a required deployment needs multiple active writer nodes, remote database
  access, or automatic database failover;
- representative peak load exceeds defined command-latency or error-rate
  objectives after applying the finite mitigations documented in the capacity
  contract;
- writer lock wait or `SQLITE_BUSY` failures consume the agreed error budget;
- database or WAL growth exceeds the validated single-host capacity envelope;
- backup, integrity checking, restore, upgrade, or full projection rebuild
  cannot meet defined recovery objectives or maintenance windows;
- a supported hosting environment cannot provide reliable local persistent
  storage;
- required tenant isolation or resource governance cannot be achieved safely
  within the SQLite deployment model.

Before adding another engine, Hyperkernel must:

1. reproduce and document the SQLite limitation under a representative
   workload;
2. define the missing capability and the supported deployment that requires it;
3. preserve the event-store semantic contract through engine conformance tests;
4. test atomic commit, ordering, optimistic concurrency, rollback, crash
   recovery, replay, backup, and restore on every supported engine;
5. provide migration, rollback, operations, and upgrade procedures;
6. record the new decision and its compatibility consequences in a separate
   design record.

Any database migration must preserve complete command requests and lifecycle
decisions, event identities and grouping, stream identities and versions,
logical positions, schema versions, idempotency keys, actor, causation and
correlation metadata, payloads, and integrity constraints. Source and target
counts and digests are verified before projections are rebuilt and checked
against clean replay. Cutover and rollback procedures must account for every
event accepted after migration begins. Replacing SQLite does not require
replacing event sourcing.

## Evaluation

This record may advance to Evaluation when the repository contains:

- an approved event-schema evolution contract and a production append-only event
  table with strict constraints and runtime validation;
- one complete command flow proving atomic decisions, events, required kernel
  projections, checkpoints, optimistic concurrency, and idempotency;
- isolated extension projection processing with atomic checkpoints, protected
  rebuild, atomic cutover, and clean-replay equivalence;
- crash, rollback, contention, checkpoint, backup, restore, and integrity tests
  using the intended production durability settings;
- a capacity contract defining reference hardware, dataset and event shape,
  projection fan-out, concurrent load, test duration, safety headroom, latency
  and error budgets, database and WAL limits, projection lag, rebuild and backup
  windows, RPO, and RTO;
- measurements demonstrating that SQLite satisfies that capacity contract.

It may advance to Stable after representative self-hosted use demonstrates the
documented capacity and recovery envelope, and supported upgrades preserve
historical replay and restore guarantees.

## References

- [Hyperkernel public architecture](../../README.md)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [0001: Event schema evolution](0001-event-schema-evolution.md)
- [SQLite: Appropriate Uses For SQLite](https://sqlite.org/whentouse.html)
- [SQLite: Write-Ahead Logging](https://sqlite.org/wal.html)
- [SQLite: Isolation In SQLite](https://sqlite.org/isolation.html)
- [SQLite: Transaction](https://sqlite.org/lang_transaction.html)
- [SQLite: PRAGMA synchronous](https://sqlite.org/pragma.html#pragma_synchronous)
- [SQLite: Backup API](https://sqlite.org/backup.html)

## Status history

| Date       | Status      | Reason                                             |
| ---------- | ----------- | -------------------------------------------------- |
| 2026-07-27 | Development | Design chosen; production implementation underway. |
