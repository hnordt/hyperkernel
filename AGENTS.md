# AGENTS.md

This file is the canonical project guidance for coding agents working in this repository.

## Agent Configuration

- `AGENTS.md` is the canonical instruction file.
- `.codex/config.toml` configure the Svelte MCP server.

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, playwright, sveltekit-adapter, mcp

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview the production build
npm run check        # Type-check with svelte-check
npm run lint         # Prettier + ESLint (check only)
npm run format       # Format code with Prettier
npm run test         # Run unit and e2e tests
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright e2e tests

```

Unit tests split into two Vitest projects:

- **client** (`*.svelte.test.ts`) — runs in browser via Playwright
- **server** (`*.test.ts`, excluding `.svelte.test.ts`) — runs in Node

To run a single test file: `npx vitest run src/path/to/file.test.ts`

## Browser Verification

For browser-based QA, screenshots, console checks, and visual debugging, default to the repository's local Playwright installation from the terminal. Start the local dev server and drive the app with local Playwright unless the user explicitly asks for the in-app browser or the MCP browser is already known to be available and useful for the task.

## Architecture

SvelteKit app with Node adapter, Svelte 5 runes mode, SQLite via the built-in `node:sqlite` module, and native CSS.

- **`src/routes/`** — SvelteKit file-based routes. Document-level styles belong in `layout.css`; page-specific styles belong in their Svelte components.
- **`src/lib/server/db/`** — Database layer. `index.ts` exports the shared `DatabaseSync` connection. Event persistence and projections belong behind this server-only boundary.
- **`src/lib/assets/`** — Static assets referenced in components.

Database URL is read from `DATABASE_URL` env var (`.env` points to `./local.db` for local dev). Server-only — never import `src/lib/server/` from client code.

Database integration must use the built-in `node:sqlite` module. Keep connection creation centralized in `src/lib/server/db/index.ts`, append durable facts to the event log, and build read models through projections owned by the application database layer. Do not introduce an ORM, another SQLite client, or unrelated ad hoc database access unless the architecture is intentionally changed and documented.

Styling uses native CSS in scoped Svelte `<style>` blocks. Keep global CSS limited to document-level rules in `layout.css`. Font is Inter (via `@fontsource-variable/inter`), imported in `+layout.svelte` and set as the document default in `layout.css`.

Svelte 5+ and SvelteKit 2+ are required. Use Svelte 5 runes for all non-library app code, SvelteKit remote functions for server/client RPC-style flows, and avoid legacy Svelte 4 patterns unless maintaining third-party/library code.

## Engineering Style

Prefer small, direct, production-oriented changes. The best patch is the smallest correct patch that preserves existing behavior and improves the requested area without incidental refactoring.

### Naming and Semantics

- Names must describe domain meaning, not implementation mechanics.
- Prefer names that encode intent, responsibility, and boundary. Avoid generic names such as `data`, `item`, `handler`, `manager`, `helper`, or `utils` unless the scope makes the meaning unambiguous.
- Use verbs that match the semantic contract. For example, prefer `record` for durable facts, `create` for new entities, `update` for mutation of existing state, `load` for retrieval, `parse` for validation plus conversion, and `format` only for presentation.
- Keep vocabulary consistent across files. Do not introduce synonyms for existing concepts unless the distinction is intentional and documented.
- Avoid implementation-driven names such as `sqlData`, `jsonThing`, or `arrayResult` when a domain name is available.

### Abstraction and Function Extraction

- Do not extract code into a helper function merely to make code shorter.
- Do not extract functions that are used only once unless the extraction introduces a stable domain concept, isolates a real boundary, or materially reduces cognitive complexity.
- Prefer locality when the logic is simple and only relevant to one caller.
- Prefer small duplication over premature abstraction.
- Introduce an abstraction only after at least two concrete use cases exist or when the abstraction represents a clear domain invariant.
- Avoid wrapper functions around native platform APIs unless the wrapper adds a project-specific contract, validation boundary, or cross-cutting behavior.

### Platform APIs

- Prefer standard ECMAScript, Web Platform, SvelteKit, Svelte, Drizzle, and CSS APIs before creating project-specific utilities.
- Before adding a custom utility, check whether the platform already provides the needed behavior.
- Prefer `Intl.NumberFormat`, `Intl.DateTimeFormat`, `URL`, `URLSearchParams`, `FormData`, `structuredClone`, `crypto.randomUUID`, `Object.groupBy`, `Array.prototype.toSorted`, `Array.prototype.toSpliced`, and other standard APIs when they fit the contract.
- Do not create helpers such as `formatNumber`, `formatCurrency`, `buildUrl`, `cloneObject`, or `generateId` if a standard API expresses the same contract clearly.
- If a custom utility is still necessary, document the project-specific behavior that the standard API does not provide.

### Patch Discipline

- Keep patches minimal and relevant to the user's request.
- Do not rename symbols, move files, reorganize imports, change formatting, or restructure components unless required for the task.
- Preserve existing public contracts unless the user explicitly asks to change them.
- Avoid mixing feature work, cleanup, and refactoring in the same change.
- When refactoring is necessary, explain the invariant being preserved and the complexity being removed.

## Styling

Use native CSS in scoped Svelte `<style>` blocks for component and page styling. Keep selectors local, prefer semantic class names for distinct component parts, and use CSS custom properties for values that cross component boundaries.

Keep global CSS limited to document-level concerns such as fonts, box sizing, and browser resets. Add those rules to `src/routes/layout.css`; do not add component-specific styles to the global stylesheet.

## Schema Validation

Use Zod for runtime schema validation of untrusted structured data, including request bodies, form data, URL/search params, remote function inputs, environment-derived configuration, and data crossing server/client boundaries.

- Define Zod schemas at the boundary where data enters the system.
- Infer TypeScript types from Zod schemas instead of duplicating separate manual interfaces for the same shape.
- Do not replace runtime validation with TypeScript casts, ad hoc property checks, or handwritten validators unless there is a documented reason.
- Use Zod for input/output validation around database operations.

## Interactive UI Primitives

Purposefully avoid headless UI libraries. Build interactive primitives with modern HTML and Web Platform features such as `<dialog>`, the Popover API, `<details>` and `<summary>`, native form controls, `<datalist>`, and the Clipboard API. Add small, local Svelte behavior only when the platform does not provide the complete interaction, while preserving native keyboard, focus, and accessibility semantics. Do not introduce a headless UI dependency without an explicit architecture change.

## Commit Messages

Write commit messages as a single sentence summarizing the changes.

Example: `Document native CSS styling guidance for agents`

## Path Patterns

- Use `./` for specific local file paths in config files, such as `extends: "./vite.config.ts"`.
- Omit `./` for glob patterns, such as `include: ["src/**/*.test.ts"]` or `exclude: ["src/lib/server/**"]`.
- In `.gitignore`, use a leading `/` for repository-root anchored paths, such as `/build` or `/node_modules`.

## Svelte MCP Server

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
