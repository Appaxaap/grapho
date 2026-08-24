# Grapho

Grapho is a calm, local-first writing workspace for documents, notes, and structured ideas. It runs in the browser and as a native Tauri desktop application.

Grapho is designed around three product promises:

- **Local ownership:** documents remain on the user's device.
- **Portable writing:** Markdown and JSON backup workflows reduce lock-in.
- **Focused editing:** a quiet canvas, structured blocks, and progressive tools.

## Status

Grapho is an actively developed early-stage project. The core workspace, local persistence, autosave, undo/redo, Markdown import/export, Trash/restore, browser mode, and Tauri desktop packaging are implemented. Some roadmap features remain in progress.

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
- Structured blocks: paragraphs, headings, quotes, lists, code, tables, callouts, and dividers.
- Markdown paste and Markdown file import.
- Markdown drag-and-drop import.
- Markdown export and JSON backup export/import.
- Trash and document restore.
- Document-level undo and redo.
- Slash command block menu.
- Searchable workspace sidebar.
- Command palette with `Ctrl+K` / `Cmd+K`.
- PDF export through the browser print flow.
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

Grapho is local-first. The browser implementation uses versioned browser storage. The desktop wrapper currently uses the webview storage layer and native window capabilities; native application-data storage is a planned adapter boundary.

Grapho does not require an account or server connection for basic writing. Users are responsible for exporting backups of important documents while native storage migration and recovery features continue to evolve.

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

Add the project's chosen open-source license file before publishing the repository publicly. Until then, do not assume that the repository's source code has a license merely because individual dependencies or font assets are permissively licensed.

Third-party licenses remain governed by their respective packages. The bundled Inter font is distributed under the SIL Open Font License.
