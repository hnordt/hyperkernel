# Architecture decision records

An Architecture Decision Record (ADR) documents an accepted, durable decision
that guides Hyperkernel's implementation and public contracts. An ADR explains
what was decided, why it was chosen, and the consequences that future work must
respect.

ADRs are not exploratory design documents. A decision can later be replaced,
but it remains accepted until a newer ADR supersedes it.

## Records

| Record                                                                       | Status   |
| ---------------------------------------------------------------------------- | -------- |
| [0001: Path and pathname terminology](0001-path-and-pathname-terminology.md) | Accepted |

## Relationship to design records

[`../design/`](../design/README.md) contains ideas that progress through
design stages. A design that is fully approved and tested may be promoted to
an ADR when it establishes a durable rule, boundary, or public contract.

The design record remains as the history and evidence for the decision. The
resulting ADR links to that design record, and the design record links to the
ADR. Not every completed design needs an ADR; create one only when the decision
must guide future work beyond its original implementation.

An ADR may also be created directly when a small, well-understood decision does
not need a separate design process.

## Status

| Status     | Meaning                                                            |
| ---------- | ------------------------------------------------------------------ |
| Accepted   | The decision is active and guides current work.                    |
| Superseded | A newer ADR replaced the decision; retain this record for history. |

## Structure

Each ADR contains:

1. metadata with its status and decision date;
2. a concise summary and the problem being decided;
3. the decision and examples or rules needed to apply it;
4. considered alternatives and consequences;
5. links to any originating design record or replacement ADR.

Number ADRs sequentially within this directory. The number is a stable identity
and is not reused.
