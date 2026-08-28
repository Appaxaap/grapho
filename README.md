# Grapho

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
[![Local first](https://img.shields.io/badge/storage-local--first-6BA587?style=flat-square)](#data-and-privacy)
[![Status](https://img.shields.io/badge/status-early%20development-C9A66B?style=flat-square)](#project-status)

> **Write beautifully. Organize simply. Export professionally.**

Grapho is a document-first, local-first writing application for turning ideas into finished documents.

It is designed for people who want a calm writing canvas, simple document organization, and portable exports without depending on a hosted workspace.

> Your documents should remain useful even when the internet is not.

## Project status

Grapho is an early-stage project under active development. The browser workspace, local persistence, rich document blocks, nested documents, search, import and export flows, print layout, and Tauri desktop packaging are available for development use.

Grapho is released under the MIT License. See [`LICENSE`](./LICENSE) for the full legal text and [`LICENSE.md`](./LICENSE.md) for project, branding, contribution, and third-party asset guidance.

## What Grapho includes

### Writing

- Block-based writing canvas
- Paragraphs, headings, quotes, lists, todos, toggles, callouts, code, tables, dividers, and page breaks
- Bold, italic, underline, strike-through, inline code, highlights, and links
- Markdown paste and Markdown file import
- Automatic presentation for email addresses, URLs, status values, and structured field labels

### Organization

- Projects and folders
- Nested documents
- Nested blocks with indent and outdent behavior
- Document links and backlinks
- Searchable workspace sidebar
- Trash and document restore

### Delivery

- Markdown export
- HTML export
- Plain text export
- JSON backup export and import
- Browser print flow for PDF output
- Print-safe headers, footers, page numbers, and page breaks

### Workspace

- Browser mode with local storage
- Native Tauri desktop mode
- Autosave with visible save state
- Undo and redo
- Dark and light themes
- Keyboard shortcuts
- Command palette
- Accessible dialogs and focus states
- Linux RPM and DEB packaging support

## Quick start

### Requirements

- Node.js 20 or newer
- npm
- Rust and Cargo for Tauri development
- Linux WebKitGTK and Tauri build dependencies for Linux desktop packages

### Browser development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The public landing page is available at `/`. The writing workspace is available at `/app`.

The repository intentionally publishes only the product source and required build files. Internal planning documents and the retired local `/site` route are kept outside public version control and are not part of the public application.

### Production browser build

```bash
npm run build
npm run start
```

### Tauri development

```bash
npm run tauri:dev
```

### Linux desktop packages

```bash
npm run tauri:build:linux
```

The generated packages are written below:

```text
src-tauri/target/release/bundle/deb/
src-tauri/target/release/bundle/rpm/
```

Generated build output is intentionally ignored and should not be committed.

## Developer guide

### Public repository scope

The public repository contains the application source, native desktop boundary, public assets, tests, and required development configuration. Local-only planning documents, design references, release notes, and retired route files are ignored and are not expected to exist in a fresh clone.

Do not re-add local-only files to a commit. If a private development note is needed, keep it outside the published repository.

### Architecture

Grapho uses a small layered architecture:

```text
app/
  Next.js routes and public landing page

grapho-ui/domain/
  Framework-independent document model and pure operations

grapho-ui/persistence/
  Browser and native workspace storage adapters

grapho-ui/features/editor/
  Reusable editor controls

grapho-ui/features/workspace/
  Workspace composition and interaction state

grapho-ui/styles/
  Application tokens and shared interface styles

src-tauri/
  Native desktop boundary and packaging configuration

scripts/
  Smoke tests and development tooling
```

### Design boundaries

- Domain code must not import React, browser APIs, local storage, or Tauri APIs.
- Persistence validates data at storage and import boundaries.
- UI features own interaction state and do not define storage schemas.
- Native APIs remain behind the Tauri boundary.
- Browser and native behavior must remain explicit.
- Asynchronous actions should expose idle, pending, success, and error states.
- A command should have one canonical toolbar location.
- Use existing `--grapho-*` tokens and shared controls before introducing new visual patterns.
- Keep the writing canvas more important than surrounding software.

### Working on a feature

1. Identify the correct layer before editing.
2. Keep document data portable and understandable.
3. Prefer pure domain functions for parsing, ordering, validation, and transformations.
4. Preserve keyboard navigation and focus behavior.
5. Add accessible labels to new controls.
6. Support reduced motion for animated interactions.
7. Test browser and native behavior when a change crosses the persistence boundary.

### Useful commands

```bash
npm run dev
npm run build
npm run lint
npm run test:persistence
npm run tauri:dev
npm run tauri:build:linux
```

### Validation expectations

Before submitting a change, run the checks relevant to the area you changed:

- `npx tsc --noEmit` for TypeScript changes
- `npm run build` for route, styling, and production bundle changes
- `npm run test:persistence` for storage and recovery changes
- `npm run lint` for source quality checks
- `npm run tauri:build:linux` for native packaging changes

Do not commit `.next`, `out`, `node_modules`, `src-tauri/target`, local browser tooling, environment files, internal planning documents, retired route files, or private developer instructions.

## Data and privacy

Grapho is local-first for basic writing. It does not require an account or hosted workspace.

- Browser mode stores workspace data in versioned browser storage.
- Tauri mode stores workspace data in the native application data directory.
- Native writes use an atomic temporary-file replacement.
- Markdown and JSON backups provide portable recovery paths.
- The current application does not require analytics, a hosted account, or a cloud workspace.

Keep backups of important work while storage and recovery features continue to evolve.

## Contributing

Contributions, bug reports, and thoughtful product feedback are welcome.

When opening an issue, include:

- What you expected
- What happened instead
- Reproduction steps
- Browser or operating system details
- Whether the issue occurs in browser mode, Tauri mode, or both

For code changes:

1. Keep the change focused.
2. Follow the architecture and design boundaries above.
3. Add or update relevant tests.
4. Run the appropriate validation commands.
5. Use a conventional commit message.
6. Do not include generated output or local-only files.

Suggested commit prefixes:

```text
feat: add a user-facing capability
fix: correct broken behavior
design: change visual treatment
refactor: reorganize code without behavior change
perf: improve runtime behavior
test: add coverage
docs: update documentation
chore: maintain tooling
```

## Links

- [Repository](https://github.com/Appaxaap/grapho)
- [Issues](https://github.com/Appaxaap/grapho/issues)

## License

Grapho is released under the [MIT License](./LICENSE).

The MIT License applies to the project source unless a file or directory contains a more specific notice. It permits use, modification, distribution, sublicensing, and commercial use while requiring preservation of the copyright and permission notices.

The Grapho name, logo, icons, and other branding assets are separate from the source license. Modified distributions should use a distinct product name and must not imply official endorsement. Third-party packages, fonts, and assets remain subject to their own licenses.

Read [`LICENSE.md`](./LICENSE.md) for detailed guidance on source code, branding, contributions, third-party dependencies, and redistribution.

## Closing thought

> Grapho is for the moment when collecting stops and making begins.

Open source in spirit. Local-first in design. Yours to write in.
