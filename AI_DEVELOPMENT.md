# Human and AI development workflow

Hyperkernel welcomes changes written by people, people using AI tools, and AI
agents operating with delegated repository access. The same technical and
review standards apply regardless of how a change was produced. AI involvement
does not transfer accountability away from the people who approve and merge it.

This policy concerns development of the Hyperkernel repository. The runtime
rules for AI agents acting inside a Hyperkernel system are defined separately
in `README.md` and `AGENTS.md`.

## Roles and responsibilities

Authoring, review, approval, and merge are separate responsibilities:

- **Authors** may be humans or AI agents. They prepare code, documentation,
  tests, and supporting evidence. Authors must classify a meaningful change as
  Kernel, Extension, or Experience according to `AGENTS.md`, limit it to a
  coherent scope, and accurately report tests and known uncertainty.
- **Human reviewers** inspect the actual diff and its evidence. A reviewer must
  understand the behavior being accepted, challenge unsupported assumptions,
  and request further tests or specialist review when needed. Reviewing an
  explanation without examining the change is not sufficient.
- **AI reviewers** may provide an additional independent analysis, identify
  risks, or suggest tests. Their output is advisory: it is neither an approval
  nor a substitute for required human review.
- **Approvers** are authorized human maintainers. Approval records a human
  judgment that the change is understood, appropriately verified, and
  acceptable for its classified risk. An approver remains accountable for that
  judgment even when an AI agent authored or reviewed the work.
- **Mergers** are authorized human maintainers or automation acting under an
  explicitly approved repository rule. Passing checks or an automated merge
  does not create approval; all required human approvals must already exist.

The same person may author, review, approve, or merge where repository rules
allow, but those activities must not be conflated. In particular, an author
cannot present tool output or an agent review as the accountable approval.

## AI-assisted and autonomous work

**AI-assisted work** is directed and inspected by a human author while it is
being produced. **Autonomous agent work** is produced through delegated tasks
with limited or no contemporaneous human supervision. Both are acceptable, and
both require review proportional to risk.

A pull request must disclose material AI involvement when AI generated or
substantially transformed repository content. State whether the work was
AI-assisted or autonomously agent-authored and identify the relevant tool or
agent when known. Incidental completion, spelling, search, or formatting help
does not require disclosure. Disclosure provides useful provenance; it does
not reduce the human review standard or imply that generated content is wrong.

The pull request description must also identify the change classification,
summarize the verification performed, and call out unverified assumptions,
failed checks, security implications, and compatibility or recovery risks.
Never include private reasoning, secrets, credentials, or unnecessary personal
data as provenance or evidence.

## Review evidence and approval by change class

Every review considers the diff, relevant contracts, test results, and the
failure modes appropriate to the change:

- **Kernel changes** require the complete Kernel quality gate in `AGENTS.md` and
  approval from an experienced human maintainer who understands the affected
  contract and invariant. The review record should identify that invariant and
  address failure, retry, concurrency, recovery, and compatibility where they
  apply. Agent-only review is never sufficient.
- **Extension changes** require human review and verification proportional to
  their domain and integration risk. An extension that can bypass constrained
  APIs or affect platform-wide integrity crosses the Kernel review boundary.
- **Experience changes** require human review and verification proportional to
  user impact, accessibility, security, and the risk of bypassing kernel
  contracts.

Automated checks provide reproducible evidence about properties they actually
test. They do not understand the whole change, establish policy compliance, or
count as human review. Authors and reviewers must not describe a green check,
coverage number, generated report, or agent verdict as proof of approval.

## Escalation and exceptions

Stop and escalate to an experienced human maintainer when a change cannot be
classified confidently, its trust-boundary impact is unclear, reviewers
disagree about an invariant or required evidence, an AI result cannot be
verified, or requested verification cannot be completed. Security concerns
must follow the private process in `SECURITY.md` rather than a public issue.

Exceptions to this workflow require an explicit, documented decision by an
authorized human maintainer. An exception must state its scope and rationale,
the unresolved risk, any compensating verification or approval, and the owner
of follow-up work. Uncertainty is not a reason to silently lower the review
standard; unresolved high-impact or Kernel risk blocks approval and merge.
