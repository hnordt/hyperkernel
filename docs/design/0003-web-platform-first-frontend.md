# 0003: Web-platform-first frontend

| Field        | Value       |
| ------------ | ----------- |
| Status       | Development |
| Scope        | Frontend    |
| Created      | 2026-07-27  |
| Last updated | 2026-07-27  |

## Summary

Hyperkernel will use HTML, CSS, ECMAScript, and browser APIs directly whenever
they satisfy the required contract. It will not use Tailwind CSS or a headless
UI library. The project will own the source, behavior, and styling of its core
interface primitives.

Svelte and SvelteKit remain deliberate exceptions. They provide capabilities
that the web platform does not yet combine into an adequate application
component and delivery model. Their use should enhance platform primitives
rather than replace them with project-specific equivalents.

## Problem

Hyperkernel is a long-lived application platform with a highly interactive
interface. Its windows, applications, controls, and themes form part of the
platform itself rather than a disposable presentation layer.

The frontend therefore needs behavior that remains understandable,
controllable, and maintainable through browser, framework, and dependency
upgrades. A convenience dependency can accelerate initial development while
also coupling markup, styling, focus management, keyboard behavior, layering,
or component state to contracts owned by another project.

In this record, lock-in means source-level coupling and replacement cost, not
only dependence on proprietary software. An open-source dependency can still
own the vocabulary or behavior expressed throughout Hyperkernel's source and
make replacement require a broad rewrite.

Hyperkernel needs a clear boundary between capabilities it should inherit from
the web platform, capabilities it should own, and gaps for which a framework is
still justified.

## Invariants

1. Standards-based HTML, CSS, ECMAScript, and browser APIs are the default
   implementation surface.
2. A dependency must provide a material capability, not only an alternative
   vocabulary for a capability the platform already provides adequately.
3. Hyperkernel owns the source and observable behavior of its core interface
   primitives.
4. Browser behavior is preserved unless a documented application requirement
   justifies changing it.
5. Tailwind CSS and headless UI libraries are not part of the frontend stack.
   Reversing either decision requires a new design record.
6. Platform-first implementation does not weaken accessibility requirements.
   Custom interactions must retain correct semantics, keyboard operation, focus
   behavior, and assistive-technology support.
7. Framework-specific contracts do not define durable domain data, event
   schemas, or public application boundaries.
8. Reducing dependencies lowers exposure to dependency compromise and
   unreviewed changes, but is not treated as a complete supply-chain security
   strategy.

## Decision

### Use the web platform directly

Components use semantic HTML and native controls where their behavior satisfies
the product contract. Styling uses native CSS in scoped Svelte `<style>` blocks,
semantic class names, and CSS custom properties for values that cross component
boundaries.

Modern browser APIs and CSS features are preferred over framework utilities or
project-specific substitutes. Native behavior is overridden only when the
interface requires a different explicit contract.

This keeps the primary implementation language aligned with standards developed
and implemented independently of Hyperkernel's current framework choices. It
also keeps behavior inspectable in the repository and browser developer tools.

### Do not use Tailwind CSS

Tailwind produces standard CSS, but application source becomes coupled to
Tailwind's utility vocabulary, compiler, configuration, and upgrade path.
Replacing it requires translating framework-specific markup throughout the
interface.

Native CSS already provides the selectors, scoping, custom properties, layout,
color, responsive behavior, and composition mechanisms Hyperkernel needs.
Using it directly removes an unnecessary abstraction and build dependency while
allowing the project to adopt new platform capabilities without waiting for a
framework-specific representation.

### Do not use a headless UI library

Headless UI libraries often provide valuable accessibility work and consistent
cross-browser behavior. To do so, they may intentionally replace or normalize
native focus, keyboard, selection, form, portal, or layering behavior.

Those changes can be beneficial for general-purpose component libraries, but
they would make core Hyperkernel behavior depend on state machines and release
decisions outside the project. An upgrade could change interaction behavior
without an obvious corresponding change in Hyperkernel's source.

Hyperkernel will instead build its interface primitives from semantic elements
and modern browser APIs. The resulting implementation must make every
intentional deviation from native behavior explicit and testable.

### Use Svelte

Custom Elements and Declarative Shadow DOM provide useful registration and
encapsulation primitives. They do not provide a complete application model that
combines declarative rendering, reactive state, component composition, server
rendering, and hydration. The platform also does not yet provide a broadly
available built-in reactive state primitive comparable to Svelte runes.

Svelte fills these gaps with a small component model, declarative templates, and
reactive state while continuing to use HTML, CSS, DOM events, and browser APIs
directly. Its compiler-oriented model is closer to the platform than the
alternatives considered for this project.

Svelte still creates framework coupling. Hyperkernel accepts that cost because
the capability is currently necessary and the coupling is concentrated in the
interface layer.

### Use SvelteKit

Hyperkernel needs a maintained development server, bundling pipeline, routing,
server-rendering and hydration integration, production build, and deployment
adapter. Building and maintaining a custom toolchain would not differentiate
the product.

SvelteKit provides this application shell and integrates the required build
tooling with Svelte. The project accepts this dependency while keeping domain
and persistence contracts independent of SvelteKit.

### Review future exceptions explicitly

A future proposal for a frontend abstraction must identify:

- the missing platform capability;
- the observable behavior the dependency would own;
- its accessibility and browser-compatibility contract;
- its transitive dependency and build-time impact;
- the migration path if the dependency is abandoned;
- why a local implementation would create greater maintenance or operational
  risk.

Convenience or implementation speed alone is not sufficient for changing this
decision.

## Security boundary

Every package that executes during development, build, or runtime expands the
code Hyperkernel must trust. Removing styling and component-library dependency
trees reduces opportunities for compromised packages, malicious install or
build behavior, and vulnerable transitive code.

The web platform is not trusted merely because it is native, and local code is
not secure merely because Hyperkernel owns it. Browser behavior, Svelte,
SvelteKit, build tools, and remaining dependencies stay inside the threat model.
The project must still pin and review dependencies, protect the release process,
and test the resulting application.

Dependency reduction is therefore a reduction in trusted surface, not proof of
security.

## Considered solutions

### Tailwind CSS

Tailwind offers rapid composition, a constrained vocabulary, and a large
ecosystem. It can make styling conventions easy to apply across teams.

This solution is rejected because Hyperkernel already needs direct CSS for its
theme and interface contracts. Adding a second styling vocabulary would couple
markup to a build-time abstraction without providing a missing platform
capability.

### A headless UI library

A headless library could accelerate accessible menus, dialogs, listboxes,
comboboxes, and other complex controls.

This solution is rejected for the core interface because it would delegate
behavior central to the platform. It would also expose Hyperkernel to upstream
behavioral changes and require the project to understand both the browser
contract and the library's replacement contract.

### React

The project author has used React since 2016 and has evaluated its modern model
through React 19. React provides a mature ecosystem and broad familiarity.

For Hyperkernel, React's rendering lifecycle, state conventions, and expanding
client and server abstractions form a second programming platform on top of the
web platform. They add framework-specific complexity and migration cost without
providing a compensating benefit for the project's requirements.

This solution is rejected in favor of Svelte's smaller and more
platform-aligned component model.

### Vue

Vue offers a declarative component model with many of the same broad
capabilities required by Hyperkernel.

Vue was not evaluated deeply enough to reject it on technical grounds. The
project author has little production experience with it, while Svelte was
immediately understandable, met the requirements, and proved compelling in
practice. There is no current benefit in expanding the evaluation after a
suitable choice has been made.

### htmx

The project author has practical experience with htmx and considers its
server-driven hypermedia model a strong fit for many applications.

Hyperkernel's desktop-like interface has substantial client-side state and many
concurrent interactions. Its applications will naturally use JSON or RPC-style
data boundaries more often than server-rendered HTML fragments. Using htmx as
the primary frontend model would pull the interface architecture away from
those requirements.

This solution is rejected as the foundation of the Hyperkernel frontend.

### Custom Elements without Svelte

A framework-free component layer would minimize framework coupling and use only
browser standards.

This solution is rejected for now because Hyperkernel would need to design and
maintain its own rendering, reactive state, composition, server-rendering, and
hydration conventions. That work would recreate a framework rather than
differentiate the product.

### A custom application toolchain

Owning the bundler, router, development server, server-rendering integration,
and production build would provide maximum control.

This solution is rejected because the maintenance and operational cost would be
high while providing little product value. SvelteKit is the accepted
infrastructure dependency for this boundary.

## Consequences

### Gains

- Core interface behavior remains visible and reviewable in Hyperkernel's
  source.
- The project depends on stable platform contracts for more of its frontend.
- Source-level lock-in to styling and component libraries is reduced.
- Fewer direct and transitive dependencies reduce the supply-chain attack
  surface and the number of upstream release changes to evaluate.
- Native CSS and browser capabilities can be adopted directly.
- Framework dependencies are concentrated at boundaries where the platform
  still lacks an adequate integrated solution.

### Costs and limitations

- Hyperkernel must implement and maintain its own interface primitives.
- Complex controls require substantial accessibility, keyboard, focus, and
  cross-browser testing.
- The project cannot rely on a headless component ecosystem for rapid feature
  delivery.
- Contributors need strong knowledge of HTML, CSS, accessibility, and browser
  behavior.
- Svelte and SvelteKit still create framework and toolchain lock-in and remain
  part of the dependency threat model.
- Some native capabilities may require progressive enhancement or a temporary
  local fallback while browser support converges.

## Evaluation

This record may advance to Evaluation when:

- representative interface primitives are implemented without Tailwind CSS or
  a headless UI library;
- native and intentionally customized behaviors are covered by interaction
  tests;
- keyboard, focus, semantic, and assistive-technology expectations are
  documented for complex controls;
- supported browsers pass the relevant interface and end-to-end tests;
- Svelte-specific state remains outside durable and public contracts.

It may advance to Stable after the approach supports representative Hyperkernel
applications and survives browser, Svelte, and SvelteKit upgrades without
requiring a rewrite of core interface contracts.

## References

- [Hyperkernel public architecture](../../README.md)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [MDN: Web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [Svelte: What are runes?](https://svelte.dev/docs/svelte/what-are-runes)
- [SvelteKit: Introduction](https://svelte.dev/docs/kit/introduction)

## Status history

| Date       | Status      | Reason                                           |
| ---------- | ----------- | ------------------------------------------------ |
| 2026-07-27 | Development | Design chosen; frontend implementation underway. |
