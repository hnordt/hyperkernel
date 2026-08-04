# 0010: Explicit domain primitives

| Field        | Value             |
| ------------ | ----------------- |
| Status       | Draft             |
| Scope        | Kernel, Extension |
| Created      | 2026-08-04        |
| Last updated | 2026-08-04        |

## Summary

Hyperkernel remains a self-hostable, event-sourced platform for independent
developers and small organizations. Its additional primary architectural goal
is to make domain behavior explicit and composable: the kernel provides
constrained application and infrastructure primitives from which extensions
define named domain concepts and compose functionality.

The platform deliberately accepts more verbose definitions when they turn an
implicit business choice into an inspectable contract. This is especially
valuable when AI generates much of the application code. AI makes the
declarations cheaper to produce, but it does not make generated code trusted;
the kernel's role is to provide boundaries and constraints that make the result
reviewable.

Each primitive has one responsibility. A useful feature may need several small
contracts for its authorization, decision data, rules, fact mapping, and
declared effects. This is a desired result of the architecture, not accidental
ceremony: composition must expose those distinct responsibilities instead of
hiding them inside one broad primitive.

This record documents and elaborates the matching canonical invariants in
`README.md` and `AGENTS.md`. Those files take precedence if this Draft or any
other design record conflicts with them. This record does not claim a supported
public API or implemented runtime behavior.

## Problem

Commands, events, schemas, and a database boundary alone do not make an
application's business behavior inspectable. A developer or AI agent can hide
an authorization check, a domain calculation, a data dependency, or a request
for external work inside an ordinary callback or helper. The resulting behavior
may be locally correct while remaining invisible to the kernel, difficult to
reuse, and hard to review as a system contract.

Allowing arbitrary pure helpers solves a local implementation problem but does
not meet Hyperkernel's intended boundary. A reviewer or tool must inspect
arbitrary control flow to discover what rules, data, and facts govern a feature.
This is particularly weak when an agent can cheaply generate a large amount of
plausible code.

Hyperkernel needs a model in which application behavior is a readable,
inspectable graph of domain descriptors. The model must retain event-sourced
authority and must not turn declarative definitions into a back door for direct
database access, hidden side effects, or ambient authority.

## Decision

### Preserve the product and event-sourced boundary

Hyperkernel is designed for self-hosted applications operated by independent
developers and small organizations. This is a design target, not a prohibition
on larger deployments. Primitive count, operational complexity, and the first
vertical slice must be evaluated against that target.

Event sourcing remains the core authority model. Commands record intent;
accepted immutable events record the authoritative durable facts; projections
are derived and rebuildable. Auditability means retaining consequential command
decisions, accepted facts, and relevant external-work lifecycle facts. It does
not mean retaining secrets, unnecessary raw AI context, transient presentation
state, or data that requires a separate retention or erasure design.

### Express domain behavior through primitives

Every domain concept that authorizes, rejects, reads decision data, turns
accepted intent into a fact, or requests external work must be represented by a
named primitive descriptor. A descriptor exposes, at minimum:

- its category and stable identity;
- input and output schemas;
- declared data dependencies;
- its permitted result and composition role; and
- any version, authorization, or audit metadata required by its contract.

An application composes these descriptors to express functionality. The kernel
owns dependency resolution, authoritative execution, persistence, and audit;
extensions use the constrained contracts to name their domain concepts. A
primitive may declare data dependencies, but it never executes, schedules,
mutates, or grants authority to another primitive.

Every primitive has one responsibility. A feature can require several focused
descriptors, and their composition is the feature's explicit contract. Do not
combine authorization, data access, domain rules, event mapping, and effect
declaration inside a convenience primitive merely to make an application
definition shorter.

This establishes a structural definition of explicitness. A code-first callback
may implement a declared descriptor, but it may only run in that descriptor's
bounded callback slot and with its declared inputs. An unregistered helper or
arbitrary orchestration branch must not introduce a domain decision or effect
request that the kernel cannot locate and inspect.

### Accept verbosity as the cost of an explicit domain language

The platform accepts additional declarations and repeated structure when they
name a domain choice, dependency, allowed outcome, or effect request that would
otherwise remain implicit. The target measure of success is that a supported
application can be understood as a composition of named domain descriptors,
rather than as arbitrary application or infrastructure control flow.

"Complete" means complete for the supported application scope. It does not
claim that every future workflow, calculation, or integration is already
representable. A missing primitive must be discovered through a working flow
and added as a new explicit contract, not filled by an informal escape hatch.

### Measure success by where development attention goes

Hyperkernel does not aim to eliminate implementation detail or make a system
intrinsically less complex. It aims to reduce and isolate recurring application
and infrastructure complexity so that, when building a representative
application, developers and AI agents spend most of their effort on domain
semantics and business rules rather than reimplementing persistence,
authorization, audit, dependency resolution, and effect delivery.

The complexity inherent in the domain remains. Application development still
requires modeling the system faithfully and reducing its domain concepts into a
manageable set of named contracts. This is long-term maintenance work, not
infrastructure plumbing that the kernel can remove. The architectural claim is
decoupling: Hyperkernel owns much of the recurring application and
infrastructure complexity, while applications retain explicit responsibility
for modeling and simplifying their own domains.

### Keep primitives pure and effects declarative

Primitive factories are side-effect free. They produce inert descriptors or
pure synchronous callbacks. A callback receives only declared immutable data
and returns a validated value or descriptor; it does not receive a capability
to write state, dispatch commands, append events, access the network, read the
clock or randomness, or execute an effect.

An effect is a future primitive for declaring requested external business work.
The declaration is itself pure. Only the kernel may schedule and execute it
after durable acceptance through a delivery contract that records requests,
attempts, outcomes, ambiguity, retries, reconciliation, and resulting facts.
An effect declaration is not proof that an email was sent, a payment completed,
or an agent tool succeeded.

### Preserve the limits of a code-first implementation

TypeScript cannot prove that an arbitrary closure is mathematically pure or
free of all ambient behavior. The immediate contract is therefore purity by
capability and structure: callbacks have no kernel mutation capability, their
dependencies are declared, and their allowed outputs are bounded and validated.
Code review, linting, testing, and runtime isolation remain necessary. A future
closed DSL, compiler, or sandbox would be needed to inspect or restrict every
operation in callback bodies.

## Invariants

1. Hyperkernel targets self-hosted application development for independent
   developers and small organizations.
2. Event sourcing remains the source of durable authority: commands record
   intent, accepted immutable events record facts, and projections are derived
   state.
3. Audit history captures consequential domain decisions and relevant
   external-work lifecycle facts, subject to explicit privacy, retention, and
   security boundaries.
4. Every participating domain concept has a named primitive descriptor with an
   explicit category, identity, schemas, dependencies, permitted result, and
   composition role.
5. Domain behavior may not be hidden in an unregistered helper or arbitrary
   orchestration branch.
6. The kernel provides constrained application and infrastructure primitives;
   extensions translate them into domain concepts and compose those concepts
   into functionality.
7. Extra declarations are an accepted cost when they make business behavior
   inspectable. AI reduces the authoring cost but never lowers review or
   activation standards.
8. Primitive factories and callbacks are side-effect free, synchronous, and
   capability-limited. They return only validated values or descriptors.
9. A primitive can declare data dependencies but cannot execute, schedule,
   mutate, or grant authority to another primitive. The kernel owns resolution
   and execution.
10. Domain code declares external work through an effect primitive; it never
    performs that work directly. The kernel owns delivery after durable
    acceptance.
11. The purity guarantee is a capability and enforcement contract, not a claim
    that TypeScript alone can prove the semantic purity of arbitrary callbacks.
12. Every primitive has one responsibility. A feature may compose many focused
    mini-contracts; this verbosity is an intentional means of making domain
    behavior explicit and formal.
13. Hyperkernel reduces and isolates recurring application and infrastructure
    complexity; it does not remove the complexity inherent in a domain. Success
    is evidenced when application development concentrates on modeling,
    reducing, composing, and maintaining domain concepts.

## Relationship to existing records

[0009: Explicit business rules](0009-explicit-business-rules.md) applies this
direction to reusable rule descriptors and decision queries. Its custom-decider
escape path remains valid only when the decider is itself a named, typed,
versioned primitive descriptor; it cannot be an arbitrary helper that bypasses
the explicit-domain-contract boundary.

[0008: Process orchestration and actor model evaluation](0008-process-orchestration-and-actor-model.md)
explores durable processes, effects, attempts, and workers. This record does
not select their public names or lifecycle API. It fixes only the boundary that
effect declarations are pure domain contracts and that their execution belongs
to the kernel's post-acceptance delivery machinery.

This record does not define a complete catalog of primitives, a public
TypeScript surface, an unrestricted value-derivation primitive, or the durable
effect-delivery implementation. Those contracts require evidence from a
working vertical slice.

## Alternatives considered

### Allow ordinary helpers for pure domain logic

This keeps application code compact and familiar, but makes dependencies and
domain choices discoverable only by reading arbitrary implementation code. It
does not meet the goal of an explicit domain language for AI- and
developer-authored applications.

### Treat event sourcing alone as the domain boundary

Events preserve accepted history but do not expose how an application decided
to produce a fact. Rules, decision data, transformations, and effect requests
can still be hidden in code before the append boundary.

### Introduce a universal expression language now

A closed DSL could make more behavior machine-inspectable, but inventing one
before a working vertical slice would add a broad, speculative contract. The
current direction first requires named descriptors and constrained callbacks;
future evidence may justify a DSL, compiler, or sandbox.

## Consequences and limitations

- Application definitions become more verbose and need stronger descriptor
  branding, schema validation, dependency validation, and composition checks.
- A feature may require several small contracts instead of one convenience
  primitive. This is intentional when the contracts expose distinct domain
  responsibilities.
- The kernel does not remove the work of understanding and simplifying a
  domain. Its value is to separate that enduring work from recurring
  application and infrastructure detail.
- The kernel must reject undeclared dependencies, invalid outputs, asynchronous
  results, and attempted use of unavailable capabilities.
- Pure callback bodies remain reviewable code rather than fully declarative
  data. The platform must not overclaim that a TypeScript type alone enforces
  purity.
- A workflow requiring a calculated domain value that is neither a declared
  query result nor a direct mapping remains unsupported until a dedicated,
  explicit primitive is justified.
- Effect declarations require a later durable delivery design; they must not be
  implemented as inline I/O inside a command decision.

## Evidence required for Development

Before this record advances from Draft, a complete vertical slice must show:

1. named primitive descriptors for one useful domain flow, including explicit
   data dependencies and validated inputs and outputs;
2. command acceptance, expected rejection, invalid-definition, and
   asynchronous-result tests;
3. proof that extensions cannot obtain direct database or effect-execution
   capabilities through the primitive API;
4. an event-sourced audit trail connecting the command, decision, facts, and
   any declared external work; and
5. a documented decision on the first domain calculation that direct mapping
   and declared query results cannot express.
6. evidence from the flow that its application definition is primarily a
   composition of domain contracts, rather than bespoke implementation and
   infrastructure control flow.

## Status history

- 2026-08-04 — Draft created to document explicit domain primitives, purity by
  capability, and declared effects as architectural direction.
