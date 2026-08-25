# Grapho

Grapho is a modern writing app for making documents that are ready to share.

> **Write beautifully. Organize simply. Export professionally.**

It is a document-first, local-first workspace for turning a blank page into a polished document—without Notion-style database complexity or Obsidian-style plugin configuration.

Grapho runs in the browser and as a native Tauri desktop application.

Grapho is designed around four product pillars:

- **Write** — a focused, block-based writing canvas.
- **Organize** — folders, nested documents, and simple hierarchy.
- **Refine** — rich formatting, todos, toggles, links, and document styles.
- **Deliver** — Markdown, HTML, plain text, JSON backup, and print/PDF output.

Grapho is free and open-source software in preparation. See the licensing note below before redistributing it.

Grapho is designed around three product promises:

- **Local ownership:** documents remain on the user's device.
- **Portable writing:** Markdown and JSON backup workflows reduce lock-in.
- **Focused editing:** a quiet canvas, structured blocks, and progressive tools.

## Status

Grapho is an actively developed early-stage project. The core writing workspace, local persistence, native filesystem adapter, autosave, undo/redo, structured blocks, document hierarchy, backlinks, search, import/export, print layout, browser mode, and Tauri desktop packaging are implemented. The editor and workspace shell are still being incrementally extracted into smaller modules, and native runtime/package validation remains part of ongoing development.

See:

- [`GRAPHO_ROADMAP.md`](./GRAPHO_ROADMAP.md) — planned product work.
- [`GRAPHO_ARCHITECTURE.md`](./GRAPHO_ARCHITECTURE.md) — code ownership and dependency boundaries.
- [`GRAPHO_DESIGN_SYSTEM.md`](./GRAPHO_DESIGN_SYSTEM.md) — visual and interaction rules.
- [`GRAPHO_COLOR_DESIGN_SYSTEM.md`](./GRAPHO_COLOR_DESIGN_SYSTEM.md) — official color tokens.
- [`GRAPHO_UI_UX_RULES.md`](./GRAPHO_UI_UX_RULES.md) — UI state and usability laws.

## Features

- Local document persistence with schema validation.
- Debounced autosave with visible save state.
- Browser and Tauri desktop modes.
- Custom native Tauri title bar and window controls.
- Dark and light themes.
- Structured blocks: paragraphs, headings, quotes, lists, todos, toggles, code, tables, callouts, dividers, and page breaks.
- Rich-text marks: bold, italic, underline, strike-through, inline code, highlights, and links.
- Markdown paste and Markdown file import.
- Markdown drag-and-drop import.
- Markdown, HTML, and plain-text export.
- JSON backup export/import.
- Native filesystem workspace storage in Tauri, with browser local-storage fallback.
- Trash and document restore.
- Document-level undo and redo.
- Slash command block menu with filtering and keyboard navigation.
- Human-friendly document links and derived backlinks.
- Nested documents and block hierarchy with indent/outdent controls.
- Searchable workspace sidebar with categorized full-text results.
- Centralized workspace shortcuts and editor formatting shortcuts.
- Command palette with `Ctrl+K` / `Cmd+K`.
- PDF export through the browser print flow with page breaks, headers, footers, page numbering, and print-safe layout.
- Glass dialogs, operation feedback, and accessible status states.
- RPM and DEB desktop bundles for Linux.

## Requirements

- Node.js 20 or newer recommended.
- npm.
- Rust and Cargo for Tauri development/builds.
- Linux WebKitGTK/Tauri build dependencies for native Linux packaging.

## Install and run the browser app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production build:

```bash
npm run build
npm run start
```

## Run the Tauri desktop app

```bash
npm run tauri:dev
```

This starts the Next.js development server and opens the native Tauri window. Test native-only behavior here, including the title bar, traffic-light controls, window dragging, rounded transparency, and native permissions.

## Build desktop packages

```bash
npm run tauri:build
```

The current Linux bundle produces RPM and DEB packages:

```text
src-tauri/target/release/bundle/rpm/
src-tauri/target/release/bundle/deb/
```

Build both Linux package targets explicitly:

```bash
npm run tauri:build:linux
```

Install or upgrade the RPM on Fedora/Nobara:

```bash
sudo dnf upgrade -y ./src-tauri/target/release/bundle/rpm/Grapho-0.1.2-1.x86_64.rpm
```

If the package version is unchanged and you are testing a rebuilt binary:

```bash
sudo dnf reinstall -y ./src-tauri/target/release/bundle/rpm/Grapho-0.1.2-1.x86_64.rpm
```

## Project structure

```text
grapho/
├── app/                         # Next.js route and global document shell
├── grapho-ui/
│   ├── domain/                  # Framework-independent document model
│   ├── persistence/             # Versioned local storage and diagnostics
│   ├── features/editor/         # Reusable editor controls and editor UI
│   ├── features/workspace/      # Workspace composition and interactions
│   └── styles/                  # Grapho design tokens and UI styles
├── public/Branding/             # Public logo assets
├── scripts/                     # Executable smoke tests and tooling
├── src-tauri/                   # Rust/Tauri desktop boundary
├── GRAPHO_ARCHITECTURE.md       # Layer ownership and dependency direction
├── GRAPHO_DESIGN_SYSTEM.md      # UI/UX design contract
└── GRAPHO_ROADMAP.md            # Product roadmap
```

## Architecture principles

- Domain code does not import React, browser APIs, localStorage, or Tauri.
- Persistence validates data at the storage/import boundary.
- UI features own interaction state but do not define storage schemas.
- Native APIs remain behind the Tauri boundary.
- Browser and native-only behavior are explicit and separate.
- Every asynchronous action exposes idle, pending, success, and error states.
- A command has one canonical toolbar location; duplicated actions are avoided.

Read [`GRAPHO_ARCHITECTURE.md`](./GRAPHO_ARCHITECTURE.md) before adding a new feature or moving files.

## Design system

All UI changes must follow [`GRAPHO_DESIGN_SYSTEM.md`](./GRAPHO_DESIGN_SYSTEM.md). The official colors are defined in [`GRAPHO_COLOR_DESIGN_SYSTEM.md`](./GRAPHO_COLOR_DESIGN_SYSTEM.md).

Use the existing `--grapho-*` CSS variables, shared `ToolbarButton`, glass surfaces, semantic dialog states, accessible labels, and reduced-motion rules. Do not introduce arbitrary colors or duplicate visual patterns.

## Validation

Production web build:

```bash
npm run build
```

Persistence smoke tests:

```bash
npm run test:persistence
```

Native build:

```bash
npm run tauri:build
```

Linting:

```bash
npm run lint
```

The lint command may scan generated Tauri artifacts under `src-tauri/target`; generated-file parsing warnings should be distinguished from source diagnostics.

## Data and privacy

Grapho is local-first and does not require an account or server connection for basic writing.

- Browser mode uses versioned `localStorage` persistence.
- Tauri desktop mode uses a native JSON workspace at the application data directory.
- Native writes use an atomic temporary-file replacement.
- Markdown and JSON backup export provide portable recovery paths.
- No analytics, hosted account, or cloud workspace is required by the current application.

Users are responsible for keeping backups of important documents while the storage and recovery system continues to evolve.

## Contributing

1. Read the architecture and design-system documents.
2. Keep changes focused and behavior-preserving.
3. Add or update tests for persistence and stateful behavior.
4. Run the relevant validation commands.
5. Use conventional commit messages.
6. Commit and push each logical change separately.
7. Do not include generated build output or unrelated files.

Suggested commit prefixes:

```text
feat: add a user-facing capability
fix: correct broken behavior
design: change visual treatment
refactor: reorganize code without behavior change
perf: improve runtime behavior
test: add coverage
docs: update project documentation
chore: maintain tooling or release metadata
```

## License

The repository currently does **not** contain a source-code license file. Until the project owner adds a chosen license, the source should be treated as **all rights reserved** despite the project’s FOSS goal.

Before public redistribution, add the selected license as `LICENSE`, review the branding/logo terms separately, and add third-party notices where required. Third-party packages remain governed by their respective licenses. The bundled Inter font is distributed under the SIL Open Font License.
