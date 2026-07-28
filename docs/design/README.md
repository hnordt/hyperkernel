# Design records

Design records document significant Hyperkernel decisions whose reasoning,
implementation maturity, and compatibility consequences must remain reviewable.
They complement the public architecture in `README.md` and the canonical
engineering rules in `AGENTS.md`.

Use a design record for a kernel contract, a public extension contract, or
another decision whose alternatives and long-term consequences matter. Do not
create one for routine implementation details that are adequately explained by
code and tests.

## Records

| Record                                                                                       | Status      |
| -------------------------------------------------------------------------------------------- | ----------- |
| [0001: Event schema evolution](0001-event-schema-evolution.md)                               | Draft       |
| [0002: Event-sourced persistence with SQLite](0002-event-sourced-persistence-with-sqlite.md) | Development |
| [0003: Web-platform-first frontend](0003-web-platform-first-frontend.md)                     | Development |
| [0004: Interface design philosophy](0004-interface-design-philosophy.md)                     | Development |
| [0005: Agent-generated application specifications](0005-agent-generated-application-specifications.md) | Draft       |
| [0006: Error handling and recovery](0006-error-handling-and-recovery.md)                               | Draft       |

## Authority

`README.md` and `AGENTS.md` remain canonical. A design record elaborates those
contracts but does not silently override them.

- Draft, Development, and Evaluation records do not define stable contracts.
- A Stable record may elaborate a canonical contract.
- Once Stable, a record should receive only editorial clarifications.
- A material change requires a new record. The previous record becomes Legacy
  and links to its replacement.
- Spikes may provide evidence for a record but never define supported behavior.

## Status

Design records advance through these statuses:

| Status      | Meaning                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Draft       | The problem and proposed decision are under discussion. Nothing is approved for implementation or support.                              |
| Development | The design is chosen and implementation is underway. The contract may still change incompatibly.                                        |
| Evaluation  | The implementation works end to end and is being evaluated through tests and concrete use. The contract is not yet stable.              |
| Stable      | The contract is supported. Compatibility and replay guarantees apply, and material changes require a new design record.                 |
| Legacy      | Existing use and historical compatibility remain supported, but new use is prohibited. The record must identify its Stable replacement. |

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
