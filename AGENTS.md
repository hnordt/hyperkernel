# AGENTS.md

This file is the canonical engineering guidance for coding agents working in this repository. `README.md` defines the project mission and public architecture; this file turns that architecture into implementation rules.

Agents contributing repository changes must also follow `AI_DEVELOPMENT.md`,
which defines authoring disclosure and separates agent review from accountable
human approval and merge decisions.

When older documentation, an experiment, or a spike conflicts with these files, `README.md` and `AGENTS.md` take precedence. Do not describe a proposed contract as implemented.

## Mission

Hyperkernel is building a small, highly trusted kernel for systems whose applications, interfaces, workflows, and integrations may evolve quickly.

Optimize kernel work for correctness, auditability, deterministic recovery, security, and long-term compatibility. Optimize work outside the kernel for safe iteration without allowing it to bypass kernel contracts.

## Classify the change

Classify every meaningful change before implementing it:

- **Kernel** — authoritative persistence, command execution, authorization, event contracts, ordering, concurrency, projection runtime, checkpoints, rebuilds, replay, audit, external-effect delivery, or public SDK contracts.
- **Extension** — domain command, event, and projection definitions, domain behavior, integrations, or agent tools built through constrained kernel APIs.
- **Experience** — the multitasking shell, application UI, administrative UI, and developer tooling.

An extension crosses the kernel review boundary when it can bypass constrained APIs, participate in the authoritative write transaction, enforce platform authorization, or compromise platform-wide integrity, replay, compatibility, or recovery.

Kernel changes require the strongest verification and approval by an experienced human maintainer. AI may author or review a kernel patch, but agent-only review never satisfies the human-review requirement.

## Canonical data flow

Every durable domain change follows this order:

1. An actor submits a command envelope.
2. The entry boundary authenticates the actor and validates and sanitizes the envelope enough to handle and store it safely.
3. The command is durably recorded as received.
4. The kernel performs domain validation, authorization, idempotency, and concurrency checks.
5. A committed state-changing command appends one or more events.
6. Kernel projections commit synchronously when required; extension projections advance from the log through the projection runtime.
7. APIs and interfaces read the resulting projections.

Rejected commands append no domain-state event and make no domain-state change. Record their decision and audit metadata without treating rejection as successful domain work.

The command audit model must distinguish received, rejected, failed, and committed outcomes. Record lifecycle outcomes as append-only decisions associated with the immutable request. Do not mark a command committed before its events commit. In the initial SQLite design, the final command decision, event append, synchronous kernel projections, and their checkpoints share one transaction.

Humans, applications, automations, system processes, and AI agents use this same boundary. A route, UI, workflow, integration, or agent must not write authoritative domain state directly.

## Non-negotiable invariants

1. Commands record intent; events record accepted facts; projections expose derived read models.
2. Durable domain state changes only by appending events.
3. The ordered event log is the source of truth.
4. A recorded event is immutable. No supported application, administrative, migration, or upgrade path can update or delete it.
5. Corrections, reversals, and logical deletion are represented by new commands and new events.
6. Projections are disposable and rebuildable from the event log.
7. Given the same ordered events and projection version, incremental processing and a clean rebuild produce equivalent results.
8. Historical event types and schema versions remain interpretable for as long as those events exist.
9. Humans and agents use the same command, capability, and audit boundaries.
10. Replay never re-executes commands or repeats external effects.

Transient presentation state such as focus, hover, pointer position, or an unsubmitted draft does not need to be event-sourced. Persisted workspace state and other durable user-visible changes do.

## Command contract

- Name commands as imperative intent, such as `CreateInvoice` or `ApprovePayment`.
- Treat a submitted command as an immutable request. Do not mutate its payload to represent a different request or outcome.
- Give each command a stable identity and actor. Preserve the relationship between the command, its decision, and any emitted events.
- Authenticate the actor and validate and sanitize the command envelope before durable recording. Use Zod for the complete domain input before acceptance.
- Authorize before accepting a command.
- Define idempotency for retries and expected versions or an equivalent concurrency rule for competing writes.
- A committed state-changing command emits one or more events. Commit its final decision and events atomically. It must not update a projection or authoritative table directly.
- A rejected command emits no domain-state event. Preserve enough sanitized audit data to explain the decision.
- Administrative mutations, including requesting a projection rebuild, also enter through an authorized command boundary.
- Never store credentials, secrets, raw private agent context, or unnecessary personal data merely to make the command record exhaustive.

## Event contract

- Name events as past-tense facts, such as `InvoiceCreated` or `PaymentApproved`.
- Each event must include a unique identity, stable replay position, type, schema version, actor, kernel-recorded time, originating command or cause, and correlation metadata where relevant.
- Use a subject or stream identity and version when required for ordering and optimistic concurrency.
- Validate event envelopes and payloads before append.
- Store immutable facts needed by downstream behavior. Do not store a mutable “current state” disguised as history.
- Never change the meaning or payload contract of an existing event type and schema version.
- Never update or delete an event to repair data. Append a corrective, compensating, or tombstone event.
- Deprecating an event version stops new emission; it does not remove stored events or replay support.
- In-memory upcasting may adapt an old version for current code, but it must not rewrite the stored event.
- Historical fixtures for every persisted event version are part of the compatibility contract.

Application behavior must expose no event-deletion path. If a legal or privacy requirement may require erasure, design erasable or encrypted indirection before recording the data; do not silently weaken event immutability after data has been persisted.

## Projection and replay contract

- The kernel owns projection execution, isolation, checkpointing, replay, rebuild, and cutover contracts.
- An extension may own a domain projection definition, including the event types and versions it consumes and its schema, indexes, and queries.
- A projection definition that participates in the authoritative write transaction, enforces platform authorization, or is required for strong platform consistency is a kernel change and must pass the kernel quality gate.
- By default, extension projections run in isolation after event commit. Their failure may make their own read model stale or unavailable, but it must not corrupt or roll back the canonical event log.
- Only its projector or controlled rebuild machinery may write its derived tables.
- Projection handlers must be deterministic. They may use the current event, their own state derived from earlier ordered events, and versioned projection configuration. They must not read the clock, generate randomness, call the network, invoke tools, or depend on other ambient mutable state.
- Apply events in stable log order. Each affected projection advances from an explicit checkpoint.
- In the initial single-process SQLite design, the final command decision, event append, synchronous kernel projection writes, and their checkpoint updates must commit in one transaction.
- For synchronous kernel projections, check affected row counts and invariants and roll back the complete transaction on failure.
- Advance extension projections promptly from durable log positions with checkpointed retry and explicit lag or failure status.
- A clean rebuild starts from an empty projection and processes every compatible historical event in order.
- Test that live incremental state equals clean-replay state.
- Time travel targets a stable event position and an explicit projection version. Timestamps alone are not authoritative ordering.
- Rebuilds must be authorized, observable, and recoverable. Report progress, checkpoint, failure, and completion.
- Build a replacement projection in isolation and expose it as current only after successful completion; readers must not observe a partially rebuilt model.
- Back up the event log and command audit records first. Projections may be regenerated.

## External effects

Email, payments, webhooks, agent tool calls, and other effects outside the database are not projections.

Use a durable outbox or another explicit delivery boundary with at-least-once delivery. Supply idempotency keys or deduplicate when the receiver supports them. If a crash leaves the remote outcome unknown, record that ambiguity and reconcile it before an unsafe retry.

Record delivery attempts and outcomes and represent resulting facts with follow-up events. Projection replay must never enqueue or intentionally redispatch historical effects.

A new event can correct internal state or request compensation; it cannot erase an effect that already happened in the external world.

## Upgrade compatibility

- Test upgrades against representative historical logs before release.
- Do not ship an upgrade that can append new events but can no longer replay events already stored by a supported release.

## AI-agent boundary

- Give every agent a stable actor identity and explicit, minimal capabilities.
- Agents submit commands; they never receive direct database, event-table, or projection-table write access.
- Record consequential model and tool versions, authorized input references, tool calls, approvals, commands, results, and failures under an explicit access and retention policy.
- Do not persist secrets, unnecessary raw prompts, private reasoning, or unrelated context in immutable records.
- Require human approval before high-impact commands when policy demands it.
- Treat an agent retry as a retry of the same command when appropriate, not permission to duplicate effects.
- Correct agent mistakes through the same append-only model used for human mistakes.

## Kernel quality gate

A kernel change is not ready to merge without:

- a written contract and the invariant it preserves;
- documented failure, retry, concurrency, recovery, and compatibility behavior;
- tests for command acceptance, rejection, authorization, idempotency, and concurrency where relevant;
- tests proving append-only behavior and transactional rollback;
- incremental-versus-clean-replay equivalence tests for affected projections;
- historical fixtures and compatibility tests for affected event versions;
- interrupted-write or interrupted-rebuild recovery tests where relevant;
- documentation for any changed public contract;
- review and approval by an experienced human maintainer.

Do not claim that an automated check proves human review. Do not claim production readiness without tested backup, restore, upgrade, and recovery procedures.

Extension and experience changes use verification proportional to risk, but they must still preserve every kernel invariant.

## Project configuration

- **Language:** TypeScript
- **Framework:** SvelteKit with Svelte 5 runes
- **Production adapter:** `@sveltejs/adapter-node`
- **Package manager:** npm
- **Database:** SQLite through the built-in `node:sqlite` module
- **Runtime validation:** Zod
- **Styling:** native CSS
- **Tests:** Vitest and Playwright

Hyperkernel currently requires Node.js 24 or later and npm 11 or later.

## Repository boundaries

- `src/routes/` contains SvelteKit routes and transport/UI entry points.
- `src/lib/server/db/index.ts` owns the shared `DatabaseSync` connection.
- `src/lib/server/` is server-only and must never be imported by client code.
- `src/lib/components/` contains reusable interface components.
- `docs/design/` contains numbered design records for significant contracts and decisions.
- `docs/spikes/` contains isolated architecture experiments. Spikes are not production modules, supported APIs, or proof that a contract is implemented.

Keep database connection creation centralized in `src/lib/server/db/index.ts`. Use the built-in `node:sqlite` module. Do not introduce an ORM, another SQLite client, a second ad hoc connection, or direct database access outside the server boundary unless an intentional architecture change is documented and approved.

Framework transports must be adapters around the command/query contracts. Do not make the kernel depend on SvelteKit request objects, remote-function internals, or UI component state.

## Svelte and interface guidance

- Use Svelte 5 runes for application code.
- Experimental SvelteKit remote-function support is enabled in `vite.config.ts`; it may be used for RPC-style flows, but authoritative command, event, and projection contracts must remain framework-independent.
- Use native CSS in scoped Svelte `<style>` blocks for component and page styling.
- Keep the bootstrap document reset in `src/app.html` minimal. Put other document-level rules in the root layout with `:global`; keep theme tokens owned by the theme boundary.
- Inter is imported in `src/routes/+layout.svelte`. Reuse the existing font token rather than adding component-specific font stacks.
- Prefer modern HTML and Web Platform primitives such as `<dialog>`, the Popover API, `<details>`, native form controls, and the Clipboard API. Do not introduce a headless UI library without an explicit architecture decision.
- Preserve native keyboard, focus, and accessibility semantics.
- Treat excellent developer experience, a friendly user experience, and persistent multitasking as product requirements.

## Schema validation

Use Zod for untrusted structured data at the boundary where it enters the system, including commands, event envelopes and payloads, URL and form input, environment-derived configuration, agent tool input, and database reads whose integrity is not already guaranteed.

Infer TypeScript types from Zod schemas instead of duplicating manual interfaces for the same contract. Do not replace runtime validation with casts or ad hoc checks.

## Engineering style

- Inspect the actual implementation, public contract, and current diff before proposing or editing.
- Prefer the smallest correct production-oriented patch.
- Keep names aligned with the canonical vocabulary: command, event, projection, checkpoint, replay, actor, and capability.
- Do not use `action` as a synonym for `command`. A UI action may submit a command.
- Prefer domain names over generic names such as `data`, `item`, `handler`, `manager`, `helper`, or `utils`.
- Prefer standard ECMAScript, Web Platform, Svelte, SvelteKit, and CSS APIs over project-specific wrappers.
- Do not extract a one-use helper unless it creates a real boundary, names a domain invariant, or materially reduces complexity.
- Avoid unrelated renaming, formatting, file movement, or refactoring.
- Preserve public contracts unless the task explicitly changes them.
- Separate verified implementation from target architecture in code comments and documentation.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview the production build
npm run check        # Type-check with svelte-check
npm run lint         # Prettier + ESLint checks
npm run format       # Format with Prettier
npm run test         # Run unit and end-to-end tests
npm run test:unit    # Run Vitest tests
npm run test:e2e     # Run Playwright tests
```

Unit tests are split into two Vitest projects:

- **client** (`*.svelte.{test,spec}.ts`) runs in a browser through Playwright;
- **server** (`*.{test,spec}.ts`, excluding Svelte component tests) runs in Node.js.

To run one test file:

```bash
npx vitest run src/path/to/file.test.ts
```

For browser QA, use the repository's local Playwright installation and local development server unless the user explicitly requests another browser tool.

Before submitting a change, run checks proportional to the change. A complete validation is:

```bash
npm run check
npm run lint
npm run test
npm run build
```

## Svelte documentation tools

For Svelte or SvelteKit work:

1. Call `list-sections` before implementation.
2. Select every relevant section from its `use_cases`.
3. Call `get-documentation` for those sections.
4. Run `svelte-autofixer` on every Svelte component written or changed and repeat until it reports no issues or suggestions.

Only create a Svelte Playground link after the user asks for one, and never for code already written into this repository.

## Commit messages and paths

Write commit messages as one sentence summarizing the change.

Use `./` for specific local file paths in config files, omit it for glob patterns, and use a leading `/` for repository-root paths in `.gitignore`.
