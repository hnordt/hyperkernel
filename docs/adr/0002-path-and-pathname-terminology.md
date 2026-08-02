# ADR 0002: Path and pathname terminology

| Field        | Value                         |
| ------------ | ----------------------------- |
| Status       | Development                   |
| Scope        | Kernel, Extension, Experience |
| Created      | 2026-07-27                    |
| Last updated | 2026-08-02                    |

## Summary

Hyperkernel uses `path` for a location accepted by an API and `pathname` only
for the pathname component of a URL. It uses `url` when a value is specifically
a complete URL. The three names are not interchangeable.

## Problem

Location-like inputs can be filesystem paths, opaque location syntaxes accepted
by an API, complete URLs, or one component of a URL. Calling each of them `path`
or `pathname` without a rule makes public APIs harder to understand and obscures
the values they accept.

The distinction is especially important at boundaries. A complete URL can
carry a scheme, authority, query, and fragment, while a URL pathname carries
none of those independently. A filesystem path follows a different syntax and
resolution model. Names that collapse these contracts force callers to depend
on implementation knowledge.

## Invariants

1. A name distinguishes the location contract family; its type and
   documentation specify the complete set of accepted shapes.
2. `pathname` always means the pathname component of a URL.
3. A value named `pathname` represents neither a complete URL nor a filesystem
   path.
4. A value named `url` represents a complete URL, not only one URL component.
5. A `path` may use an API-specific syntax or type only when that API documents
   it as part of the path contract.

## Decision

Use `path` when an API accepts a location under a path contract. The accepted
value may be a filesystem path, an opaque path syntax documented by that API,
or a `URL` when the underlying path API accepts one.

```ts
const configurationPath = "./config/hyperkernel.json";
const databasePath = ":memory:";
declare const resourcePath: string | URL;
```

The last example is appropriate only when the resource API defines one path
input that accepts either representation. A value known to be a complete URL,
rather than a member of a broader path contract, uses `url`.

Use `pathname` only when referring to the pathname component of a URL. It is a
string such as `/workspaces/acme`, not the complete URL.

```ts
const url = new URL("https://example.test/workspaces/acme?tab=events");

url.pathname; // "/workspaces/acme"
url.href; // "https://example.test/workspaces/acme?tab=events"
```

Use `url` when an API specifically requires a complete URL and does not accept
another kind of location.

```ts
function redirect(url: URL): Response {
  return Response.redirect(url);
}
```

Prefer a domain-qualified name when the value crosses a public or persistence
boundary, such as `databasePath`, `redirectUrl`, or `requestPathname`. A short
local name remains sufficient when its meaning is evident at the point of use.

This ADR governs names in programmatic APIs, configuration fields, types, and
developer documentation. It does not prohibit ordinary prose such as "command
execution path" where no location value is being named.

Existing public names are not renamed incompatibly merely to apply this rule.
Each incompatible correction requires an explicit migration or compatibility
decision. New and changed contracts follow the rule immediately.

## Examples

| Value or concept                                                   | Name       | Reason                                                  |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------- |
| `./config/hyperkernel.json` supplied to a configuration reader     | `path`     | It is a filesystem location.                            |
| `:memory:` supplied to a storage API                               | `path`     | It is an API-specific path, not a URL pathname.         |
| `new URL("file:///var/lib/hyperkernel.db")` supplied to a path API | `path`     | The receiving path contract explicitly accepts a `URL`. |
| `/projects/hyperkernel` from `new URL(...).pathname`               | `pathname` | It is precisely the URL pathname component.             |
| `https://example.test/projects/hyperkernel?view=events`            | `url`      | The complete URL includes origin and query string.      |
| A route matcher input derived from `new URL(request.url).pathname` | `pathname` | Routing operates on only the URL pathname.              |

## Considered solutions

### Use `path` for every location-like value

This solution would provide one familiar generic term.

It is rejected because it would obscure whether a value is a complete URL or
only its pathname component and would discard useful boundary information.

### Use `pathname` for all path values

This solution would provide a consistent compound name.

It is rejected because `pathname` has a precise URL-specific meaning and does
not describe filesystem paths or API-specific path syntax.

### Use `url` whenever a `URL` object is accepted

This solution would make the runtime representation visible in every name.

It is rejected for mixed path contracts because a `URL` may be only one
accepted representation of the same location input. The name follows the
receiving contract, not one member of its input union. An API that exclusively
accepts a complete URL still uses `url`.

## Consequences

### Gains

- API names communicate accepted input shapes without requiring implementation
  knowledge.
- URL components remain distinguishable from complete URLs and filesystem
  locations.
- Domain-qualified names remain searchable across configuration, code, and
  documentation.
- Wrappers can preserve a platform API's path contract when it accepts multiple
  representations.

### Costs and limitations

- Authors must inspect the receiving contract before choosing a name; the
  runtime type alone is not always sufficient.
- Existing ambiguous public names may require compatibility-preserving
  migrations.
- `path` remains intentionally broader than filesystem-only usage, so each API
  must still document its accepted types and syntax.
- This terminology improves contract clarity but does not validate, normalize,
  authorize, or secure a supplied location.

## Evaluation

This record may advance to Evaluation after the repository:

- applies the rule to new and changed programmatic and configuration contracts;
- resolves the existing `DATABASE_URL` naming mismatch through an explicit
  compatibility decision;
- removes non-URL uses of `pathname` from current design documentation; and
- completes a repository-wide terminology audit without finding unexplained
  exceptions.

It may advance to Stable after representative Kernel, Extension, and Experience
APIs use the rule consistently and review shows that mixed `string | URL` path
contracts remain understandable without recurring exceptions.

## References

- [Node.js `DatabaseSync` path contract](https://nodejs.org/api/sqlite.html#new-databasesyncpath-options)
- [WHATWG URL Standard](https://url.spec.whatwg.org/#dom-url-pathname)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [ADR conventions](README.md)

## Status history

| Date       | Status      | Reason                                                          |
| ---------- | ----------- | --------------------------------------------------------------- |
| 2026-07-27 | Development | Terminology chosen; repository alignment and evaluation remain. |
