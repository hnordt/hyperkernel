# Security policy

## Supported versions

Hyperkernel has no stable release yet. Security fixes currently target the
latest commit on `main`; older commits are not supported.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

Use
[GitHub private vulnerability reporting](https://github.com/hnordt/hyperkernel/security/advisories/new)
and include:

- the affected commit or version;
- the conditions required to reproduce the issue;
- the expected security impact;
- a minimal reproduction or proof of concept, when safe;
- any known workaround.

Remove credentials, personal data, and unrelated confidential information from
the report. The maintainer will coordinate validation, remediation, and
disclosure through the private report.

Dependency-only reports should identify the vulnerable package, dependency
path, advisory, and whether the vulnerable behavior is reachable in
Hyperkernel.
