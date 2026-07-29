# Contributing to Hyperkernel

Hyperkernel is an early architecture prototype. Contributions should help prove
the bounded v0.1 application flows described in the README rather than expand
the platform speculatively.

## Before you start

- Read the current implementation and v0.1 scope in `README.md`.
- Use the domain language in `CONTEXT.md`.
- Follow the engineering and architecture conventions in `AGENTS.md`.
- Open an issue before starting a large feature or changing a public contract.

Security vulnerabilities must be reported privately according to `SECURITY.md`.

## Local setup

Hyperkernel requires Node.js 24 or later and npm 11 or later.

```sh
npm ci
cp .env.example .env
npm run dev
```

The default SQLite database is `./local.db`. Local database files and `.env`
files are ignored by Git.

## Verification

Install the Chromium browser once before running browser tests:

```sh
npx playwright install chromium
```

Before submitting a pull request, run:

```sh
npm run check
npm run lint
npm run test
npm run build
```

## Pull requests

- Keep each pull request limited to one coherent change.
- Add tests for new behavior and regressions.
- Update documentation when setup, behavior, or a public contract changes.
- Preserve existing vocabulary unless a terminology change is deliberate.
- For material AI involvement, include the disclosure and evidence required
  below.
- Write the commit message as a single sentence summarizing the change.

Generated files, local databases, credentials, and unrelated formatting changes
must not be included.

## Human and AI development workflow

Hyperkernel welcomes changes written by people, people using AI tools, and AI
agents operating with delegated repository access. The same technical and
review standards apply regardless of how a change was produced. AI involvement
does not transfer accountability away from the people who approve and merge it.

This policy concerns development of the Hyperkernel repository. The runtime
rules for AI agents acting inside a Hyperkernel system are defined separately
in `README.md` and `AGENTS.md`.

### Roles and responsibilities

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

### AI usage disclosure

A pull request must disclose material AI involvement when AI generated or
substantially transformed repository content. Identify the relevant tool or
agent when known, mark whether AI was used for planning, implementation, and/or
writing tests, and select one overall usage level. The levels describe human
involvement before the AI presents a completed result:

- **Supervised** — AI automated manual work while a human continuously directed
  and reviewed each step in real time, as in pair programming.
- **Assisted** — AI performed most of the work while a human periodically
  reviewed or corrected intermediate work, without continuously supervising
  each step.
- **Automated** — AI produced the completed work after initial instructions,
  without further human review or intervention. A later review of the completed
  work does not change this level.

If different parts used different levels, report the level with the greatest AI
autonomy used materially anywhere in the pull request. For example, a pull
request with supervised planning and assisted implementation is classified as
assisted. Running tests does not mean AI was used to write them.

Incidental completion, spelling, search, or formatting help does not require
disclosure. Disclosure provides useful provenance; it does not reduce the human
review standard or imply that generated content is wrong. The usage level
describes how the content was produced, not whether it is approved. Automated
work still requires the human review and approval appropriate to its change
classification before merge.

The pull request description must also identify the change classification,
summarize the verification performed, and call out unverified assumptions,
failed checks, security implications, and compatibility or recovery risks.
Never include private reasoning, secrets, credentials, or unnecessary personal
data as provenance or evidence.

Classify the affected contract rather than the changed file type, following
`AGENTS.md`. Documentation, ADRs, and design records inherit the classification
of what they define; project-facing documentation or metadata with no Kernel or
Extension contract impact is Experience. List every affected classification
when a coherent change crosses boundaries.

### Review evidence and approval by change class

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

### Escalation and exceptions

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
