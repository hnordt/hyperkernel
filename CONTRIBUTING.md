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
- Write the commit message as a single sentence summarizing the change.

Generated files, local databases, credentials, and unrelated formatting changes
must not be included.
