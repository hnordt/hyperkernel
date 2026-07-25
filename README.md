# Hyperkernel

**A self-hostable, extensible business platform for building and running modular applications in modern web browsers.**

Hyperkernel is an open-source application runtime for building business software around a shared operational core. It combines interoperable applications, capability-based permissions, supervised agents, and an auditable history of human and automated work.

The goal is not to recreate a desktop in the browser. It is to create an extensible kernel: a shared model that enables business applications to operate on the same objects and relationships, enforce consistent permissions, and record actions and state changes in a shared, immutable, and auditable event history.

Hyperkernel aims to bring to business software the same level of fluidity, craft, and direct manipulation that tools such as Figma provide to designers.

## Status

Hyperkernel is in the early design stage. The immediate objective is to validate the architecture through the v0.1 reference applications rather than to build a general-purpose business operating system all at once.

### Current implementation

The repository currently contains:

- a SvelteKit application shell with a Node.js production adapter;
- the server-only Drizzle and SQLite database boundary;
- formatting, type-checking, unit-test, browser-test, and build tooling;
- architecture terminology and an isolated event-sourcing spike.

The SDK, reference applications, permissions, persistent event history, supervised agent execution, and production database schema described below are not implemented yet.

## Getting started

Hyperkernel requires Node.js 24 or later and npm 11 or later.

```sh
npm ci
cp .env.example .env
npm run dev
```

The development server prints its local URL after startup. The default SQLite database path is `./local.db`.

## Verification

```sh
npx playwright install chromium
npm run check
npm run lint
npm run test
npm run build
```

## Self-hosting the prototype

Build and start the Node.js server:

```sh
npm run build
npm start
```

Set `DATABASE_URL` to a writable SQLite path for persistent storage. If `DATABASE_URL` is not set, Hyperkernel uses an in-memory SQLite database and all data is lost when the process stops. When running behind a reverse proxy, set `ORIGIN` to the public application URL or configure trusted forwarded-host and forwarded-protocol headers according to the SvelteKit Node adapter documentation.

The current prototype does not have a production database schema or migration set. Self-hosted instances are therefore suitable for development and architectural evaluation, not durable production data. Backup, restore, and upgrade guarantees will be documented when the first persistent application flow is introduced.

## Core model

Hyperkernel is built on a small set of primitives:

- apps define and package application behavior;
- objects represent typed, globally addressable state;
- relationships connect objects through typed references;
- actions define operations that actors can perform;
- events provide an immutable record of actions and state changes.

Applications are built by declaring new object types, relationships, actions, and interfaces through the Hyperkernel SDK.

## Supervised agents

Agents are first-class actors, but they cannot access the database or storage layer directly. They must:

1. receive explicit context and capabilities;
2. invoke actions exposed by applications;
3. produce artifacts and supporting evidence;
4. request human approval when required;
5. have their model, instructions, tools, inputs, actions, and results recorded;
6. allow their work to be inspected and, where supported, reversed.

The kernel records human and agent actions through the same event and audit infrastructure, while applying different policies and approval requirements.

## Multitasking shell

The shell exposes the kernel through a persistent, business-oriented workspace. It should allow users to:

- open multiple objects—such as a client, a document, and an agent run—side by side;
- drag an object from one application into another to create a link;
- keep multiple activities open and persistent;
- restore the complete context of a task;
- monitor an agent working in the background;
- inspect an object without leaving the current workflow.

## v0.1 scope

The first version is intended to prove the complete platform model with the smallest coherent implementation:

- a persistent multitasking shell;
- two small interoperable applications;
- shared, globally addressable objects;
- cross-application references;
- capability-based permissions;
- an immutable audit log;
- one supervised agent integration;
- a minimal SDK for declaring objects, actions, and capabilities.

Every kernel component in v0.1 must be required by at least one working application flow.

## Out of scope for v0.1

- an application marketplace;
- multiple agent providers;
- a complete filesystem;
- a generic visual automation builder;
- a large library of management components;
- advanced real-time collaboration.

The first version will support a single agent provider. Additional providers should only be introduced after the execution, authorization, supervision, and audit contracts have been proven.

## Design principles

### Shared identity, modular domains

The kernel owns identity, authorization, global references, and history. Applications own their domain models and business rules.

### Capabilities over direct access

Capabilities are scoped grants that authorize an actor to invoke specific actions on specific objects.

Humans, applications, and agents act through explicit capabilities. No actor should bypass application contracts to modify data directly.

### References over duplication

Applications should link to shared objects rather than maintain disconnected copies of the same organization, person, document, or task.

### Evidence by default

Important actions should preserve who or what performed them, which inputs were used, what changed, and which artifacts were produced.

### Extraction over speculation

The kernel should only gain abstractions required by real applications. Features are generalized after repeated use, not in anticipation of every possible management system.

### A thin shell over a strong kernel

Visual polish and multitasking matter, but the platform's durable value comes from interoperability, permissions, supervision, and auditability.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing or implementing a change. Security vulnerabilities must be reported privately according to [SECURITY.md](SECURITY.md). Participation in project spaces is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Hyperkernel is available under the [MIT License](LICENSE).
