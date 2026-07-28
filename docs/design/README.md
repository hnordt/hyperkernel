# Design records

Design records capture Hyperkernel ideas while they are proposed, developed,
and evaluated. They preserve the reasoning, evidence, and unresolved questions
needed to reach a decision. They complement the public architecture in
`README.md` and the canonical engineering rules in `AGENTS.md`.

Use a design record when a significant idea needs deliberate exploration before
it becomes a durable decision. Do not create one for routine implementation
details that are adequately explained by code and tests.

The `Scope` field uses one or more of the canonical `Kernel`, `Extension`, and
`Experience` classifications from `AGENTS.md`. A record inherits the
classification of the contract it defines; `Design`, `Documentation`, and
`Frontend` are not separate classifications.

Repository architecture and governance definitions belong in
[`docs/adr/`](../adr/README.md), not in this design-record collection.

## Records

| Record                                                                                                 | Status      |
| ------------------------------------------------------------------------------------------------------ | ----------- |
| [0001: Event schema evolution](0001-event-schema-evolution.md)                                         | Draft       |
| [0002: Event-sourced persistence with SQLite](0002-event-sourced-persistence-with-sqlite.md)           | Development |
| [0003: Web-platform-first frontend](0003-web-platform-first-frontend.md)                               | Development |
| [0004: Interface design philosophy](0004-interface-design-philosophy.md)                               | Development |
| [0005: Agent-generated application specifications](0005-agent-generated-application-specifications.md) | Draft       |
| [0006: Error handling and recovery](0006-error-handling-and-recovery.md)                               | Draft       |
| [0007: Local package workspaces](0007-local-package-workspaces.md)                                     | Development |
| [0008: SQLite connection package](0008-sqlite-connection-package.md)                                   | Development |

## Authority

`README.md` and `AGENTS.md` remain canonical. A design record does not silently
override them or establish a durable contract.

- Draft, Development, and Evaluation records are ideas, not accepted decisions.
- A Stable design is fully approved and tested for its intended scope.
- When a Stable design establishes a durable rule, boundary, or public contract,
  create an ADR in [`../adr/`](../adr/README.md) to record the accepted
  decision. Keep the design record as the history and evidence, with links in
  both directions.
- Not every Stable design needs an ADR; routine or local decisions may remain
  documented in code and tests.
- A material change to an accepted decision requires a new ADR that supersedes
  the earlier one.
- Spikes may provide evidence for a design but never define supported behavior.

## Status

Design records advance through these statuses:

| Status      | Meaning                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| Draft       | The problem and proposed decision are under discussion. Nothing is approved for implementation or support.                 |
| Development | The design is chosen and implementation is underway. The contract may still change incompatibly.                           |
| Evaluation  | The implementation works end to end and is being evaluated through tests and concrete use. The contract is not yet stable. |
| Stable      | The design is fully approved and tested. Create an ADR if it establishes a durable rule, boundary, or public contract.     |
| Legacy      | The design no longer guides new work. Retain it as historical context and link to any successor design or ADR.             |

A Draft that is abandoned before implementation remains in the repository with
a prominent note explaining that no decision was adopted.

## Naming

Number records sequentially and use a descriptive lowercase filename:

```text
0001-event-schema-evolution.md
```

The number is a stable identity, not a priority or implementation order.

## Structure

Each record must contain:

1. metadata with its status, scope, and dates;
2. a concise summary;
3. the problem and governing invariants;
4. the chosen or proposed decision;
5. the considered solutions and why each was accepted or rejected;
6. the consequences and limitations;
7. evidence required for the next status;
8. a dated status history.

The record may add sections when the decision needs contracts for failure,
concurrency, recovery, security, or compatibility.
