# Hyperkernel experiment retrospective

| Field              | Value                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence status    | Historical                                                                                                                                     |
| Relevant scopes    | Kernel, Extension, Experience                                                                                                                  |
| Experiment dates   | 2026-08-01 to 2026-08-02                                                                                                                       |
| Retrospective date | 2026-08-02                                                                                                                                     |
| Repository         | [`hnordt/hyperkernel-experiment`](https://github.com/hnordt/hyperkernel-experiment)                                                            |
| Evaluated revision | [`48527996a23c5dfde85426d7350bc7928f78a616`](https://github.com/hnordt/hyperkernel-experiment/commit/48527996a23c5dfde85426d7350bc7928f78a616) |
| Disposition        | Archive the experiment repository and retain it only as a read-only historical reference                                                       |

> [!IMPORTANT]
> This report records evidence from an intentionally small prototype. It does
> not make the experiment's API, database schema, replay implementation,
> benchmark results, or interface a supported Hyperkernel contract. `README.md`,
> `AGENTS.md`, and the official design records remain authoritative. When the
> experiment conflicts with them, the official repository wins.

## Recommendation

Preserve the product and architectural ideas that the experiment made concrete:
an ordered event log, atomic event and projection writes, constrained projection
SQL, historical reads at a stable event position, and an interface that makes
the difference between live and historical state unmistakable.

Do not promote the experimental runtime or schema into the official repository.
Reimplement those ideas through the official command audit, event versioning,
authorization, concurrency, projection checkpoint, rebuild, recovery, and
external-effect contracts. Archive the experiment after this retrospective so
future work treats it as evidence rather than as a second implementation to
maintain.

## Questions the experiment answered

The work began as a deliberately small implementation of commands, events,
listeners, effects, synchronous SQLite projectors, and typed queries. It then
grew into one Todo application implemented through three persistence lanes, a
lifecycle benchmark, and a browser interface for inspecting events and
historical state.

It provided useful evidence for three questions:

1. Can the current command, event, projection, and query vocabulary form a small
   runnable system without hiding SQLite's behavior?
2. Which costs come from retaining authoritative history, and which come from
   avoidable kernel implementation overhead?
3. Can event history and time travel become understandable product capabilities
   rather than backend concepts visible only to developers?

The answer to all three was yes within the experiment's narrow single-process,
single-writer Todo workload. The experiment did not establish the production
contracts needed to generalize those answers.

## What was implemented

### Kernel path

The evaluated runtime performs one explicit dispatch sequence:

1. Parse the command input with Zod.
2. Invoke the synchronous command handler and validate the event created through
   `raise()`.
3. Build projection SQL and post-commit effect descriptions.
4. Start `BEGIN IMMEDIATE`.
5. Append one event and execute its synchronous projector statements.
6. Commit, or roll back the event and all projection writes together.
7. Run queued effects sequentially after commit and await them before
   `dispatch()` resolves.

The SQL template converts interpolated values into bound parameters. SQLite
authorizers limit a projector to its declared table and limit a query to the
tables declared in `reads`. Prepared statements are cached separately by event
log, projector, and query scope so identical SQL text is not reused across
authorization boundaries.

This path demonstrated atomic event and projection persistence, runtime input
and output validation, table-scoped SQL execution, and explicit post-commit
effects. It did not record the submitted command or its lifecycle decision.

### Todo comparison

All lanes implement the same `TodoStore` contract, use one long-lived
`DatabaseSync` connection, require WAL mode, and execute each create or erase in
its own `BEGIN IMMEDIATE` transaction.

| Lane         | Write path                                                   | Retained history | Purpose                                        |
| ------------ | ------------------------------------------------------------ | ---------------- | ---------------------------------------------- |
| CRUD         | Prepared SQL directly mutates `todos`                        | None             | Minimal traditional baseline                   |
| Audited CRUD | Appends the same domain event and mutates `todos` atomically | Yes              | Separates history cost from framework overhead |
| Hyperkernel  | Dispatches a command, appends an event, and runs a projector | Yes              | Exercises the architecture under test          |

The audited CRUD control was essential. It retained the same event count, event
representation, and replayable Todo history as the Hyperkernel lane. That made
it possible to distinguish the cost of preserving history from costs introduced
by the runtime around that history.

### Historical inspection

The Todo interface places the current projection and event log side by side. In
Hyperkernel mode a user can select an event or move a position slider to inspect
the Todo state after that log position.

The semantics were appropriately narrow:

- a historical view is an ephemeral, read-only projection;
- selecting history does not rewrite or replace the live projection;
- replay folds stored events into a new in-memory `Map`;
- replay does not dispatch commands or run effects;
- the interface labels `Live` and `Event #N` states explicitly;
- mutation controls are disabled in historical mode;
- `Return to live` provides an obvious exit from historical inspection.

This is the strongest product learning from the experiment. Putting the log,
selected position, and derived state in one workspace made event sourcing's
causal model directly inspectable. Time travel felt useful because it answered a
concrete question — "what did the application look like after this accepted
fact?" — without pretending to rewind external reality.

The interface demonstrates the value of complete retained history, not that only
the Hyperkernel implementation can provide it. The audited CRUD control has the
same event history and replay result in the contract tests; the architectural
difference depends on which representation is authoritative and which recovery
guarantees the platform enforces.

## What worked well

### The architecture became executable and inspectable

The flat resource definitions made the intended vocabulary easy to exercise:
commands accepted intent, events represented facts, projectors produced current
read models, queries declared their dependencies, and effects occurred only
after commit. The implementation kept the important control flow visible rather
than hiding it behind an ORM or a generic persistence abstraction.

The test suite covered more than the happy path. It verified invalid input,
transformed Zod values, transactional rollback, duplicate definitions,
unregistered dependencies, reserved and duplicate tables, query mutation denial,
undeclared reads, authorization-scoped statement caching, malformed stored JSON,
store equivalence, HTTP validation, and event-log pagination.

### SQLite matched the bounded model

One synchronous connection and one writer produced a simple total order and an
easy-to-audit transaction boundary. `BEGIN IMMEDIATE` made the write-lock choice
explicit. The same relational table served normal CRUD and projected reads,
which reinforced that event sourcing does not prohibit conventional indexed SQL
read models.

### The historical interface communicated the right distinction

The interface used native labeled controls, visible focus, an `aria-live`
announcer, loading and retry states, and responsive layout. More importantly, it
kept "state equal to the latest position" distinct from "live mode, where new
writes may arrive." A snapshot at the current head remained read-only until the
user explicitly returned to live data.

That interaction should survive even if the slider and event list are replaced.
Position zero needs clearer copy such as "Before the first event" rather than
`Event #0`, but the underlying before-first-event state is useful and correct.

### The comparison used the right diagnostic control

A raw CRUD comparison alone would have attributed event serialization, append,
and storage to "kernel overhead." Audited CRUD paid those feature costs without
using the kernel runtime. That control turned the benchmark into a diagnostic
tool instead of a contest between semantically unequal implementations.

### Performance work preserved authorization boundaries

The first benchmark exposed scaling dominated by repeated per-operation runtime
work. The subsequent optimization retained one SQLite authorizer callback,
switched its active policy around authorized work, and cached prepared
statements by authorization scope with a bounded least-recently-used policy.

This is a reusable design lesson: performance-sensitive caches must include the
authority that made a resource valid. A global cache keyed only by SQL text
would be faster to write and unsafe to reuse. The regression tests that prevent
a projector-authorized statement from being reused by a query are as important
as the timing improvement.

## Performance evidence

### Recorded baseline before statement caching

`BENCHMARK_RESULTS.md` recorded nine cold-isolate samples per lane on 2026-08-01
with Deno 2.9.4, SQLite 3.53.2, and macOS on Apple Silicon. The report predates
the statement-cache and stable-authorizer optimization merged in
[pull request 2](https://github.com/hnordt/hyperkernel-experiment/pull/2), so
its numbers describe an earlier implementation rather than the evaluated
revision. The Todo comparison and baseline entered `main` through
[pull request 1](https://github.com/hnordt/hyperkernel-experiment/pull/1) at
00:29 UTC on 2026-08-02; the optimization merged later at 03:58 UTC.

| Lifecycle    | Hyperkernel median | Hyperkernel / CRUD | Hyperkernel / audited CRUD | Hyperkernel / CRUD full-list read |
| ------------ | -----------------: | -----------------: | -------------------------: | --------------------------------: |
| 1,000 Todos  |          296.07 ms |              4.56x |                      3.50x |                             1.06x |
| 10,000 Todos |        9,147.53 ms |             17.65x |                     12.66x |                             1.70x |

The initial result established two useful facts:

- full-list reads against the shared projection shape were comparatively close;
- audited CRUD retained the same number of events and similar storage while
  remaining much faster, so history retention alone did not explain the gap.

The widening point-read and erase curves identified repeated statement and
authorizer lifecycle work as the first implementation target. The benchmark did
not by itself prove that diagnosis; the optimization and SQLite call
instrumentation provided the follow-up evidence.

### Verification after statement caching

During this retrospective, the benchmark was rerun locally at the evaluated
revision with the same Deno and SQLite versions. Each run used one warmup and
nine measured cold-isolate samples. The 1,000-Todo run used five full-list
reads; the 10,000-Todo run used three.

```sh
deno task todo:bench --todos=1000 --warmup=1 --samples=9 --list-reads=5
deno task todo:bench --todos=10000 --warmup=1 --samples=9 --list-reads=3
```

All timing columns below are medians in milliseconds.

|  Todos | Lane         | Create | Point read | List read |  Erase | Lifecycle |
| -----: | ------------ | -----: | ---------: | --------: | -----: | --------: |
|  1,000 | CRUD         |  23.86 |       6.38 |      9.72 |  16.36 |     56.44 |
|  1,000 | Audited CRUD |  33.69 |       6.63 |      9.32 |  25.33 |     74.91 |
|  1,000 | Hyperkernel  |  34.82 |       8.25 |      9.70 |  33.50 |     86.22 |
| 10,000 | CRUD         | 180.74 |      53.74 |     51.11 | 155.14 |    441.13 |
| 10,000 | Audited CRUD | 262.62 |      54.03 |     51.13 | 243.20 |    612.56 |
| 10,000 | Hyperkernel  | 282.07 |      62.30 |     50.96 | 303.52 |    696.16 |

At this revision, Hyperkernel's median lifecycle was 1.53x and 1.58x the CRUD
lane, and 1.15x and 1.14x the audited CRUD lane, for 1,000 and 10,000 Todos. The
curve was approximately linear across those two sizes, unlike the recorded
pre-optimization baseline.

These measurements are an ad hoc verification of the optimization, not a
replacement for the checked-in historical baseline or a portable performance
guarantee. The environment was Deno 2.9.4, V8 15.0.245.2-rusty, TypeScript
6.0.3, SQLite 3.53.2, and macOS 26.6 on an arm64 Mac Studio with an Apple M2 Max
and 32 GB of memory.

The current harness also verifies that one Hyperkernel lifecycle prepares five
statements and installs one authorizer callback instead of repeating those
operations for every Todo. That evidence is more durable than any one machine's
latency ratio because it tests the intended optimization mechanism directly.

### What the benchmark does and does not measure

The harness validates every result and database, rotates lane order, uses fresh
file-backed databases, isolates each lifecycle in a new worker, and leaves input
generation, migrations, worker startup, integrity checks, reporting, and cleanup
outside timed regions. Runtime validation, serialization, SQLite calls,
authorizer work, and transaction commits remain inside.

It is a cold-isolate sequential lifecycle benchmark. It is not evidence for:

- steady-state latency in an already-warmed server;
- concurrent readers or competing writers;
- command admission, authorization, command audit, idempotency, or optimistic
  concurrency costs;
- completion changes, rejected commands, no-ops, or missing subjects;
- multiple events, projection fan-out, extension projection lag, or outbox
  delivery;
- projection rebuild, checkpoint, backup, restore, or upgrade duration;
- production durability settings or a supported capacity envelope.

Absolute latency against a representative workload remains the decision
boundary. Ratios alone are not a pass/fail threshold. Nine samples are also too
few for a useful p95 estimate; the harness correctly reports the maximum in that
configuration.

## Boundaries the final design must not inherit

### Command and event contracts are incomplete

The prototype stores only event position, type, and JSON data. It has no durable
command request, command identity, actor, received/rejected/failed/committed
decision history, authorization decision, idempotency key, expected stream
version, event identity, schema version, recorded time, cause, or correlation
metadata. A command may raise at most one event, and returning `undefined`
silently performs no durable work.

These omissions were deliberate for a small experiment. They exclude the runtime
from the official command audit, compatibility, concurrency, and recovery
contracts.

### Event immutability is conventional, not enforced

The projector and query authorizers constrain SQL only while those callbacks
run. The shared `DatabaseSync` connection remains available outside those
scopes, and direct SQL can update or delete `__hyperkernel_events`. The schema
contains no trigger or separate connection or privilege boundary that rejects
such mutations.

The experiment therefore demonstrates an append path, not an append-only system.
Production code must expose no supported event mutation path and must keep the
database connection behind the kernel boundary.

### Table isolation is not projection determinism

The authorizer prevents a projector from reading or writing undeclared tables,
but it permits SQLite functions generally. A verification probe successfully
used `random()` in projector SQL and persisted the result. Equivalent projection
SQL can depend on the clock or other nondeterministic SQLite behavior.

Table-scoped authorization also does not constrain ambient JavaScript used by a
command handler, listener, or SQL builder, and projector execution does not
check affected row counts or application invariants before commit.

The final projection boundary must enforce the official deterministic handler
contract. Restricting table names is necessary but insufficient; the runtime
must also constrain functions and ambient inputs or provide a narrower
deterministic execution surface.

### Projection and replay infrastructure is application-specific

The kernel has no public event reader or replay API. `event_log.ts` reads the
private `__hyperkernel_events` table directly, selects every event through the
requested position, validates Todo-specific payloads, and folds them in memory.

There are no projection versions, checkpoints, incremental extension workers,
lag or failure status, clean rebuilds, replacement projections, atomic cutover,
historical codecs, or interrupted-rebuild recovery. The Todo tests verify a
small domain reducer, not the general incremental-versus-clean-replay contract.

Every projector application that handles the emitted event also executes inside
the authoritative transaction. That is appropriate only for the small set of
kernel projections that require strong consistency; extension projections need
the isolated checkpointed runtime described by the official architecture.

The live Todo projector is implemented as SQL rules while historical replay is a
separate TypeScript `switch`. The exercised tests keep those two paths aligned
for the sample domain, but two independently maintained interpretations can
drift. The final runtime needs versioned projection semantics used consistently
for incremental processing and rebuild, plus explicit equivalence tests.

Historical inspection is currently `O(events)` for every selected position. That
is acceptable for demonstrating the interaction and not a scalable replay
design.

### Single-writer pre-reads are not a concurrency contract

Todo completion and deletion query the current projection before dispatch so a
missing or no-op mutation does not append a false fact. The code explicitly
relies on one connection and one writer, with no `await` between the pre-read
and dispatch.

Under competing writers, the precondition could change before the event and
projection transaction. Production handlers need expected versions or an
equivalent rule checked inside the authoritative command transaction. Projector
row counts and invariants must also be checked before commit.

### Effects are neither durable nor isolated from persistence

`queue()` means "run after commit before `dispatch()` resolves." There is no
outbox, delivery identity, retry, deduplication, attempt record, reconciliation,
or crash recovery. An effect failure rejects `dispatch()` after the event and
projection already committed, which can make the caller's apparent failure
ambiguous.

Effects receive the complete kernel environment, whose type requires the shared
database connection. An effect can therefore bypass the command and projection
boundaries. The final design must separate private kernel infrastructure from
the minimal external capabilities supplied to each effect and deliver effects
through the durable boundary defined in `AGENTS.md`.

### Definition provenance is not settled

Values returned by `raise()` and `queue()` carry a private symbol and are
checked before use. Resource descriptors and `SqlStatement` remain structurally
constructible, however. If factory provenance, bound parameters, and trusted
definition construction are part of the final security boundary, the public SDK
needs opaque handles and runtime provenance checks rather than relying only on
TypeScript structure.

### The SQLite settings are benchmark settings, not a durability decision

The Todo databases use WAL with `synchronous=NORMAL`. This is a reasonable local
comparison setting, but the official SQLite design notes that recent commits may
be lost after an operating-system crash or power loss under that setting. A
production event store requires an explicit durability contract, tested backup
and restore, WAL checkpoint management, bounded lock handling, and recovery
procedures.

### Historical UI reads are not one consistent snapshot

The browser requests the Todo snapshot and event page concurrently through two
HTTP requests. They share no captured head position or consistency token. A
write between the two reads can make the displayed projection, event count, and
head position describe different database moments.

A production historical API should bind projection data, event metadata, and the
selected head to one stable event position and projection version. Live
interfaces should expose their observed projection checkpoint when causal
consistency matters.

The server also derives `latestPosition` from event count, and older-page
navigation performs arithmetic that assumes dense positions. The final contract
must use the authoritative log cursor without confusing position with count or
requiring positions to be gapless.

### Event inspection requires authorization and scale design

The experimental endpoint returns complete event payloads without an
authorization or redaction policy. The UI assigns payload text through
`textContent`, and the server sends a restrictive same-origin Content Security
Policy, which address injection risks but not unauthorized disclosure. Events
may contain fields that a user can see in a projection but may not inspect in
raw historical form.

The range input also maps every integer from zero to the latest event position,
and each selection performs full replay. At larger histories it loses useful
precision, generates repeated `O(events)` work, and cannot replace filtering,
search, pagination, checkpoints, or domain-oriented history views. The event
list paginates at 1,000 records but recreates the loaded DOM on every render.

The final interface should retain the simple position model while adding
capability-aware payload views, coherent snapshots, scalable navigation, and
purpose-built explanations of domain facts. It should also provide text-based
navigation, use a more accurate single-selection semantic than `aria-pressed`,
and receive browser and assistive-technology testing; the experiment has server
and contract tests but no UI browser suite.

## What should survive into the official implementation

| Experimental learning                                       | Official design requirement                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Event append and required projection update commit together | Include final command decision, events, required kernel projections, and checkpoints in one short transaction.                |
| Historical views target event position                      | Use a stable log position plus an explicit projection version; timestamps remain metadata.                                    |
| Historical state is visibly read-only                       | Keep live and historical modes unmistakable and never mutate or redispatch through replay.                                    |
| Log and projection appear together                          | Preserve causal inspection while adding actor, command, cause, version, authorization, and safe payload presentation.         |
| SQL is described rather than given a connection             | Keep database ownership inside the kernel and constrain projector and query access through reviewed capabilities.             |
| Authorization-scoped statement cache                        | Include authorization identity in cache keys and test that prepared resources cannot cross trust boundaries.                  |
| Audited CRUD benchmark lane                                 | Keep semantic controls that separate required feature cost from avoidable framework cost.                                     |
| One writer made ordering easy                               | Preserve a serialized append boundary while adding explicit contention, expected-version, idempotency, and recovery behavior. |

## Future evaluation protocol

Future experiments should remain small but attach each result to the exact
contract being tested.

For performance work:

- record the commit SHA, clean-diff status, exact command, runtime, embedded
  SQLite version, operating system, hardware, durability settings, raw samples,
  and benchmark configuration;
- replace checked-in baselines after material performance changes instead of
  leaving old results beside a new implementation without an explicit warning;
- separate cold-start, warmed steady-state, concurrent-read, contended-write,
  replay, rebuild, backup, restore, and upgrade measurements;
- retain audited controls, and ensure compared lanes implement equivalent
  validation, history, durability, and correctness guarantees;
- profile before attributing a timing curve to one internal cause;
- preserve security and deterministic-execution regression tests around every
  cache or fast path.

For product evaluation:

- test whether users understand live state, historical state, accepted facts,
  commands, and corrections without learning event-sourcing terminology first;
- verify keyboard, focus, screen-reader, reduced-motion, narrow-container, and
  long-history behavior in a real browser;
- test capability-aware event disclosure and useful redaction;
- show command outcome, event cause, projection checkpoint, and external-effect
  status without presenting them as one undifferentiated success;
- keep corrections in the live command path rather than offering an apparent
  mutation of historical state.

## Architectural assessment

### Gains

- The core event and projection model became concrete enough to inspect, test,
  benchmark, and improve.
- Historical inspection emerged as a compelling user capability rather than an
  internal recovery mechanism only.
- The audited control and later optimization showed that retained history and
  avoidable framework overhead can be measured separately.
- SQLite's single-writer transaction model remained understandable and aligned
  with a stable event order for the bounded deployment.

### Losses

- Retained history increases storage, backup, compatibility, replay, and privacy
  obligations even when current projection rows have been deleted.
- A trusted kernel adds validation, authorization, audit, versioning, and
  recovery work that direct CRUD does not provide by default.
- Historical meaning depends on preserved event codecs and projection artifacts,
  not only on storing JSON rows forever.

### Maintenance cost

The production cost is not the small dispatch loop. It is maintaining every
persisted event version, deterministic projector version, checkpoint and rebuild
path, outbox outcome, authorization rule, upgrade test, and operator recovery
procedure for as long as supported history exists. The experiment usefully made
that missing surface visible.

### Operational complexity

SQLite keeps the initial service topology small, but the system still needs WAL
checkpointing, capacity monitoring, consistent backups, restore verification,
contention policy, corruption handling, projection lag observation, and bounded
rebuilds. Event sourcing moves complexity into explicit platform contracts; it
does not remove it.

### Scaling implications

Normal reads can remain indexed relational queries and need not replay history.
Write amplification grows with the event append and synchronous projection
fan-out. Historical inspection needs checkpoints, reusable projection artifacts,
and bounded navigation as logs grow. SQLite remains suitable until a measured
supported workload fails its command-latency, contention, capacity, or recovery
objectives after finite optimizations.

### Invariants

Future implementation must preserve these lessons without inheriting the
prototype's shortcuts:

1. Event position, not timestamp, is authoritative ordering.
2. A committed state-changing command and its required synchronous derived state
   commit atomically.
3. Replay reads accepted history and never re-executes commands or external
   effects.
4. Historical inspection never mutates live state.
5. Projection handlers are deterministic and isolated, not merely restricted to
   one table.
6. Optimized resources never cross the authorization scope that created them.
7. The database connection remains private to the kernel.
8. Performance comparisons include the cost of equivalent guarantees.

### Decision boundary

The experiment supports continuing toward the official small vertical slice with
SQLite, event-sourced authority, relational projections, and first-class
historical inspection. It does not support copying `mod.ts`, adopting the
three-column event table, declaring the public SDK settled, or claiming
production readiness.

Revisit the bounded SQLite architecture only when a representative supported
workload or recovery objective fails the criteria in the official persistence
design. Revisit the interface mechanics when real histories make the slider,
full replay, or raw event list unusable; preserve the stable-position and
read-only semantics even if the controls change.

## Evidence required from the official vertical slice

Before these ideas can advance from historical evidence to an evaluated
Hyperkernel implementation, the official repository should demonstrate:

1. immutable command recording and append-only lifecycle decisions for received,
   rejected, failed, and committed outcomes;
2. actor, authorization, idempotency, expected-version, event-envelope, and
   historical-schema contracts;
3. atomic event, synchronous kernel projection, and checkpoint commits with
   rollback and interrupted-write tests;
4. deterministic incremental projection processing equal to clean replay, plus
   isolated rebuild and atomic cutover;
5. authorized public event and historical-query APIs bound to a stable event
   position and projection version;
6. durable outbox delivery with attempt history, idempotency or deduplication,
   ambiguous-outcome reconciliation, and no replayed effects;
7. tested durability, backup, restore, WAL, contention, upgrade, and recovery
   procedures;
8. versioned performance evidence and browser tests for historical inspection,
   accessibility, consistency, long histories, and protected payloads.

## Retrospective verification

At the evaluated revision:

- `deno task check` passed formatting, lint, type-checking, and all 32 tests;
- the two nine-sample benchmark commands above completed and validated every
  lane;
- focused in-memory probes confirmed nondeterministic projector SQL, direct
  event-log mutation through the shared connection, and event-log mutation from
  an effect receiving `env.database`;
- the experiment worktree remained clean after verification.

The probes document missing boundaries; they are not production tests in the
official repository. The interface review was static and the experiment has no
browser UI test suite, so visual, responsive, and assistive-technology behavior
remains unverified in this retrospective.

## Repository disposition

The experiment repository should be archived after this report is accepted. Its
final evaluated revision remains useful for archaeology, reproduction, and
understanding why later design decisions were made.

The official project must not depend on the archived repository, import it as a
package, treat its README as current guidance, or require it to reproduce a
supported production behavior. Useful code may be reimplemented in the official
repository only after the relevant contract and verification gate are satisfied.

## Evidence map

- [Experiment overview](https://github.com/hnordt/hyperkernel-experiment/blob/48527996a23c5dfde85426d7350bc7928f78a616/README.md)
- [Kernel implementation](https://github.com/hnordt/hyperkernel-experiment/blob/48527996a23c5dfde85426d7350bc7928f78a616/mod.ts)
- [Kernel tests](https://github.com/hnordt/hyperkernel-experiment/blob/48527996a23c5dfde85426d7350bc7928f78a616/mod_test.ts)
- [Todo comparison contract and methodology](https://github.com/hnordt/hyperkernel-experiment/blob/48527996a23c5dfde85426d7350bc7928f78a616/experiments/todo-comparison/README.md)
- [Recorded pre-optimization benchmark](https://github.com/hnordt/hyperkernel-experiment/blob/48527996a23c5dfde85426d7350bc7928f78a616/experiments/todo-comparison/BENCHMARK_RESULTS.md)
- [Hyperkernel Todo adapter](https://github.com/hnordt/hyperkernel-experiment/blob/48527996a23c5dfde85426d7350bc7928f78a616/experiments/todo-comparison/hyperkernel_store.ts)
- [Todo event reader and replay](https://github.com/hnordt/hyperkernel-experiment/blob/48527996a23c5dfde85426d7350bc7928f78a616/experiments/todo-comparison/event_log.ts)
- [Todo history interface](https://github.com/hnordt/hyperkernel-experiment/blob/48527996a23c5dfde85426d7350bc7928f78a616/experiments/todo-comparison/public/app.js)

## Related official records

- [Hyperkernel public architecture](../../README.md)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [Event schema evolution](../design/0001-event-schema-evolution.md)
- [Event-sourced persistence with SQLite](../design/0002-event-sourced-persistence-with-sqlite.md)
- [Web-platform-first frontend](../design/0003-web-platform-first-frontend.md)
- [Interface design philosophy](../design/0004-interface-design-philosophy.md)
- [Error handling and recovery](../design/0006-error-handling-and-recovery.md)
