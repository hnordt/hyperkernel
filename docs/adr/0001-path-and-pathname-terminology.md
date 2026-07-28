# Path and pathname terminology

| Field         | Value                                                |
| ------------- | ---------------------------------------------------- |
| Status        | Accepted                                             |
| Scope         | Public APIs, configuration, and implementation names |
| Decision date | 2026-07-27                                           |

## Summary

Hyperkernel uses `path` for a general location accepted by an API, and
`pathname` only for the path component of a URL. The two names are not
interchangeable.

## Problem

Location-like inputs can be filesystem paths, opaque identifiers accepted by an
API, complete URLs, or one component of a URL. Calling each of them `path` or
`pathname` without a rule makes public APIs harder to understand and obscures
what inputs they accept.

## Decision

Use `path` when an API accepts a general location. It may be a filesystem path,
an opaque location syntax documented by that API, or a complete `URL` when the
underlying API accepts one.

```ts
const configurationPath = "./config/hyperkernel.json";
const memoryPath = ":memory:";
declare const resourcePath: URL;
```

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

This ADR governs names in programmatic APIs, configuration fields, types, and
developer documentation. It does not prohibit ordinary prose such as "command
execution path" where no location value is being named.

## Examples

| Value or concept                                                       | Name       | Reason                                                         |
| ---------------------------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| `./config/hyperkernel.json` supplied to a configuration reader         | `path`     | It is a filesystem location.                                   |
| `:memory:` supplied to a storage API                                   | `path`     | It is an API-specific location, not a URL pathname.            |
| `new URL("file:///var/lib/hyperkernel.db")` supplied to a resource API | `path`     | The receiving API accepts a general location, including a URL. |
| `/projects/hyperkernel` from `new URL(...).pathname`                   | `pathname` | It is precisely the URL pathname component.                    |
| `https://example.test/projects/hyperkernel?view=events`                | `url`      | The complete URL includes origin and query string.             |
| A route matcher input derived from `request.url`                       | `pathname` | Routing commonly operates on only the URL pathname.            |

## Alternatives considered

### Use `path` for every location-like value

Rejected. It would obscure whether a value is a complete URL or only its path
component.

### Use `pathname` for all path values

Rejected. `pathname` has a precise URL-specific meaning and does not describe
filesystem paths or API-specific location syntax.

## Consequences

API names communicate valid input shapes without relying on implementation
knowledge. A `pathname` must never be documented as a complete URL, and a
`path` must not be assumed to be a URL pathname.

## Status history

| Date       | Status   | Note                                                   |
| ---------- | -------- | ------------------------------------------------------ |
| 2026-07-27 | Accepted | Global terminology chosen for current and future APIs. |
