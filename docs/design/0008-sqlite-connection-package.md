# 0008: SQLite connection package

| Field  | Value       |
| ------ | ----------- |
| Status | Development |
| Scope  | Kernel      |
| Date   | 2026-07-27  |

## Summary

`@hyperkernel/sqlite` provides the Node.js SQLite connection used by
Hyperkernel applications. Its first public API is `openDatabase`, which opens
a database and returns the underlying `DatabaseSync` instance.

## Problem and invariants

The SvelteKit prototype currently owns a single server-only SQLite connection
and its baseline pragmas. That infrastructure must become reusable without
making the kernel depend on SvelteKit or allowing SQLite to be presented as a
database-agnostic contract.

- The package is Node-only and uses the built-in `node:sqlite` module.
- `openDatabase` opens an existing database or lets SQLite create a missing
  file-backed database.
- The caller owns and closes the returned `DatabaseSync` instance.
- The adapter preserves the prototype's timeout, WAL, synchronous, and foreign
  key settings.
- Opening `:memory:` warns that data is lost when the process stops.
- This low-level connection API is not a command, event, or authorization API.

## Decision

Expose `openDatabase(path = ":memory:", options = {})` from
`@hyperkernel/sqlite`. `path` accepts a filesystem path, `:memory:`, or a URL
accepted by `DatabaseSync`. The optional `options` argument currently accepts
`timeout`. The function returns `DatabaseSync` directly.

The name is deliberately short because the SQLite-specific package name
supplies the missing context:

```ts
import { openDatabase } from "@hyperkernel/sqlite";
```

`@hyperkernel/db` is reserved for a future database-agnostic contract only if
multiple adapters establish a real shared abstraction.

## Alternatives considered

### `createDatabase`

Rejected. The operation also opens existing databases, so `create` would imply
an inaccurate lifecycle guarantee.

### `openSqliteDatabase`

Rejected. It is correct but redundant at the package boundary.

### Return a Hyperkernel-specific storage interface

Deferred. The production kernel persistence contract does not yet exist. A
premature abstraction would hide SQLite behavior before another adapter has
shown which operations genuinely need to be shared.

## Consequences and limitations

Consumers receive a raw SQLite connection and can execute arbitrary SQL. This
is appropriate for an infrastructure package but does not grant a supported
path around the future kernel command boundary. The package is private and not
yet prepared for npm publication.

## Evidence required for Evaluation

- The SvelteKit server connection uses the package rather than creating its own
  `DatabaseSync` instance.
- A test proves that `openDatabase` returns `DatabaseSync` and enables foreign
  keys.
- The application type-checks with the workspace dependency.

## Status history

| Date       | Status      | Note                                                  |
| ---------- | ----------- | ----------------------------------------------------- |
| 2026-07-27 | Development | Chosen for the first reusable infrastructure adapter. |
