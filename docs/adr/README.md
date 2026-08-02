# Architecture decision records

Architecture decision records (ADRs) document repository-wide architecture and
governance definitions that control how Hyperkernel work is classified,
reviewed, or maintained. Product and platform design records remain in
[`docs/design/`](../design/README.md).

## Records

| Record                                                                                                     | Status      |
| ---------------------------------------------------------------------------------------------------------- | ----------- |
| [ADR 0001: Change classification by affected contract](0001-change-classification-by-affected-contract.md) | Development |
| [ADR 0002: Path and pathname terminology](0002-path-and-pathname-terminology.md)                           | Development |

## Authority

`README.md`, `AGENTS.md`, and `CONTRIBUTING.md` remain canonical. An ADR
elaborates those rules but does not silently override them.

## Conventions

Number ADRs sequentially within this directory and use a descriptive lowercase
filename:

```text
0001-change-classification-by-affected-contract.md
```

Each ADR uses the same status, scope, date, decision, alternatives,
consequences, evaluation, and status-history conventions as the design records.
Its `Scope` field uses one or more of the canonical `Kernel`, `Extension`, and
`Experience` classifications from `AGENTS.md`.
