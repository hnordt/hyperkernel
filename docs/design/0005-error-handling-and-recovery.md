# 0005: Error handling and recovery

| Field        | Value                         |
| ------------ | ----------------------------- |
| Status       | Draft                         |
| Scope        | Kernel, Extension, Experience |
| Created      | 2026-07-27                    |
| Last updated | 2026-07-27                    |

## Summary

Excellent error handling is a primary Hyperkernel goal rather than incidental
polish. Every operation exposed by a supported Hyperkernel contract must have an
explicit outcome, and every anticipated failure must reach a boundary that can
recover, retry safely, reconcile an uncertain outcome, or tell the user what
happened and what to do next.

Expected domain outcomes are represented as explicit results and command
decisions. Exceptional operational and integrity failures use project-owned
errors built on ECMAScript `Error` primitives, with stable codes and preserved
causes. A function that intentionally allows an error to escape documents that
contract with JSDoc `@throws`.

Code catches an error only at a boundary that can make a better decision than
its caller could make without that context. A service that cannot recover,
translate, add material context, or contain the failure lets it bubble to the
boundary that can.

The interface contains failures to the smallest useful surface, preserves
drafts and unaffected work, provides a safe retry when one is possible, and
always provides a way to dismiss or close the failed workflow and continue
using the surrounding interface. A handled application error must never require
or recommend a full-page refresh.

This record defines a target cross-layer contract. The current implementation
does not yet contain a custom error model, JSDoc throw contracts, transport
error descriptors, retry orchestration, or resilient error UI.

## Problem

An operation can fail at many boundaries: input validation, authorization,
optimistic concurrency, SQLite, projection execution, a network transport, an
external effect, application rendering, or an unexpected programming defect.
Treating all of these failures alike produces unsafe retries, vague messages,
duplicated effects, hidden partial work, or an unusable interface.

“Handled” cannot mean “caught in every function.” A low-level service often
lacks the information required to decide whether an operation is safe to retry,
whether the user can correct it, whether an external effect may already have
happened, or how the interface should recover. Catching there can discard the
original cause or convert a failure into an apparent success.

A binary success-or-failure model is also insufficient at a commit or delivery
boundary. A command or external effect may complete before its response is
lost. The caller then does not yet know whether it succeeded. Reporting a
definite failure and issuing a new operation identity could duplicate accepted
work or repeat an external effect.

Hyperkernel needs one predictable contract that:

- separates expected rejection from exceptional failure;
- preserves causal information without exposing private diagnostics;
- places `try`/`catch` at the boundary that owns recovery;
- proves that a retry is safe before offering or scheduling it;
- keeps command, event, projection, and external-effect semantics intact;
- gives users an explicit, actionable, accessible explanation;
- prevents a local error from destroying the workspace or unrelated work.

## Invariants

1. Every reported outcome identifies the operation or stage to which it
   belongs. No caught error or rejected operation may appear as success.
2. Expected validation, authorization, business-rule, and concurrency outcomes
   are explicit rejections or results, not exceptional control flow.
3. A rejected command appends no domain-state event and makes no authoritative
   domain-state change.
4. A command is not reported committed before its final decision and events
   commit atomically.
5. Once the authoritative command transaction commits, a later response,
   extension projection, or external-effect failure does not reclassify that
   command as rejected or failed.
6. An outcome that is not yet known is reported as unconfirmed and reconciled;
   it is never mislabeled as a definite failure.
7. Every project-defined exception extends a platform `Error` primitive,
   carries a stable nonlocalized code, and preserves its original cause when
   one exists.
8. Every function or method that intentionally throws, rejects with, or allows
   a supported exception to escape documents each error and condition with
   JSDoc `@throws`.
9. Code catches an error only when that boundary can recover, translate,
   finalize, add material context, report once, or contain the failure.
10. A retry preserves the same immutable intent and idempotency identity. It
    never silently changes the payload, actor, or concurrency expectation.
11. Retry safety is decided from the operation, known outcome, identity,
    idempotency, concurrency rule, and effect policy. It is not a universal
    boolean property of an error.
12. An external effect with an unknown remote outcome is reconciled before any
    retry that could duplicate it.
13. Projection state and its checkpoint advance atomically. An extension
    projection failure cannot corrupt or roll back the canonical event log.
14. Replay never schedules or repeats an external effect.
15. Errors crossing a transport or process boundary become validated,
    data-only failure descriptors. Raw `Error` objects, stacks, and causes
    never become public payloads.
16. A visible failure identifies the affected operation, what is known about
    authoritative and external state, and the safest next step.
17. A safe retry is offered whenever one is possible. When retry is not safe or
    useful, the interface explains the corrective, reconciliation, or support
    action available instead.
18. Dismissing an error changes presentation only. It does not claim success,
    erase audit history, cancel unknown background work, or forget an
    unresolved outcome.
19. A handled interface failure preserves user input, the workspace shell, and
    unaffected work. It never requires or recommends a full-page refresh.
20. Error records and diagnostics exclude credentials, secrets, raw private
    agent context, unnecessary personal data, and untrusted payloads unless a
    reviewed allowlist explicitly permits a field.
21. Exceptions and operational logs are not domain events or replay inputs.

## Decision

### Represent operation outcomes explicitly

Hyperkernel distinguishes these caller-visible outcomes:

| Outcome     | Meaning                                                                 | Typical next step                                     |
| ----------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Succeeded   | The operation completed and its result is known.                        | Continue.                                             |
| Rejected    | The system understood the request but did not accept the intended work. | Correct input, permissions, or stale intent.          |
| Failed      | The operation could not complete and the non-success outcome is known.  | Retry safely, fix a dependency, or report the defect. |
| Unconfirmed | The caller cannot yet prove whether a commit or effect completed.       | Query status or reconcile before considering a retry. |
| Cancelled   | Work was stopped before it crossed an irreversible boundary.            | Continue or start again as a new user choice.         |

An outcome always belongs to a named operation or stage. A composite workflow
may have a committed command, a lagging extension projection, and an
unconfirmed external-effect delivery at the same time. Hyperkernel reports
those states separately. A failure after command commit never changes the
committed command into a failed command.

These presentation outcomes do not replace the canonical command lifecycle.
Durable command decisions remain received, rejected, failed, and committed. A
received command without an observable final decision may appear unconfirmed
to a caller until the kernel resolves its status by command identity.

Cancelled is a caller-visible operation outcome, not a fifth durable command
decision. Cancellation is successful only when the system knows the operation
stopped before durable command receipt, commit, or delivery. Once a command is
durably received, it still resolves through received, rejected, failed, or
committed semantics. If its contract supports cancellation, the cancellation is
an authorized request associated with the original command and does not mutate
or erase that immutable request. Cancelling a local wait does not prove that the
underlying work stopped; the caller sees that state as unconfirmed while it is
reconciled.

Unconfirmed is a safety state, not a permanent substitute for an answer.
Hyperkernel continues reconciliation, keeps the operation inspectable, and
eventually presents the observed committed, rejected, or failed result whenever
the system can determine it. Recovery keeps a received command without a final
decision visible and actively resolves it; the command is never silently
forgotten because a client stopped waiting.

### Use explicit results for expected outcomes

Validation, authorization, business rules, and optimistic concurrency are
normal parts of deciding a command. They return typed results and, after
durable receipt, become append-only rejection decisions with safe explanatory
data. They are not thrown merely to escape ordinary control flow.

An authentication failure or invalid or unsafe envelope rejected before
durable receipt must not be described as a recorded command rejection. The
transport returns a validated boundary failure without claiming that the
command entered the audit model.

Zod remains the validation mechanism for untrusted structured data. Its issues
are translated at the owning boundary into typed, allowlisted field or envelope
issues. Raw input and the complete Zod error are not exposed or persisted
automatically.

Exceptions represent the inability to fulfill a code contract because of an
operational condition, compatibility or integrity failure, or unexpected
defect. This separation makes rejected work predictable without hiding actual
faults inside ordinary return values.

### Build project errors on platform primitives

Project-defined exceptions extend ECMAScript `Error`. When several independent
failures must remain visible together, a project-specific error may extend
`AggregateError`. Cancellation preserves standard `AbortSignal` and
`AbortError` semantics and is normalized if it crosses a public Hyperkernel
boundary.

A common project error contract follows this shape:

```ts
abstract class HyperkernelError extends Error {
  abstract readonly code: string;

  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
```

Concrete errors name the failed Hyperkernel contract, such as an unsupported
event version or a projection checkpoint failure. They do not merely rename a
vendor exception. A subclass is justified when callers handle that semantic
failure differently; Hyperkernel will not create one wrapper class for every
SQLite, network, or browser error.

Every deliberate project exception:

- has a stable, nonlocalized `code` for programmatic handling;
- uses `message` for trusted developer diagnostics, not direct UI copy;
- passes the original exception through the standard `cause` option;
- uses typed fields rather than an unrestricted metadata bag;
- contains no callbacks, UI state, credentials, raw input, or localized text;
- preserves normal `name`, stack, `instanceof`, and causal behavior.

Only the boundary that understands a recognized platform failure translates it
into a semantic project error. Unknown thrown values are narrowed from
`unknown`. Project code never deliberately throws a bare `Error`, string, or
arbitrary object.

`instanceof` is an in-process convenience, not a wire contract. Package,
worker, transport, and persisted boundaries use stable codes and
runtime-validated data rather than relying on prototype identity.

### Document every supported throw contract

Every function or method that intentionally lets a supported exception escape,
including rejection from an asynchronous function, documents every such
exception with JSDoc:

```ts
/**
 * Advances one projection from its current checkpoint.
 *
 * @throws {ProjectionCheckpointError} When projection state and its checkpoint
 * cannot commit atomically.
 */
async function advanceProjection(): Promise<void> {
  // ...
}
```

The description states the condition, not only the error class. Propagated
errors are part of the function contract and are documented even when the
function does not create them. Expected rejection results belong in the return
contract instead of `@throws`.

JSDoc documents the supported exception contract; it does not turn TypeScript
into a checked-exception language and cannot enumerate arbitrary runtime
defects. Repository checks and review must enforce coverage for deliberate
throws and supported propagation paths.

### Catch at the boundary that owns recovery

The correct catch boundary is the first boundary that can make a complete,
semantically informed decision:

| Boundary                         | Required behavior                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explicit initialization boundary | Own fallible configuration, constructors, migrations, and startup I/O so failure is documented, translated, and recoverable outside module evaluation.   |
| Platform adapter                 | Translate only recognized SQLite, filesystem, network, or browser conditions into stable project semantics and preserve the cause.                       |
| Domain handler or service        | Return expected rejection results. Do not add a generic catch when the service cannot recover or improve the contract.                                   |
| Command executor and transaction | Roll back atomically, preserve the original failure, and record a failed decision only when database state is known and doing so is safe.                |
| Synchronous kernel projection    | Treat failure as failure of the complete command transaction; no event, projection state, or checkpoint may partially commit.                            |
| Extension projection runtime     | Isolate the projection, leave its checkpoint unchanged, record lag or failure status, and resume at the first uncommitted event position.                |
| External-effect worker           | Record the attempt and distinguish confirmed failure from an unconfirmed remote outcome before applying delivery policy.                                 |
| Transport or framework adapter   | Perform the final mapping to a safe, validated failure descriptor without exposing framework types to the kernel.                                        |
| UI operation or application pane | Contain the failure locally, preserve user context, and present the safe actions owned by that operation.                                                |
| Workspace safety boundary        | Contain an otherwise unhandled UI defect to the smallest pane that can retain trustworthy state and keep unaffected work usable.                         |
| Server process safety boundary   | Record what can be recorded safely, stop acknowledging or accepting work when integrity is uncertain, and follow controlled shutdown and restart policy. |

Fallible startup work must not occur as an unowned side effect of importing a
module. Database construction, configuration parsing, PRAGMAs, migrations, and
other startup I/O run through explicit initialization functions whose failures
have custom errors, `@throws` contracts, and an owning recovery boundary.

The workspace safety boundary may preserve other panes after a rendering or
local task defect. A server process catch-all must not swallow an unexpected
kernel exception and continue accepting commands with possibly corrupt
in-memory state. Process recovery follows a separately tested supervisor and
shutdown contract; a catch-all is diagnostic containment, not evidence that
continuing execution is safe.

Cleanup that must happen regardless of outcome belongs in `finally`. A catch
must not log and rethrow by default; one owning boundary reports the occurrence
so lower layers do not produce duplicate diagnostics.

Adding context and rethrowing is justified only when the new context materially
identifies the failed contract. The wrapper preserves `cause`. If rollback or
cleanup also fails, the original failure remains available, using a causal
error or `AggregateError` rather than replacing it with the cleanup failure.

### Translate failures into a public descriptor

A transport never serializes an `Error`. It maps a known rejection or caught
exception into a Zod-validated, data-only discriminated union. Every variant
contains:

- the affected operation or stage;
- the caller-visible outcome: rejected, failed, or unconfirmed;
- a stable public error code;
- whether authoritative state is known unchanged, changed, unknown, or not
  applicable;
- the external-effect delivery outcome as a separate field when one is
  relevant;
- a semantic recovery instruction such as retry, correct, reauthenticate,
  reconcile, inspect, or none.

Outcome and recovery variants make their required data explicit:

- an unconfirmed outcome requires an authorized opaque status identity and a
  reconciliation instruction;
- an expected correctable rejection may include allowlisted field issues;
- an unexpected failure requires an occurrence ID;
- a retry instruction includes the identity or token and bounded policy data
  required to repeat that operation safely;
- pre-receipt validation and local presentation failures do not invent a
  command identity.

The descriptor does not contain a stack, internal message, raw cause, SQL,
secret, or unrestricted metadata. Public codes and descriptor fields become
compatibility contracts once exposed through a stable API or SDK.

The Experience layer maps the descriptor to clear, localized copy and controls.
Every supported public code and allowed descriptor combination has a safe
presentation mapping. An unknown code receives an honest fallback and
occurrence ID rather than exposing an internal exception.

### Decide retry safety at the operation boundary

Retryability belongs to the operation policy, not the error class alone. The
same network timeout may be safe to retry for a query and unsafe after sending
a payment. A generic `error.retryable` flag cannot encode that distinction and
is not part of the base error contract.

A retry policy considers:

- whether the previous outcome is known;
- the command or operation identity and idempotency contract;
- whether the immutable intent, payload, actor, and expected version are
  unchanged;
- whether an external effect was attempted and can be deduplicated;
- the attempt limit, deadline, cancellation signal, and server-provided delay;
- whether retry can make progress without user or operator action.

Automatic retries are bounded, observable, cancellable where applicable, and
use policy-controlled backoff and jitter. They do not run indefinitely or hide
a persistent failure. After the budget is exhausted, the interface presents
the failure and the next safe action.

Clocks, randomness, scheduling, backoff, and jitter belong to the command,
projection, or delivery runtime. They never enter a deterministic domain
handler or projection handler.

#### Commands

A retry of the same submitted command preserves its command identity,
idempotency key, actor, payload, and expected version. Individual delivery or
execution attempts may have their own attempt identities for diagnostics. The
processor returns an existing terminal outcome, resumes only a nonterminal
operation, or applies the explicitly defined retry contract; it never creates
duplicate intent for an unchanged request.

A transient failure inside a rolled-back attempt may retry the whole command,
not part of its transaction. A lost response triggers status lookup or
resubmission under the same identity. It never creates a fresh command merely
because the caller did not receive the response.

A rejected command is not retried unchanged. Correcting input, changing the
requested intent, or resolving an expected-version conflict creates a new
immutable command causally related to the first. The interface preserves the
draft, refreshes only the affected projection when needed, and lets the user
review the new intent without refreshing the page.

#### Queries

A side-effect-free query may receive bounded automatic or manual retry for a
transient failure. A retry preserves any explicit event position, projection
version, filters, and consistency requirement. Authentication, configuration,
integrity, and compatibility failures require their corresponding corrective
action rather than blind retry.

#### Projections and rebuilds

An extension projection resumes at the first event position strictly after its
last committed checkpoint. It reapplies only the failed event or batch whose
projection changes and checkpoint rolled back together; it never reapplies an
event already represented by both committed projection state and its committed
checkpoint. A rebuild remains isolated, and readers keep using the current
projection until the replacement completes and cuts over successfully.

#### External effects

An external effect may retry when the system knows it was not attempted, knows
it failed without taking effect, or can rely on a receiver idempotency or
deduplication contract. Each attempt and outcome is recorded.

A timeout or connection loss after delivery may leave the remote outcome
unconfirmed even though its originating command remains committed. The system
reports command state and delivery state separately. When same-key receiver
idempotency makes another delivery provably safe, the delivery policy may use
it as part of recovery. Otherwise the system offers status checking or
reconciliation, not a blind Retry control, before another attempt that could
duplicate the effect.

Projection replay never enqueues historical effects.

### Make failure recovery part of the interface

Every user-visible failure presentation explains:

1. which operation and stage did not produce the expected result;
2. whether saved or authoritative state changed, did not change, is not yet
   known, or was not involved;
3. whether a related external effect happened, failed, or remains unconfirmed;
4. what the user can safely do next;
5. an occurrence reference for an unexpected defect.

The external-effect item is omitted when the workflow has no external effect.
It is never merged into or allowed to rewrite the authoritative command state.

The primary recovery control matches the proven policy:

- **Retry** repeats the same safe operation;
- **Fix** or **Resolve** opens the input, permission, conflict, configuration,
  or reconciliation path that can change the outcome;
- **Inspect** or **Report** exposes safe diagnostics and the occurrence
  reference when the user cannot repair the defect directly;
- **Dismiss** or **Close** removes the blocking presentation and returns the
  user to unaffected work.

The interface never invents a fix for an internal defect. When no immediate
repair is possible, it says what failed, preserves the work, provides the
occurrence reference, and explains the available operator or support action.

An error is rendered in the smallest surface that owns the operation: control,
form, panel, application window, or workspace. A transient toast may supplement
that surface, but it is not the only record of a failure that still requires
action. Unconfirmed operations and unresolved background failures remain
inspectable after dismissal in an activity or status surface.

Forms preserve user input. Dismissal restores focus to a logical location.
Messages and recovery controls use semantic HTML, work with keyboard and touch,
are announced accessibly, and do not rely on color or motion alone.

The surrounding shell and unrelated applications remain usable even when one
capability is unavailable. A prerequisite failure may keep that one workflow
blocked, but closing it returns the user to the rest of the workspace.

No handled application failure path may require or recommend a browser refresh.
Retry re-executes the owned operation, and a reset reinitializes only the
affected surface. If failure occurs during shell initialization after the
client can execute, a minimal recovery surface exposes safe diagnostics and
retries initialization in place only when the same operation-level safety
policy permits it.

This guarantee covers failures Hyperkernel can handle while its code is able to
run. A browser that cannot execute the application, a terminated process, or an
unavailable machine may prevent any interface from rendering; those platform
failures do not justify using full-page refresh as an application recovery
design.

### Observe failures without weakening privacy

Command lifecycle decisions follow their append-only audit contract.
External-effect attempts and outcomes are durably recorded under the delivery
contract, and resulting domain facts use follow-up events. Projection lag,
failure, and recovery status is durable and observable, but its current-state
and retained-history representation belongs to the projection runtime contract;
this record does not declare projection status to be an immutable domain event.

Exceptions and operational diagnostics are separate retention-managed records
and are never replay inputs.

The owning reporting boundary records structured diagnostics with:

- a unique occurrence ID and stable error code;
- the boundary and operation that failed;
- command, correlation, causation, projection, or delivery identities where
  relevant and authorized;
- attempt number, retry decision, and observed outcome;
- a trusted timestamp and deployed software version.

Stacks and causal chains remain available only to trusted diagnostics.
Metadata is allowlisted and redacted before recording or transport. Full
command payloads, SQL containing values, raw external responses, secrets,
unnecessary personal data, and private model context are excluded.

Operational measures include failure rate by code and boundary, automatic and
manual retry success, exhausted retries, unconfirmed effects, projection lag
and failure, and post-error UI recovery. Expected command rejections remain
distinguishable from system defects in logs and metrics.

## Considered solutions

### Catch errors in every service

Local catches can appear defensive and make every function look self-contained.
They also encourage swallowing failures, logging the same occurrence several
times, or making retry decisions without command and effect context.

This solution is rejected. A service catches only when it owns a meaningful
recovery or translation; otherwise it documents and propagates the error.

### Expose platform errors directly

Passing SQLite, network, filesystem, Zod, or framework errors through unchanged
requires less code and retains detailed diagnostics.

This solution is rejected at public boundaries because platform messages and
shapes are unstable, may expose private data, and do not express Hyperkernel
recovery semantics. Recognized failures are translated where the owning
context exists, with the original error preserved as `cause`.

### Throw exceptions for every unsuccessful outcome

Using one exception path for validation, authorization, conflict, operational
failure, and programming defects provides one apparent mechanism.

This solution is rejected because expected domain decisions become invisible
control flow and are too easy to misreport as system defects. Expected
rejections use explicit result and audit contracts; exceptions remain
exceptional failures.

### Return a result object from every function

Universal result types make unsuccessful paths visible in signatures and can
support exhaustive branching.

This solution is rejected as a universal rule because it would turn unexpected
programming and infrastructure defects into routine values throughout every
layer. Hyperkernel uses explicit results where rejection is an expected domain
outcome and exceptions where a code contract cannot be fulfilled.

### Put a retryable flag on every error

A boolean is simple to propagate and easy for a UI to turn into a Retry button.

This solution is rejected because retry safety depends on operation identity,
known commit or delivery state, concurrency, and effect idempotency. The same
error can be safe for a query and unsafe for a non-idempotent effect.

### Automatically retry every transient-looking failure

Aggressive retry can hide brief outages and reduce user interruption.

This solution is rejected because an ambiguous commit or delivery may already
have succeeded, unbounded retries amplify outages, and stale commands can
overwrite newer intent. Automatic retry remains bounded and policy-controlled.

### Use a global error page with a reload action

One fallback page is easy to implement and can recover some client state by
restarting the application.

This solution is rejected because it discards local context, interrupts
unaffected work, teaches users to distrust operation state, and can repeat
unsafe work. Errors are contained locally, and the workspace provides in-place
recovery without full-page refresh.

## Consequences

### Gains

- Callers can distinguish rejection, failure, and an outcome that still needs
  reconciliation.
- Custom errors preserve native debugging behavior while presenting stable
  Hyperkernel semantics.
- Catch placement follows ownership instead of defensive boilerplate.
- Retry controls correspond to proven idempotency and effect safety.
- Users receive explicit recovery without losing drafts or unrelated work.
- Public failure payloads remain stable, validated, and safe.
- Command, projection, replay, and external-effect invariants remain intact.

### Costs and limitations

- Every supported operation boundary needs an outcome and recovery analysis.
- Error classes, stable codes, descriptor schemas, presentation mappings, and
  `@throws` documentation require ongoing compatibility work.
- Fault injection, ambiguous-outcome simulation, accessibility checks, and
  retry tests add substantial verification cost.
- Some failures need operator action and cannot offer an immediate retry.
- Dismissing an error cannot make a genuinely unavailable capability usable.
- Continued use of unaffected UI does not guarantee availability of a corrupt
  database, offline dependency, terminated process, or failed machine.
- JSDoc improves contracts but cannot statically prove that arbitrary runtime
  defects will not occur.

### Maintenance cost

Maintainers must review new errors and public codes for semantic duplication,
keep JSDoc and presentation mappings aligned, preserve compatibility of stable
failure descriptors, and ensure that retry policy stays next to the operation
context that can prove it safe. Unused codes and legacy public mappings cannot
be removed casually after they become supported contracts.

### Operational complexity

Implementations need occurrence correlation, redaction, bounded retry
scheduling, reconciliation workers, projection failure status, and
fault-injection coverage. This is intentional operational work required for
predictability; it must be introduced with the concrete command, projection,
or effect that needs it rather than through a speculative universal workflow
engine.

### Scaling implications

Retries increase load during the same outages that caused the original
failures. Backoff, jitter, admission limits, and retry budgets must prevent a
self-amplifying failure. Failure history and delivery attempts also grow over
time and require explicit retention or compaction rules where they are not part
of a durable audit contract that prohibits compaction.

The semantic contract does not depend on a distributed deployment. If
Hyperkernel later adds workers, processes, or database engines, stable
data-only descriptors, operation identities, idempotency, and reconciliation
become more important because `instanceof`, in-memory state, and synchronous
exception propagation no longer cross those boundaries.

## Decision boundary

This record defines failure semantics, propagation ownership, retry safety, and
the user recovery contract. It does not choose a notification component,
logging vendor, localization system, exact backoff formula, process supervisor,
or a complete taxonomy of domain-specific error codes.

New semantic error subclasses and recovery instructions may be added within
this contract. A material change that makes expected domain rejection
exceptional, exposes raw errors publicly, weakens identity-preserving retry,
permits blind external-effect retry, or adopts full-page reload as normal
recovery requires a new design record after this one becomes Stable.

## Evaluation

This record may advance to Development when:

- the outcome model and distinction between rejection and exception are
  approved;
- the platform error, public descriptor, retry, and interface contracts are
  accepted;
- the Kernel portions receive review and approval from an experienced human
  maintainer;
- implementation work is classified separately across the Kernel, Extension,
  and Experience boundaries.

It may advance to Evaluation when the repository contains:

- custom project errors built on platform primitives with tested `code`,
  `cause`, `name`, stack, and `instanceof` behavior;
- runtime-validated discriminated public failure descriptors that reject
  impossible field combinations, with exhaustive safe presentation mappings
  for every supported public code and a tested unknown-code fallback;
- automated checks or an equivalent enforced review mechanism for deliberate
  throws and JSDoc `@throws` coverage;
- explicit startup and database initialization with failure tests for
  configuration, connection construction, PRAGMAs, and migrations;
- failure-injection tests at platform, command, projection, effect, transport,
  and UI boundaries;
- cancellation tests using `AbortSignal` and normalized `AbortError` semantics,
  proving the distinction between a local cancelled operation, a durably
  received command, and an unconfirmed client wait;
- crash-window tests before commit, after commit, and before response proving
  same-identity status lookup, deduplication, and separate command and delivery
  outcomes;
- tests proving that rejection appends no domain event and synchronous kernel
  failure rolls back the attempted committed decision, events, projections, and
  checkpoints together, then records the failed decision once rollback state
  is known;
- extension projection tests proving checkpoint isolation and resumption at the
  first uncommitted event position without clocks or retry scheduling inside
  the deterministic handler;
- external-effect tests for known failure, unconfirmed outcome,
  reconciliation, idempotent delivery, and replay without redispatch;
- bounded retry tests for attempt limits, deadlines, cancellation, backoff,
  server delay, exhaustion, and outage amplification;
- redaction tests proving that public descriptors, audit records, and
  operational diagnostics do not leak restricted data;
- tests proving that rollback, cleanup, or diagnostic-reporting failure cannot
  mask the original operation failure;
- nested interface-boundary tests proving safe Retry behavior, error dismissal,
  preserved drafts and workspace context, accessible announcements and focus,
  continued use after rendering and asynchronous-operation failures, and no
  full-page refresh;
- a workspace safety surface that contains unexpected UI defects while keeping
  diagnostics and unaffected work available, plus a server safety test proving
  that uncertain kernel integrity stops new command acknowledgement.

It may advance to Stable after representative applications have exercised the
contract across commands, queries, projections, and external effects; supported
upgrades preserve public codes and descriptors; and observed retry,
reconciliation, redaction, and post-error recovery behavior satisfies defined
reliability objectives.

## References

- [Hyperkernel public architecture](../../README.md)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [0001: Event schema evolution](0001-event-schema-evolution.md)
- [0002: Event-sourced persistence with SQLite](0002-event-sourced-persistence-with-sqlite.md)
- [0003: Web-platform-first frontend](0003-web-platform-first-frontend.md)
- [0004: Interface design philosophy](0004-interface-design-philosophy.md)

## Status history

| Date       | Status | Reason                              |
| ---------- | ------ | ----------------------------------- |
| 2026-07-27 | Draft  | Initial design proposed for review. |
