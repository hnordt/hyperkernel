# 0010: Deno runtime and Web Components frontend

| Field        | Value              |
| ------------ | ------------------ |
| Status       | Draft              |
| Scope        | Kernel, Experience |
| Created      | 2026-08-02         |
| Last updated | 2026-08-02         |

## Summary

Hyperkernel intends to replace Svelte, SvelteKit, Node.js, and npm as its
primary application-development stack with a Deno workspace and a frontend built
primarily from Web Components.

Deno will own TypeScript execution, workspace resolution, tasks, formatting,
linting, type checking, testing, and the server runtime. Public UI packages will
expose standards-based custom elements instead of requiring consumers to use
Svelte. Preact will be retained only as a small rendering engine: Hyperkernel
may use JSX to describe a render tree and Preact to turn that tree into DOM or
HTML, but it will not adopt hooks, signals, context, or Preact's application
state model.

The Hyperkernel shell is not being designed around server-side rendering.
Reusable UI primitives must nevertheless support applications that render on the
server. Their server representation will use Declarative Shadow DOM where
encapsulation is required. Declarative Shadow DOM solves HTML serialization of a
shadow tree; it does not by itself solve hydration, event attachment, state
reconciliation, or component composition. Those contracts require implementation
evidence before this record can advance.

This record proposes a complete replacement for
[0003: Web-platform-first frontend](0003-web-platform-first-frontend.md). It
changes the Svelte and SvelteKit decisions while carrying forward that record's
Web Platform, accessibility, headless-UI, Zod, dependency-review, and security
decisions. It does not claim that the replacement has already been implemented.
The current repository remains a SvelteKit application running on Node.js and
managed with npm until an incremental migration satisfies the evidence in this
record and the canonical guidance in `README.md`, `AGENTS.md`, and
`CONTRIBUTING.md` is updated.

### Relationship to record 0003

Record 0003 continues to describe the implemented frontend and tooling baseline
while this record is Draft, Development, or Evaluation. Advancing this record to
Development also ends new investment in the Svelte and SvelteKit direction
except for compatibility, security, and migration work needed to preserve a
runnable system.

Record 0003 will move directly from Development to Legacy in the same change
that advances this record to Stable. That change must update both records and
the design-record index. Because this record carries forward every decision
from record 0003 that remains applicable, the transition will not retire the Web
Platform, accessibility, headless-UI, Zod, dependency-review, or security
contracts.

## Problem

Hyperkernel is becoming a monorepo so that its kernel, storage, interface, and
other reusable contracts can be developed together and published as packages.
That work exposed a mismatch between the intended package boundary and the
current frontend boundary.

A Svelte component package is easiest to consume from another Svelte
application. It can be adapted for other consumers, including by compiling
components as custom elements, but Svelte remains the authoring model and
compiler contract behind those elements. Hyperkernel wants its UI primitives to
be usable from plain HTML and JavaScript and from applications built with
different frameworks without requiring each consumer to adopt Svelte-specific
tooling or semantics.

SvelteKit also brings an application model and a collection of integrated and
adjacent tools. The current repository separately configures npm, Vite,
Prettier, ESLint, Svelte checks, Vitest, Playwright, and a Node adapter. Each
tool is individually reasonable, but together they create more configuration,
dependency upgrades, and integration boundaries than Hyperkernel wants to own.

Remote functions were the main SvelteKit-specific capability that justified this
cost. At the time of this decision they remain experimental and may change
without notice. They present a framework-specific programming model that is
compiled into generated HTTP endpoints and `fetch` wrappers. That can be
productive inside a SvelteKit application, but it does not provide the explicit,
framework-independent `Request`, `Response`, command, and query contracts
Hyperkernel wants at its public boundaries.

The deeper issue is not that Svelte or SvelteKit are defective. They solve a
broader frontend problem by introducing a framework model for components,
reactivity, routing, data loading, rendering, and client-server communication.
Hyperkernel instead wants its primary vocabulary to remain close to the Web
Platform so that packages are portable, contracts remain inspectable, and the
cost of replacing a tool does not become the cost of rewriting the product.

Deno is a better fit for that direction. It executes TypeScript directly,
implements web-standard server APIs, denies sensitive I/O by default, supports
workspaces, and includes the formatter, linter, type checker, test runner, and
task runner required for the initial project. Consolidating those concerns in
one runtime reduces configuration and dependency management so that the
repository can spend more of its complexity budget on Hyperkernel itself.

Web Components create a similar opportunity in the browser. Custom elements,
Shadow DOM, templates, slots, DOM events, CSS custom properties, and CSS parts
provide a framework-independent component boundary. Their missing integrated
rendering and state model is a cost, but it is also an opportunity to choose a
smaller and more explicit internal model than the general-purpose reactivity
systems supplied by Svelte, React, and similar frameworks.

## Invariants

1. Public UI contracts are expressed through HTML element names, attributes,
   properties, methods, events, slots, CSS custom properties, CSS parts, and
   TypeScript declarations. They do not require a Svelte or Preact runtime in a
   consuming application's source model.
2. Svelte, Preact, Deno, router, build, or transport APIs never define durable
   domain state or bypass Hyperkernel's command, authorization, event, and
   projection contracts.
3. Framework transports remain adapters around explicit, framework-independent
   command and query contracts based on Web Platform data types where those
   types satisfy the contract.
4. Preact is an internal rendering mechanism, not Hyperkernel's component,
   state-management, or public application model.
5. UI state changes are explicit. Hyperkernel will not introduce a general
   reactive graph, hooks, signals, or another implicit dependency-tracking model
   without a new design decision supported by concrete failure cases.
6. A custom element owns its local ephemeral state. Durable user-visible state
   still changes through commands and events; using Web Components does not
   create a second persistence model.
7. A server-rendered custom element produces valid HTML that is useful before
   client upgrade. Client initialization preserves the semantic content and
   state represented by that HTML rather than blindly replacing it.
8. Declarative Shadow DOM is used only where shadow encapsulation is part of the
   component contract. A component may deliberately use light DOM when document
   semantics, forms, styling, accessibility, or composition make it the better
   boundary.
9. Deno permissions follow least privilege in development, tests, production,
   and package scripts. `--allow-all` is not the default execution contract.
10. Deno's process permissions do not replace Hyperkernel actor identities,
    capabilities, command authorization, database boundaries, or extension
    isolation.
11. The runtime migration preserves every kernel persistence, transaction,
    ordering, replay, recovery, and compatibility invariant. A change of runtime
    is not permission to change kernel semantics.
12. Packages intended for npm consumers are tested from their published artifact
    and supported consumer runtimes. Passing inside the Deno workspace is
    necessary but not sufficient evidence of npm compatibility.
13. The repository does not maintain permanent parallel Svelte and Web
    Components implementations of the same interface. Temporary coexistence
    requires an explicit migration boundary and removal condition.
14. Hyperkernel uses semantic HTML, native controls, CSS, ECMAScript, and
    browser APIs directly when they satisfy the required contract. It does not
    adopt a headless UI library without a new design record.
15. Platform-first implementation does not weaken accessibility. Custom
    interactions preserve correct semantics, keyboard operation, focus
    behavior, and assistive-technology support.
16. Zod remains the runtime schema-validation mechanism. Its internal
    representation is not a durable wire or storage format, and upgrades must
    preserve the accepted meaning of versioned schemas.

## Decision

### Carry forward the platform, accessibility, and validation boundaries

Hyperkernel continues to use semantic HTML, native controls, CSS, ECMAScript,
and browser APIs directly when they satisfy the product contract. It continues
to own the observable behavior and styling of its core interface primitives and
will not introduce a headless UI library without a new design record that
defines the missing platform capability, accessibility behavior, compatibility
contract, dependency impact, and exit path.

Accessibility remains a product contract rather than a benefit assumed from a
framework or component library. Custom elements and intentional deviations from
native behavior must preserve semantics, keyboard operation, focus behavior,
forms, and assistive-technology support through documented tests.

Zod remains the runtime validation mechanism for untrusted structured data.
Schemas may be implemented with regular Zod or Zod Mini when their APIs satisfy
the boundary, but their internal representation does not identify a durable
contract. Event and storage compatibility remain governed by explicit types and
schema versions.

Future dependency exceptions require the same evidence established by record
0003: the missing platform capability, observable behavior owned by the
dependency, compatibility contract, transitive and build impact, migration
path, and why local ownership would be riskier.

### Use Deno as the primary runtime and toolchain

The monorepo will be defined by a root `deno.json` workspace. Deno will run
TypeScript, workspace tasks, formatting, linting, type checking, unit tests, and
the server application. Repository commands should prefer built-in Deno
capabilities before adding an overlapping package or configuration layer.

The server boundary will use `Deno.serve`, `Request`, `Response`, `URL`,
`Headers`, `FormData`, Web Streams, and other standards-based APIs where they
provide the required contract. Routing and transport code remain thin adapters
around kernel commands and queries. Deno request objects, permission objects,
and runtime-specific APIs do not enter public kernel contracts.

Deno is selected as a mature, actively maintained runtime whose security model,
Web Platform alignment, and integrated tooling match Hyperkernel's direction.
Confidence in the project's engineering practices supports the choice, but it is
not a compatibility guarantee. Hyperkernel will pin supported versions, inspect
relevant changes, and verify upgrades against its own contracts.

Deno's Node and npm compatibility may support migration or a dependency that has
no adequate alternative. Compatibility is a boundary, not the new default
vocabulary. Each retained Node or npm dependency must have an identified owner
and a reason to remain.

This decision replaces npm as the primary local package manager and task
orchestrator. It does not remove npm as a distribution target. Deno workspaces
can contain npm packages, while `deno publish` itself targets JSR. Any
Hyperkernel package published to npm will therefore retain the metadata and
build or packaging step required by npm consumers. That pipeline must be
explicit, reproducible, and verified from the produced tarball.

JSR may later become an additional distribution target, but adopting Deno does
not make JSR publication part of this decision.

### Use Web Components as the public UI boundary

Reusable Hyperkernel interface primitives will be autonomous custom elements.
Their observable contract will use the standard browser component vocabulary:

- attributes for serializable declarative input;
- properties and methods where values or behavior cannot be represented
  faithfully as attributes;
- DOM events for observable output and interaction;
- light DOM and named slots for caller-owned content;
- Shadow DOM only for intentional encapsulation;
- CSS custom properties and parts for supported styling boundaries;
- TypeScript declarations for typed consumers.

This allows the same element to be used from plain HTML, a Hyperkernel
application, or another framework. A consumer may wrap an element in its own
framework, but Hyperkernel will not require that wrapper as the canonical API.

The first implementation must define registration behavior, duplicate-version
behavior, error reporting, teardown, focus, forms, accessibility, and browser
support. Custom-element registration is global and effectively permanent for a
document, so package loading and development reload cannot assume that an
existing element name can be redefined.

### Use Preact only for rendering

Hand-written DOM updates are explicit but become verbose and error-prone for
nontrivial conditional and repeated markup. Hyperkernel will use Preact as a
small internal renderer so component implementations can describe output with
JSX and render that description into a DOM root.

The accepted boundary includes the Preact VNode type, JSX transformation, client
rendering, and the server renderer needed to produce HTML. It does not include
hooks, signals, context, compatibility APIs, a Preact application root, or
Preact components as public Hyperkernel component contracts.

A custom element remains the lifecycle and ownership boundary. It receives input
through platform contracts, stores explicit local state, decides when a render
is necessary, and invokes the renderer. Rendering does not discover state
dependencies or decide when state changed.

Preact is replaceable only if that claim is kept true in the source. Shared code
must not gradually depend on hooks or Preact-specific context and then continue
describing Preact as an implementation detail. If concrete components show that
the narrow renderer boundary is insufficient, the project must revisit this
decision explicitly.

### Keep state transitions explicit

Hyperkernel will not begin by creating a general frontend state-management
abstraction. A component may keep local ephemeral state in fields or a small
component-owned controller. An input, DOM event, command result, or explicit
method changes that state and requests a render.

This model may repeat some update code that a reactive framework could infer.
That is an accepted initial cost. For Hyperkernel, visible ownership and
predictable control flow are more important than minimizing every state-to-view
binding.

Shared durable state remains in projections and enters the interface through
queries or subscriptions with explicit ownership and cleanup. State shared only
between a small set of components should first use DOM composition, properties,
and events. A broader client-side store requires concrete evidence that these
boundaries are inadequate.

### Support server rendering through Declarative Shadow DOM

The Hyperkernel shell does not require server-side rendering as its primary
delivery model. Published UI primitives must still be usable by applications
that do.

When a component uses Shadow DOM, its server renderer will emit the custom
element host and a declarative shadow root through
`<template shadowrootmode="open">`. Preact's server renderer may produce the
inner HTML, while Hyperkernel owns the custom-element and Declarative Shadow DOM
wrapper contract.

Declarative Shadow DOM makes a shadow tree available during HTML parsing. It
does not attach event listeners or establish how a later client renderer
reconciles existing nodes. Each component must define whether client upgrade
adopts, hydrates, or deliberately rerenders that tree. The implementation must
prove that initialization does not flash empty content, duplicate nodes, lose
form state, or violate focus and accessibility semantics.

Components that do not need shadow encapsulation may render ordinary light DOM
on the server. Server rendering must not force every component into Shadow DOM.

### Learn component composition from representative primitives

The project does not yet have enough implementation experience to standardize a
composition model beyond Web Platform primitives. Attributes, properties,
events, light DOM, and slots are the starting vocabulary, not a claim that they
already cover every Hyperkernel composition requirement.

Before adding a project-specific composition framework, the project will build
representative primitives that cover:

- nested components with caller-provided content;
- form participation and validation;
- focus ownership across shadow boundaries;
- lists whose children are added, removed, and reordered;
- overlays or other content that may cross a component's visual boundary;
- server-rendered content upgraded on the client;
- typed consumption from plain TypeScript and at least one external framework.

The resulting failures will define any additional abstraction. The repository
will not design a general composition system from hypothetical requirements.

## Package and compatibility boundary

The Deno workspace is the source-development model. Registry artifacts are
compatibility products and may need a different physical representation.

Each public package must define:

- its source entry points and public exports;
- its supported browser, Deno, and Node.js environments as applicable;
- whether it is published to npm, JSR, or both;
- the generated JavaScript, declarations, styles, and metadata in its artifact;
- whether custom elements register on import or through an explicit function;
- how consumers detect or avoid duplicate registrations and incompatible
  versions;
- a smoke test that installs or imports the produced artifact outside the
  monorepo.

The exact npm packaging mechanism is intentionally not selected here. It must be
evaluated against real Hyperkernel packages. The decision should minimize
generated configuration and avoid making local development depend on stale build
output.

The runtime migration also crosses the kernel boundary because the current
prototype uses the built-in `node:sqlite` module and a centralized synchronous
connection. The Deno implementation must prove the same single-connection,
transaction, authorizer, failure, and recovery behavior before the Node runtime
is removed. Any change to the SQLite API or persistence semantics requires its
own contract review and the full kernel quality gate.

## Security boundary

Deno's default-deny I/O model reduces ambient runtime authority, but it is not
module isolation. Code running in the same Deno process and thread shares the
permissions granted to that process. Static module loading also has distinct
permission behavior from I/O performed after a module starts executing.

Production tasks must grant only the filesystem paths, network addresses,
environment variables, subprocesses, foreign-function interfaces, and other
capabilities they require. Broad flags must not become a substitute for
understanding those requirements.

These runtime permissions complement rather than replace Hyperkernel's trust
model. Extensions and agents still use constrained kernel APIs. They do not
receive direct database or event-log write access merely because Deno can deny
some host operations.

Removing framework and tooling dependencies reduces the trusted build and
runtime surface. It does not prove supply-chain security. Deno, Preact, Zod,
registry packages, build scripts, browser APIs, and Hyperkernel's own code
remain inside the threat model and require versioning, review, and tests.

## Migration

The migration will proceed through explicit boundaries instead of rewriting the
application in one step:

1. Define the Deno workspace, pinned runtime version, tasks, permissions, and
   repository-wide verification commands without changing kernel behavior. Add
   the corresponding CI path and setup guidance in the same change.
2. Make kernel and storage packages executable and testable through Deno while
   preserving SQLite and public-contract tests.
3. Define one representative custom-element package with client rendering,
   server rendering, typed public contracts, accessibility tests, and an
   external-consumer smoke test.
4. Replace SvelteKit-specific command and query adapters with explicit `Request`
   and `Response` transports over the same kernel contracts, updating their
   examples and canonical transport guidance in the same change.
5. Migrate the Hyperkernel shell by coherent interface areas, with temporary
   interoperation only where the removal condition and current setup guidance
   are documented.
6. Verify npm artifacts from clean consumer projects, then remove obsolete npm,
   Node.js, Svelte, SvelteKit, Vite, Prettier, ESLint, and adapter
   configuration. Each removal must update the affected `README.md`,
   `AGENTS.md`, `CONTRIBUTING.md`, examples, CI commands, and setup instructions
   in the same coherent change so every intermediate repository state remains
   runnable, testable, and permitted by its canonical guidance.

The migration must preserve a runnable and testable path. Temporary adapters
must not become permanent public APIs merely because they existed during the
transition.

## Considered solutions

### Keep Svelte and SvelteKit

Svelte and SvelteKit provide mature composition, reactive rendering, routing,
server rendering, hydration, development tooling, and a productive integrated
application model. Keeping them would avoid migration work and retain an
ecosystem that solves problems Hyperkernel will now own.

This solution is rejected because reusable UI packages would remain easiest to
consume from Svelte, the repository would continue to own a larger integrated
toolchain, and framework-specific remote functions would influence the
client-server programming model without defining a stable public Hyperkernel
contract.

### Publish Svelte components as custom elements

Compiling selected Svelte components as custom elements could give non-Svelte
consumers a standards-based tag while preserving Svelte authoring and reactivity
internally. It would also reduce the amount of rendering and state machinery
Hyperkernel needs to implement.

This solution is rejected as the primary model because the source, compiler,
component lifecycle, and generated behavior would still be coupled to Svelte. It
would improve the consumption boundary without achieving the intended runtime
and authoring boundary. It would also leave server rendering and client-upgrade
behavior as contracts that Hyperkernel must define and verify.

### Use Preact as the complete frontend framework

Preact could provide components, hooks, context, ecosystem integrations,
hydration, and a familiar React-compatible application model at relatively low
bundle cost.

This solution is rejected because it would replace one framework-wide state and
component model with another. Hyperkernel accepts Preact only where Web
Components have the clearest gap: describing and rendering a DOM tree.

### Use Web Components with hand-written DOM updates

Using only DOM methods and templates would remove the rendering dependency and
make every mutation explicit.

This remains suitable for very small elements, but it is rejected as the general
rendering contract because conditional trees, keyed lists, and partial updates
would require repetitive reconciliation code. A narrow Preact boundary provides
that mechanism without defining the public component model.

### Keep Node.js and npm while adopting Web Components

This would solve most UI portability concerns and avoid changing the server,
SQLite, tasks, CI, and package-management boundaries at the same time.

This solution has lower migration risk, but it retains the fragmented tooling
and ambient-authority model that motivated the runtime change. It is rejected as
the target architecture. The migration may temporarily pass through this state
to keep changes reviewable.

### Build a general Hyperkernel frontend framework

Hyperkernel could standardize its own component base class, reactive store,
router, composition system, hydration protocol, and development server before
migrating the application.

This solution is rejected because it would reproduce the surface area the
project is trying to leave and would be based on imagined requirements. Local
abstractions will be added only when representative components expose a stable
missing contract.

## Consequences

### Gains

- UI packages have a framework-independent browser contract.
- Hyperkernel's source vocabulary moves closer to HTML, DOM events, CSS, Fetch,
  Web Streams, and other platform standards.
- Deno consolidates the initial runtime, TypeScript, workspace, task,
  formatting, linting, type-checking, and testing boundaries.
- Default-deny runtime permissions make ambient I/O authority explicit.
- Public command and query transports remain visible instead of being generated
  from framework-specific remote-function files.
- Local state transitions and render triggers remain explicit.
- Preact fills a narrow rendering gap without becoming the public component
  model.
- Source-level lock-in and the number of independently configured tools are
  reduced.

### Costs and limitations

- Hyperkernel assumes responsibility for custom-element lifecycle, rendering
  triggers, composition, accessibility, forms, focus, styling, SSR upgrade, and
  browser-compatibility contracts.
- Deno does not replace SvelteKit's router, build integration, application
  lifecycle, hydration behavior, or deployment adapters by itself.
- Declarative Shadow DOM does not provide hydration or event attachment.
- Web Components have weaker integrated TypeScript and composition ergonomics
  than framework components.
- Explicit state transitions can require more code and discipline than a
  reactive framework.
- Preact can cease to be a narrow implementation detail through gradual use of
  hooks, context, or framework conventions unless review protects the boundary.
- npm publication still requires package metadata, artifact construction, and
  consumer verification.
- Replacing the runtime and frontend together creates substantial migration and
  compatibility work.
- Contributors need strong knowledge of browser standards, accessibility, Deno
  permissions, package formats, and server-client boundaries.

### Maintenance cost

The repository removes recurring maintenance for several configuration layers
but takes ownership of more frontend infrastructure. The expected benefit is not
zero maintenance; it is that maintenance occurs at explicit Hyperkernel and Web
Platform boundaries rather than at the integration points between multiple
general-purpose tools.

The project must track Deno compatibility, browser support for the Web
Components features it uses, Preact client and server rendering behavior, npm
artifact compatibility, and its own component conventions. These obligations
must remain visible in tests and release evidence.

### Operational complexity

Deno reduces local setup and supplies scoped runtime permissions, but production
still requires builds where applicable, migrations, static asset delivery,
process supervision, observability, backup, restore, and upgrades. Deno's
built-in server and tools do not remove those operational contracts.

Permissions add an intentional deployment input. A missing grant must fail with
a useful diagnostic, while an overly broad grant must be detectable in review
and deployment configuration.

### Scaling implications

Web Components allow interface packages to be consumed across multiple
frameworks without producing a separate implementation for each one. Deno
workspaces allow packages to share source and verification while retaining
explicit exports.

Neither choice solves organizational scaling automatically. Global custom
element names and registrations require namespace and version discipline. Shared
workspace configuration can also become hidden coupling if package boundaries
are not verified from produced artifacts.

Runtime throughput is not a reason for this decision. Server and rendering
performance must be measured against representative Hyperkernel flows after the
contracts are correct.

## Evidence required

This record may advance to Development when:

- its complete replacement of record 0003, including the retained decisions and
  eventual Legacy transition, is approved;
- the Deno runtime, workspace, permission, and npm-distribution boundaries are
  accepted;
- the narrow Preact boundary and explicit state model are accepted;
- the unresolved composition and SSR-upgrade questions are accepted as bounded
  implementation work rather than assumed capabilities;
- the migration sequence and removal conditions are approved.

It may advance to Evaluation when the repository contains:

- one Deno workspace command that formats, lints, type-checks, and runs all
  required tests;
- kernel and SQLite tests running under Deno with unchanged transactional,
  authorization, rollback, replay, and compatibility behavior;
- scoped and documented runtime permissions for development, test, build, and
  production tasks;
- representative custom elements covering composition, local state, DOM events,
  teardown, forms, focus, accessibility, and error behavior;
- client rendering through the narrow Preact boundary without hooks, signals,
  context, or a Preact application root;
- server-rendered light DOM and Declarative Shadow DOM that remain useful before
  upgrade and preserve semantic content, form state, and focus during client
  initialization;
- clean external-consumer tests using plain TypeScript and at least one
  non-Preact framework;
- npm package artifacts tested from their produced tarballs rather than
  workspace source;
- a migrated Hyperkernel flow with no SvelteKit-specific kernel contract;
- documentation that clearly distinguishes remaining migration code from the
  supported target architecture.

It may advance to Stable after representative Hyperkernel applications work
without Svelte or SvelteKit, the obsolete Node.js and npm development path has
been removed, supported npm consumers pass compatibility tests, and Deno,
Preact, browser, package, backup, restore, and upgrade tests demonstrate that
the new stack preserves the required contracts.

## References

- [Hyperkernel public architecture](../../README.md)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [0003: Web-platform-first frontend](0003-web-platform-first-frontend.md)
- [Deno: Get started](https://docs.deno.com/runtime/)
- [Deno: Workspaces and monorepos](https://docs.deno.com/runtime/fundamentals/workspaces/)
- [Deno: Security and permissions](https://docs.deno.com/runtime/fundamentals/security/)
- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [MDN: Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
- [MDN: The template element and Declarative Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template)
- [Preact: Server-side rendering](https://preactjs.com/guide/v10/server-side-rendering/)
- [SvelteKit: Remote functions](https://svelte.dev/docs/kit/remote-functions)

## Status history

| Date       | Status | Reason                                                |
| ---------- | ------ | ----------------------------------------------------- |
| 2026-08-02 | Draft  | Runtime and frontend replacement proposed for review. |
