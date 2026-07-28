# ADR 0001: Change classification by affected contract

| Field        | Value                         |
| ------------ | ----------------------------- |
| Status       | Development                   |
| Scope        | Kernel, Extension, Experience |
| Created      | 2026-07-28                    |
| Last updated | 2026-07-28                    |

## Summary

Hyperkernel classifies a change by the contract or review boundary it affects,
never merely by the type of file or artifact changed. The canonical
classifications remain Kernel, Extension, and Experience.

Documentation, design records, and architecture decision records inherit the
classification of the subject they define or change. Hyperkernel will not add
separate Documentation, Design, ADR, or Station classifications. Station is not
a canonical existing category.

## Problem

`AGENTS.md` requires every meaningful change to be classified as Kernel,
Extension, or Experience so that its evidence and human-review requirements
match its risk. The repository also contains public documentation, package
metadata, contributor guidance, and design records. These artifacts can range
from editorial project information to definitions of critical Kernel
contracts.

Classifying every documentation change alike would ignore this difference. A
Kernel compatibility rule does not become lower risk because it is written in
Markdown, while a package-description edit does not need the Kernel quality
gate merely because `README.md` also documents Kernel architecture.

The change that prompted this record updated Hyperkernel's public positioning
in `README.md` and `package.json`. During review, the project evaluated whether
documentation, design work, or ADRs required another classification and whether
Station was already canonical. The authoritative guidance and repository
enforcement points contained only Kernel, Extension, and Experience. No
canonical definition or existing use of Station was found.

## Governing rules

1. Classification follows the affected contract or review boundary.
2. File extension, directory, artifact format, or authoring activity does not
   determine classification by itself.
3. A documentation-only change can still be a Kernel change when it defines or
   changes a Kernel contract.
4. A coherent change that affects more than one boundary lists every applicable
   classification.
5. A cross-boundary change satisfies the strongest review and verification gate
   among its classifications.
6. Adding a classification requires a distinct review boundary with evidence
   or approval needs that the existing taxonomy cannot express.

## Decision

Hyperkernel retains the canonical Kernel, Extension, and Experience taxonomy.
It does not add Documentation, Design, ADR, or Station.

Documentation, design work, ADRs, tests, migrations, and tooling inherit the
classification of the behavior, contract, or review boundary they define or
change. Artifact type may help reviewers understand a patch, but it does not
replace risk classification.

The mapping is:

| Affected subject                                                                     | Classification                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Kernel contract documentation or ADR                                                 | Kernel                                                           |
| Extension or public integration contract documentation or ADR                        | Extension                                                        |
| Interface documentation, developer-facing project documentation, or package metadata | Experience                                                       |
| One coherent decision or change spanning multiple review boundaries                  | Every applicable classification, with the strongest gate applied |

Repository-facing material uses Experience only when it does not define or
change a Kernel or Extension contract. For example, contributor-facing package
metadata is Experience, while an event-versioning guarantee documented in the
same repository is Kernel.

### Classification of the positioning change

The `README.md` and `package.json` positioning change is Experience. It improves
developer-facing project documentation and metadata without changing a Kernel
or Extension contract.

This ADR itself spans Kernel, Extension, and Experience because it defines how
changes are assigned to all three review boundaries. Its Kernel scope means
review of this ADR must satisfy the strongest applicable gate; the ADR does not
claim that automated validation provides the required human approval.

## Considered solutions

### Add a Documentation classification

A Documentation category would make prose-only changes easy to identify.

This solution is rejected because documentation is an artifact type rather than
a review boundary. It would group low-risk metadata edits with changes to
authoritative Kernel contracts and could incorrectly suggest that the latter
need only a documentation-level review.

### Add separate Design or ADR classifications

Design and ADR categories would distinguish decision-making artifacts from
implementation patches.

This solution is rejected for the same reason. A design record may define a
Kernel persistence invariant, an Extension integration contract, an Experience
decision, or a coherent cross-layer rule. Its subject determines the necessary
review.

### Add a Station classification

Station was evaluated as a possible existing or new category. The repository
contains no canonical definition or enforcement of that term.

This solution is rejected because it names no distinct contract, trust
boundary, evidence requirement, or ownership model. Adding it would create
ambiguity rather than close a taxonomy gap.

### Classify all project documentation as Experience

Treating every repository document as developer experience would keep the
taxonomy small and make classification mechanical.

This solution is rejected because canonical documentation and design records
can define Kernel or Extension contracts. Experience is appropriate only for
project-facing documentation and metadata that does not affect those
boundaries.

### Allow one classification only

Every pull request could select the single category that best describes most of
its content.

This solution is rejected because a coherent cross-layer decision can affect
multiple boundaries. Selecting only the dominant category could hide a Kernel
impact and apply a weaker gate than the change requires.

## Consequences

### Gains

- The taxonomy remains small and aligned with architectural trust and review
  boundaries.
- Documentation cannot bypass Kernel review merely because it contains no
  executable code.
- Low-risk project metadata does not acquire the full Kernel quality gate.
- Design records can express cross-layer scope without inventing aliases.
- Pull requests expose every affected boundary and apply the strongest relevant
  evidence and approval requirements.

### Costs and limitations

- Classification requires judgment about what a change affects rather than a
  mechanical directory or file-extension rule.
- A mixed documentation patch may need more than one classification.
- Reviewers must distinguish editorial clarification from a change to a
  documented contract.
- The repository currently relies on contributor guidance and the pull request
  template; CI does not validate classification values or review-gate
  satisfaction automatically.
- Experience includes project-facing documentation and metadata for review
  purposes, even though those artifacts are not application interface code.

## Evaluation

This record may advance to Evaluation after representative documentation,
design-record, and mixed implementation pull requests:

- classify their affected contracts consistently;
- list multiple classifications when a coherent change crosses boundaries;
- apply the Kernel quality gate whenever any part changes a Kernel contract;
- avoid Documentation, Design, ADR, Frontend, Station, or other noncanonical
  aliases.

It may advance to Stable after repeated use shows that the three categories
cover repository changes without hiding meaningful review-boundary differences
or requiring recurring maintainer exceptions.

## References

- [Hyperkernel public architecture](../../README.md)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [Contributing to Hyperkernel](../../CONTRIBUTING.md)
- [ADR conventions](README.md)

## Status history

| Date       | Status      | Reason                                                           |
| ---------- | ----------- | ---------------------------------------------------------------- |
| 2026-07-28 | Development | Decision adopted and repository classification guidance updated. |
