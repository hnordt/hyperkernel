# Local package workspaces

| Field  | Value                                                |
| ------ | ---------------------------------------------------- |
| Status | Development                                          |
| Scope  | Repository architecture and local package boundaries |
| Date   | 2026-07-27                                           |

## Summary

Hyperkernel will use npm workspaces to develop the SvelteKit application and
future reusable packages in one repository. Workspace packages are consumed by
their package names locally before any publication to npm.

## Problem and invariants

The current repository is one SvelteKit application. It needs an incremental
path toward a reusable kernel and UI packages without duplicating development
tooling or making the kernel depend on SvelteKit.

- The SvelteKit application remains the executable prototype during this step.
- Formatting, linting, type-checking, and test tooling stay at the repository
  root.
- The kernel public API must not depend on SvelteKit routes, UI state, or
  server-only SQLite implementation details.
- No package is published or supported for external installation yet.

## Decision

The repository root is a private npm workspace coordinator named
`hyperkernel-workspace`. It declares `packages/*` as workspaces.

The initial workspaces are:

- `packages/kernel`, named `@hyperkernel/kernel`, whose empty public entry point
  establishes the future import boundary without moving any existing kernel
  implementation; and
- `packages/sqlite`, named `@hyperkernel/sqlite`, which extracts the existing
  Node.js SQLite connection and baseline pragmas from the SvelteKit application.

Both packages remain private until an explicit publication decision and
packaging verification are complete.

The existing root SvelteKit application stays in place for now. Moving it under
`apps/` and introducing a UI package are later migrations, not prerequisites
for validating the first workspace boundary.

## Alternatives considered

### Publish `src/lib` from the application

Rejected. `src/lib` is the application's internal library. Publishing it would
make application aliases and accidental SvelteKit dependencies part of a public
package boundary.

### Move the SvelteKit application and all packages at once

Rejected. This would combine package resolution, build configuration, test
paths, and code extraction into one hard-to-debug migration.

### Use separate repositories immediately

Rejected. Local npm workspaces provide the desired package-name imports while
keeping the prototype changes atomic and easy to inspect.

## Consequences and limitations

`@hyperkernel/kernel` is locally addressable but intentionally exports no
production API in this step. `@hyperkernel/sqlite` is Node-only and exposes the
low-level connection API described in
[`0006-sqlite-connection-package.md`](0006-sqlite-connection-package.md). A
later step must select and verify distribution builds before either package can
be published.

## Evidence required for Evaluation

- npm installs the workspace successfully from the repository root.
- The root application continues to pass its existing checks.
- The root application resolves both packages through their package names.
- The SQLite connection behavior remains covered after extraction.

## Status history

| Date       | Status      | Note                                              |
| ---------- | ----------- | ------------------------------------------------- |
| 2026-07-27 | Development | Chosen for the initial local workspace migration. |
