# Grapho

Grapho is a local-first desktop writing application built with Next.js, React, TypeScript, SQLite, BlockNote, and Tauri-compatible web tooling.

The goal of the project is to provide a premium writing environment for Linux that feels calm, fast, and native while staying fully offline-capable.

## Product summary

Grapho is designed around a simple model:

- Library
- Notes
- Document

The document is the primary surface. Navigation and tools should support writing without competing with it.

Current product capabilities include:

- Local SQLite persistence
- Automatic saving
- Note creation, selection, trash, and restore
- BlockNote rich text editing
- Slash commands and contextual editor surfaces
- Search across note titles and content
- Version history
- PDF export
- Theme switching
- Focus mode
- Narrow-window navigation drawer behavior

## Design and implementation status

The application is currently in an active UI redesign. The shell has been rebalanced around a three-part hierarchy:

- Library
- Notes
- Document

The notes list is being refined into a compact scanable navigator.
The editor remains BlockNote-based.
The inspector is handled as progressive disclosure instead of a permanently dominant fourth column.

## Repository structure

```text
app/         Next.js App Router pages and global styles
components/  Shell, sidebar, editor, inspector, and modal components
hooks/       Keyboard shortcut and interaction hooks
lib/         Persistence, store, PDF, markdown, sanitization, utilities, and types
public/      Static assets including the sql.js WASM file
scripts/     Maintenance scripts and smoke tests
```

## Core architecture

### App shell

`components/App.tsx` composes the desktop application:

- top bar
- rail
- notes sidebar
- editor stage
- inspector
- narrow drawer
- global modals

The shell is responsive and preserves focus mode and drawer behavior.

### Notes and persistence

`lib/store.tsx` owns the application state and persistence orchestration.

The store handles:

- notes list state
- active note selection
- search query
- theme and font settings
- inspector and drawer state
- history, export, and import modal state
- focus mode
- autosave scheduling

`lib/db.ts` provides the SQLite and IndexedDB bridge.

### Editor

`components/EditorView.tsx` hosts BlockNote and is responsible for:

- title editing
- save state feedback
- word count and metadata
- editor font application
- focus and editor publishing for external controls

### Inspector

`components/Inspector.tsx` provides document appearance and structure controls.
It is intended to be contextual and secondary, not a permanent visual competitor to the document.

### Notes sidebar

`components/Sidebar.tsx` is the notes navigation surface.
It is responsible for:

- note list display
- note search
- create note action
- trash and restore actions
- empty states
- narrow drawer rendering

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm

### Install

```bash
npm install
```

The install step also copies the `sql.js` WebAssembly asset into `public/sql-wasm.wasm` through the `postinstall` script.

### Run locally

```bash
npm run dev
```

Open the local Next.js app in the browser shown by the terminal output.

### Production build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

### Smoke tests

```bash
npm run smoke
```

The smoke tests verify the markdown conversion helpers and PDF rendering path.

## Validation workflow

For UI changes, the recommended workflow is:

1. Run lint.
2. Run the production build.
3. Run smoke tests.
4. Render the app in the browser at the target desktop sizes.
5. Review screenshots for layout, hierarchy, and interaction regressions.

The project also keeps Playwright-based validation helpers in `.pwtools/` for local inspection.

## Data flow

The main writing flow is:

1. User edits a note in BlockNote.
2. The editor emits document updates.
3. The store schedules a debounced save.
4. SQLite is flushed.
5. IndexedDB receives the database blob.
6. PDF and markdown exports are generated on demand.

This keeps the application local-first and offline-capable.

## Persistence model

The application stores note content as BlockNote document JSON.
That approach is intentional because the editor already works with structured block data.

Important persistence responsibilities:

- `lib/db.ts` loads and saves pages, settings, versions, and metadata
- `lib/sanitize.ts` repairs malformed document data before it reaches the editor
- `lib/store.tsx` coordinates debounced writes and state updates

## Document and export helpers

### Markdown conversion

`lib/markdown.ts` contains helpers to convert between BlockNote blocks, Markdown, and plain text.
These helpers are used by search, imports, exports, and note title derivation.

### PDF export

`lib/pdf.tsx` renders notes to PDF using `@react-pdf/renderer`.
The export is fully offline and relies on built-in PDF fonts.

## Keyboard model

Keyboard support is a core part of the product.
Existing shortcuts are handled through `hooks/useKeyboardShortcuts.ts` and BlockNote's own editor shortcuts.

The app currently supports note creation, search, export, focus mode, drawer behavior, theme cycling, and editor formatting through a combination of app-level and BlockNote-level shortcuts.

## Responsive behavior

The application is designed for desktop resizing.
Current layout states include:

- Wide: Library, Notes, Document
- Medium: Notes and Document with Inspector hidden
- Narrow: Document-first with temporary navigation drawer
- Focus mode: Editor-only writing experience

## Development notes

- Preserve BlockNote behavior unless a real limitation is proven.
- Preserve local persistence and autosave behavior.
- Keep shell changes minimal and reviewable.
- Do not introduce new state libraries unless absolutely necessary.
- Keep the UI calm and document-first.
- Avoid dashboard-like or SaaS-like patterns.

## Troubleshooting

### The app does not start

Check that dependencies are installed and that the `sql.js` WASM file exists in `public/sql-wasm.wasm`.

### Editor content looks wrong after load

Check the sanitization path in `lib/sanitize.ts` and the load path in `lib/db.ts`.

### PDF export looks incorrect

Check `lib/pdf.tsx` and the current note content structure.

## Notes for desktop packaging

The project is compatible with a Tauri shell because it is already local-first and client-driven.
When packaging for Tauri, verify the following:

- The web build path is configured correctly.
- The SQL.js WASM asset is reachable.
- The database persistence bridge works in the desktop environment.
- Theme detection and focus behavior match the host platform.

## Current design direction

The current UI direction is to make Grapho feel like a premium Linux writing tool, not a web dashboard.
The intended hierarchy is:

- Document first
- Writing second
- Navigation third
- Search and contextual tools after that

The notes column should help the user find and switch notes quickly.
The document should remain the strongest visual region.

## License

Private project. All rights reserved.
