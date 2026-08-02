# 0008: Process orchestration and actor model evaluation

| Field        | Value             |
| ------------ | ----------------- |
| Status       | Draft             |
| Scope        | Kernel, Extension |
| Created      | 2026-08-02        |
| Last updated | 2026-08-02        |

## Summary

Hyperkernel should evaluate an orchestration model as a third architectural
responsibility alongside its write and read models. The write model decides
and records accepted facts through commands and events. The read model derives
and exposes state through projections and queries. The proposed orchestration
model would coordinate work that spans multiple committed events, commands,
and external effects.

A procedure is the candidate declarative, versioned definition of such a
process. A run would represent one durable execution, such as a specific
onboarding flow. Effects, attempts, timers, schedulers, and workers are other
possible orchestration-model primitives. The Actor Model is a candidate runtime
for isolating each run, routing events to it, serializing its local decisions,
and supervising child workers that perform external effects.

This record does not adopt the Actor Model, define a supported `procedure` API,
or add a third model to the stable architecture. It preserves the idea for
future evaluation and defines the boundaries any experiment must respect.

## Problem

Hyperkernel currently has two clear conceptual paths:

- the write model accepts commands and records events;
- the read model builds projections and serves queries.

External effects and longer-running processes do not fit completely inside
either path. An effect such as sending an email or charging a payment cannot
run inside deterministic projection replay. A process such as onboarding may
wait for several events, maintain progress, request multiple effects, react to
their outcomes, and submit further commands over an extended period.

Treating all of this as part of the write model risks conflating the atomic
command transaction with asynchronous work that may fail after commit. Treating
it as a projection would allow replay to repeat external work. Implementing each
process as unrelated listeners, queues, and workers would distribute its state,
retry, recovery, and audit behavior across infrastructure without one explicit
contract.

Hyperkernel needs to determine whether process orchestration deserves its own
model and whether the Actor Model provides useful execution semantics without
becoming a second source of truth or weakening command, event, replay, and
external-effect invariants.

## Working vocabulary

This vocabulary exists only to make the evaluation precise. It is not yet a
public API.

- **Procedure** — a declarative, typed, and versioned definition of a process.
  It describes the events it consumes, the state transitions it permits, and
  the commands or effects it may request.
- **Run** — one identified, durable execution of a procedure, such as the
  onboarding of one organization. It has a lifecycle, current procedure
  version, correlation identity, and recoverable progress. `Process instance`
  is a descriptive synonym, not an additional candidate primitive.
- **Effect** — one identified request to interact with something outside the
  authoritative database, such as sending an email, charging a payment, or
  invoking an agent tool. An effect describes the requested external work; it
  is not evidence that the work was attempted or completed.
- **Attempt** — one concrete try to perform an effect. One effect may have
  multiple attempts under its delivery policy. Each attempt records a stable
  identity, timing, worker ownership, and a succeeded, failed, or unconfirmed
  outcome without changing the identity of the original effect.
- **Timer** — a durable request to make a run eligible for another step at or
  after a specified instant. A timer produces an idempotent wake-up message; it
  does not run procedure logic or an external effect by itself.
- **Scheduler** — kernel runtime machinery that finds eligible runs, timers, or
  effect attempts and offers bounded work to a worker. Scheduling policy must
  not become an undeclared source of domain decisions.
- **Worker** — a supervised execution unit for bounded work, such as handling a
  run message or performing one effect attempt. A worker does not receive
  authority to bypass the command or effect boundaries.
- **Runtime actor** — a possible execution unit that isolates one run, receives
  messages through a mailbox, and handles them sequentially. It may supervise
  workers but does not replace their durable scheduling and attempt contracts.
- **Authorized actor** — the existing Hyperkernel identity attributed to a
  command or event. It is distinct from a runtime actor in the Actor Model.

The candidate relationships are:

| Concept   | Relationship                                                       |
| --------- | ------------------------------------------------------------------ |
| Procedure | Defines the behavior and allowed capabilities of runs.             |
| Run       | Executes one version of a procedure and coordinates durable steps. |
| Timer     | Makes a run eligible for a future step.                            |
| Effect    | Records external work requested by a run.                          |
| Attempt   | Records one try to perform an effect.                              |
| Scheduler | Selects eligible work without deciding domain outcomes.            |
| Worker    | Handles one bounded unit of scheduled work.                        |

The word `actor` is therefore overloaded. Any experiment must qualify
`runtime actor` and `authorized actor`, or choose different public terminology,
until the ambiguity is resolved.

## Invariants

1. Durable domain state changes only through commands that append events.
2. A procedure, run, runtime actor, scheduler, or worker never appends a domain
   event directly. It submits a command whose accepted outcome may append
   events.
3. An external effect executes only through a durable delivery boundary. The
   effect keeps one stable identity across separately recorded attempts.
4. Every attempt records a known outcome or an explicit unconfirmed outcome.
5. A timer and its wake-up message are durable and idempotent. A late or
   duplicate wake-up does not silently execute the same process step twice.
6. Replaying domain events never intentionally repeats an external effect.
7. In-memory actor state is disposable and never the sole source of durable
   process truth.
8. Domain-relevant process progress is represented by durable facts that remain
   auditable and interpretable after restart or upgrade.
9. Operational state such as mailboxes, checkpoints, leases, timers, and
   attempts is durable when losing it could lose or duplicate work.
10. Handling a process message and recording every resulting durable request
    must have an atomicity or deduplication contract that closes crash windows.
11. Every run, message, timer, command submission, process step, effect, and
    attempt has a stable identity suitable for idempotency and causation.
12. Sequential handling within one run does not replace optimistic concurrency
    at the command boundary.
13. A run receives only its declared events and capabilities. Scheduling or
    spawning a worker cannot widen those capabilities.
14. Process retries preserve the identity and meaning of the work being retried.
15. An unconfirmed external outcome is reconciled before an unsafe retry.
16. Procedure and process-state versions remain interpretable for as long as
    durable runs depend on them.
17. Recovery after process termination resumes from durable progress rather than
    relying on in-memory lifecycle callbacks.
18. A failed run may become delayed or unavailable without corrupting the
    canonical event log or rolling back an already committed command.

## Proposed direction

### Separate orchestration responsibility from read and write responsibility

The leading hypothesis is a three-part conceptual architecture:

| Model         | Responsibility                                                     | Candidate primitives                                                 |
| ------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Write         | Decide whether intent is accepted and record authoritative facts.  | Commands and events                                                  |
| Read          | Derive and expose queryable views of accepted facts.               | Projections and queries                                              |
| Orchestration | Coordinate durable work across facts, time, commands, and effects. | Procedures, runs, effects, attempts, timers, schedulers, and workers |

This is a separation of responsibility, not permission to create an independent
authority. The orchestration model would consume committed facts, maintain
recoverable progress, request external work, and submit new intent through the
write model. It would read domain state through supported queries or state
derived from the events declared by the procedure.

`Orchestration model` is the current working name because it describes the
coordination responsibility shared by these candidate primitives. `Process
model` emphasizes the domain concept but may hide effects and scheduling.
`Execution model` is broader and could be confused with the execution semantics
of the whole kernel. The final name remains open.

### Treat procedures as process definitions

A procedure could define:

- a stable type and version;
- a schema for starting or correlating a run;
- the event types and versions it consumes;
- a deterministic transition from current durable progress and one message to
  a proposed next step;
- the commands and effect types it is allowed to request;
- capability and authorization requirements;
- completion, cancellation, compensation, and failure states;
- resource, concurrency, and retention limits.

The definition should describe intent and transition rules. It should not expose
mailbox storage, worker placement, SQLite transactions, or a specific actor
library as part of the public contract unless evaluation proves those details
must be stable.

### Evaluate the Actor Model behind the procedure contract

The Actor Model is attractive because one runtime actor could encapsulate the
state and behavior of one run. A mailbox could serialize messages for that run,
while supervision could isolate failures and restart or replace child workers.
A parent runtime actor could spawn bounded workers for independent effects
without distributing the whole procedure across unrelated listeners.

The runtime hypothesis is:

1. A committed event is read from the ordered event log.
2. The scheduler makes the affected run eligible and routes a stable message to
   its runtime actor or worker.
3. One runtime actor handles one message at a time for that run.
4. The procedure proposes updated progress, command submissions, or effect
   requests within its declared capabilities.
5. The runtime records progress, its checkpoint, and resulting durable requests
   atomically where required, or uses stable identities to deduplicate every
   retried step.
6. Commands pass through the normal command boundary. They may append further
   events only after validation, authorization, idempotency, and concurrency
   checks.
7. A scheduler makes an effect eligible under its delivery policy. An effect
   worker records a new attempt before interacting with the external system.
8. The worker records the attempt outcome and reconciles an ambiguous remote
   outcome before any unsafe retry.
9. Relevant outcomes return to the run as committed facts or validated
   runtime messages.

This flow is an evaluation target, not a chosen persistence or scheduling
design.

### Keep actor state subordinate to durable Hyperkernel state

Actor-local memory can make process code easier to reason about, but it cannot
be the only record of progress. A terminated process, deployment, or machine
must not erase or silently rewind an onboarding flow.

An experiment should distinguish:

- domain facts about the process, recorded through commands and events;
- derived process state that can be reconstructed from those facts;
- operational state, including mailboxes, checkpoints, ownership leases,
  effect attempts, and unconfirmed outcomes;
- disposable in-memory state used only while one runtime actor is active.

It remains open whether every run should have a dedicated event stream, derive
its state from correlated domain events, or use a combination of domain events
and kernel-owned operational records. No option may create a hidden mutable
source of authoritative domain truth.

### Separate effects from attempts

An effect identifies the external work requested by a run. An attempt identifies
one try to perform that work. A retry creates a new attempt for the same effect;
it does not create a new logical effect or silently change its input.

This distinction lets the runtime report that an effect is pending, succeeded,
failed, exhausted, cancelled, or unconfirmed while preserving the history of
each try. The scheduler applies the effect's delivery policy, and a worker
performs one claimed attempt. Neither component decides whether the original
domain intent was accepted.

### Make time explicit through timers and schedulers

A procedure may request a timer when a run must wait until a future instant or
deadline. The timer is stored before the run suspends. At or after its target
instant, the scheduler makes a stable wake-up message eligible for delivery.
Handling the same wake-up more than once must remain safe.

A timer is not a promise of exact wall-clock execution. Its contract needs to
define lateness, cancellation, duplicate delivery, clock changes, downtime, and
recovery. Procedure transitions consume the recorded wake-up message rather
than reading the ambient clock to decide that time passed.

The scheduler owns eligibility, fairness, backpressure, and bounded work
distribution. It does not own procedure transitions or domain authorization.
This keeps scheduling policy replaceable and prevents a worker queue from
becoming another write model.

### Supervise workers without hiding effect semantics

Spawning workers may isolate slow or failure-prone work, but supervision is not
an effect-delivery guarantee. A worker crash, timeout, or restart still requires
durable claim ownership, idempotency, attempt history, and reconciliation.

Child workers should receive bounded inputs and capabilities from their parent
run. Their lifecycle, cancellation, and result messages need stable
identities. They must not inherit unrestricted process, network, filesystem, or
database access merely because they were spawned by a trusted runtime actor.

`Spawn` would describe a logical parent-child relationship, not direct creation
of an operating-system thread or process. The runtime actor may request and
supervise child work while the scheduler decides when and where a worker
executes it.

### Preserve deterministic replay

Procedure transition logic should be deterministic for the same process state
and input message. Clocks, randomness, network calls, and tool calls belong
behind explicit recorded inputs or effect requests.

Rebuilding process state may reconstruct which steps were requested and which
outcomes were recorded. It must not resend email, repeat a payment, invoke an
agent tool, or otherwise reproduce an external effect. Delivery history and
stable step identities must prevent replay from being mistaken for new work.

## Failure, recovery, and concurrency questions

An actor runtime would not remove distributed-systems failure modes even in a
single-process SQLite deployment. Evaluation must define:

- what commits atomically when one run message is handled;
- how a message is redelivered after a crash without duplicating commands or
  effects;
- how poison messages are quarantined without advancing the wrong checkpoint;
- how a failed or blocked run becomes observable and resumable;
- how ownership, leases, and fencing work if multiple runtime workers are later
  introduced;
- how cancellation interacts with already committed commands and effects whose
  remote outcomes are unknown;
- how parent and child failures propagate or remain isolated;
- how run completion, compensation, and manual intervention are represented;
- how timers or scheduled wakeups become durable, testable inputs rather than
  ambient clock reads;
- how procedure upgrades handle active runs on older versions.

Sequential mailbox processing may simplify local reasoning, but it guarantees
neither exactly-once delivery nor global ordering. The event log position,
run identity, message identity, command idempotency, and effect delivery
policy remain explicit contracts.

## Considered solutions

### Keep effects and procedures inside the write model

This keeps the top-level architecture smaller and may be sufficient while only
short post-commit effects exist.

It is not the leading conceptual model for evaluation because a committed
command, a long-running process, and an external delivery have different
atomicity, replay, retry, and recovery semantics. They may still share internal
kernel infrastructure without sharing one architectural responsibility.

### Add an orchestration model with an actor-based runtime

This is the primary hypothesis. It gives long-running coordination a named
boundary and may isolate each run behind sequential message handling and
supervision.

Its cost is a durable mailbox, lifecycle, scheduling, supervision, versioning,
observability, and recovery contract. The actor abstraction is useful only if
these semantics are explicit; an in-memory actor library alone would not satisfy
the proposal.

### Expose actors as the public process API

Applications could define actors directly, send arbitrary messages, own mutable
state, and spawn child actors.

This is not proposed now. It would couple public extensions to mailbox,
placement, lifecycle, serialization, and supervision semantics before
Hyperkernel knows which of them are essential. It could also encourage direct
event emission or hidden actor state that bypasses kernel contracts.

### Use explicit state machines without actors

A versioned workflow or state-machine runtime could represent states,
transitions, timers, commands, and effect requests without exposing actors.

This may be more inspectable and deterministic, but it can become rigid for
processes with dynamic fan-out or independent child work. It remains the main
alternative to compare against the actor hypothesis in a concrete experiment.

### Use event choreography only

Independent event listeners could react to facts and submit their own commands
or effects without one process coordinator.

This minimizes central orchestration and is suitable for loosely coupled
reactions. It becomes difficult to answer which step an onboarding instance is
in, who owns recovery, whether the whole process completed, or how compensation
and version upgrades work. Choreography should remain available for simple
reactions but is not sufficient as the only orchestration model.

## Consequences

### Gains

- Long-running work receives an explicit boundary instead of being hidden in
  command handlers, projections, or unrelated listeners.
- One run can encapsulate its progress, allowed behavior, and failure surface.
- Actor-style sequential handling may reduce local concurrency complexity.
- Supervision may isolate child work and make failure ownership visible.
- A procedure contract can remain stable even if the runtime later changes.

### Costs and limitations

- A third conceptual model adds vocabulary and another public contract to learn.
- Durable mailboxes, scheduling, supervision, and process versioning add
  substantial implementation and test surface.
- Actor-local reasoning can hide system-wide causation and delivery behavior if
  observability is weak.
- The term `actor` conflicts with Hyperkernel's existing identity vocabulary.
- Actor isolation does not provide exactly-once processing, effect safety, or
  deterministic recovery by itself.

### Maintenance cost

Maintainers would need to preserve procedure schemas and active-version
compatibility, operate process migrations, diagnose stuck instances, and test
crash windows across message handling, command submission, and effect delivery.
Every runtime feature added to the procedure API would become a long-term SDK
and compatibility obligation.

### Operational complexity

The orchestration runtime may require durable inboxes or mailboxes, checkpoints,
leases, attempt records, dead-letter or quarantine states, backpressure,
resource limits, reconciliation, and administrative recovery tools. These
should be introduced only for a concrete process that proves their need.

### Scaling implications

Run isolation could support parallel work across many runs while preserving
sequential handling within each run. Dynamic child workers could express
fan-out, but unbounded spawning or mailbox growth would amplify load and
storage. A future multi-process deployment would additionally need placement,
durable ownership, fencing, and rebalancing; no public contract should assume
those capabilities before they are required and tested.

## Open questions

- Should the third responsibility be named process, orchestration, execution,
  workflow, or something else?
- Is `procedure` the right public name for a declarative process definition?
- Which run progress is a domain fact, which is a projection, and which is
  kernel-owned operational state?
- Should a run have its own event stream or derive progress from correlated
  domain events?
- What message ordering is guaranteed across event types and runs?
- What must commit atomically with a process checkpoint?
- Can the initial SQLite runtime implement the needed mailbox and ownership
  semantics without a separate broker?
- Which scheduler policies belong to the stable contract, and how are eligible
  work, fairness, backpressure, and resource limits represented?
- How are timers, human approvals, compensation, cancellation, and manual
  recovery represented?
- Which attempt outcomes are durable audit data, and what is their retention
  policy?
- How do active runs migrate when a procedure changes version?
- Does an Actor Model experiment materially simplify a real process compared
  with an explicit state machine?
- Can runtime-actor terminology remain internal so authorized actor identity
  stays unambiguous in public contracts?

## Decision boundary

This record proposes an evaluation boundary, not an implementation decision. A
future record or material revision must choose:

- whether Hyperkernel formally adds an orchestration model;
- the public procedure, run, effect, attempt, timer, scheduler, and worker
  contracts;
- whether the Actor Model is internal machinery, a public abstraction, or not
  used;
- the persistence, delivery, supervision, versioning, and recovery semantics;
- the smallest concrete process that justifies the additional model.

Until then, existing command, event, projection, query, and external-effect
contracts remain authoritative. No implementation may cite this Draft as
permission to append events directly, store authoritative state only in memory,
or redispatch effects during replay.

## Evaluation

This record may advance to Development only after a concrete process, such as
onboarding, is modeled both as an explicit state machine and as an actor-based
procedure. The comparison must document gains, losses, maintenance cost,
operational complexity, and scaling implications.

The chosen experiment must also demonstrate:

- durable recovery after termination between every persistence boundary;
- duplicate message delivery without duplicate commands or effects;
- an unconfirmed external effect followed by safe reconciliation;
- deterministic process-state reconstruction without effect redispatch;
- sequential handling for one run and parallel handling across independent
  runs;
- bounded child-worker spawning and capability inheritance;
- observable failure, quarantine, retry, cancellation, and manual recovery;
- procedure-version compatibility for an active run;
- preservation of the command, event, projection, replay, authorization, and
  audit invariants;
- review and approval by an experienced human maintainer for the Kernel
  contracts.

## References

- [Hyperkernel public architecture](../../README.md)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [0001: Event schema evolution](0001-event-schema-evolution.md)
- [0002: Event-sourced persistence with SQLite](0002-event-sourced-persistence-with-sqlite.md)
- [0005: Agent-generated application specifications](0005-agent-generated-application-specifications.md)
- [0006: Error handling and recovery](0006-error-handling-and-recovery.md)

## Status history

| Date       | Status | Reason                                                     |
| ---------- | ------ | ---------------------------------------------------------- |
| 2026-08-02 | Draft  | Actor-based process orchestration recorded for evaluation. |
