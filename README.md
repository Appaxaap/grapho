# Grapho

Developer documentation for Grapho, a local-first note-taking and document
workspace built on Next.js with a BlockNote editor and a client-side SQLite
(WASM) store.

This document covers setup, architecture, the markdown pipeline, persistence,
import and export, theming, and testing.

## Overview

Grapho is an offline-first writing app. Notes are authored in a rich BlockNote
editor, stored entirely on the user's device inside IndexedDB (backed by a
SQLite WASM database), and can be exported to Markdown or PDF without any
server round trip.

Key product properties:

- Fully local storage. No backend and no network calls for reading or writing notes.
- Markdown import and export.
- PDF export with selectable page size, orientation, margins, and templates.
- Version history per note with adjustable retention.
- Light, dark, and system theme modes.

## Tech stack

- Next.js 16 (App Router) with React 19.
- BlockNote 0.52 for the rich text editor (`@blocknote/core`, `@blocknote/react`, `@blocknote/shadcn`).
- sql.js (SQLite compiled to WebAssembly) for the document store, persisted in IndexedDB.
- @react-pdf/renderer for client-side PDF generation.
- Tailwind CSS v4 (via @tailwindcss/postcss).
- TypeScript 5 and ESLint 9 (eslint-config-next).
- emoji-mart for the emoji picker.

## Requirements

- Node.js 18 or newer (Node 20 recommended).
- A package manager that can install the dependencies listed in package.json.

## Getting started

Install dependencies. The postinstall script copies the SQLite WASM file into
the public directory, so run a full install rather than a partial one:

```
npm install
```

Start the development server:

```
npm run dev
```

Build for production:

```
npm run build
npm run start
```

## Scripts

| Script | Purpose |
| ------ | ------- |
| npm run dev | Start the Next.js development server. |
| npm run build | Production build of the Next.js app. |
| npm run start | Serve the production build. |
| npm run lint | Run ESLint (eslint-config-next). |
| npm run smoke | Run the Node-side smoke test for the markdown pipeline and PDF renderer. |
| npm run postinstall | Copy the sql.js WASM binary into the public folder (automatic on install). |

## Project structure

```
app/
  layout.tsx          Root layout and global styles.
  page.tsx            Route entry. Renders GraphoShell.
  globals.css         Global stylesheet.
  editor.css          Editor surface styles.
components/
  grapho-shell.tsx    Top-level shell. Mounts the App editor.
  App.tsx             Notes workspace: top bar, sidebar, editor, panels.
  EditorView.tsx      BlockNote editor host plus the paste-to-markdown handler.
  Rail.tsx            Left rail with note actions.
  Sidebar.tsx         Note list, search, trash.
  Inspector.tsx       Style panel (accent, font, theme).
  WelcomeScreen.tsx   Empty state.
  ImportModal.tsx     Paste ChatGPT or markdown text to create a note.
  ExportModal.tsx     Export to Markdown or PDF with a live preview.
  HistoryPanel.tsx    Per-note version history.
  EmojiPicker.tsx     Emoji insertion.
  ContextMenu.tsx     Selection actions.
  Modal.tsx           Shared modal primitive.
features/
  editor/document-editor.tsx   Prototype plain-text contenteditable editor.
  workspace/workspace-shell.tsx Prototype workspace shell.
hooks/
  useKeyboardShortcuts.ts
lib/
  markdown.ts         Markdown to BlockNote block conversion and inline parsing.
  pdf.tsx             PDF rendering via @react-pdf/renderer.
  store.tsx           Global app state (notes, settings, UI).
  db.ts               SQLite WASM persistence in IndexedDB.
  sanitize.ts         Block content validation.
  docState.ts         In-editor typography state.
  editorRegistry.ts   Reference to the active BlockNote editor.
  constants.ts        Settings defaults, templates, accents, shortcuts.
  types.ts            Shared TypeScript types.
  format.ts           Formatting helpers.
  ids.ts              ID generation.
  utils.ts            Generic helpers (cn, time, clipboard).
scripts/
  copy-wasm.mjs       Postinstall WASM copy.
  smoke-test.ts       Node-side smoke test.
public/               Static assets, including the copied sql.js WASM.
```

## Architecture

### Entry and routing

The route `app/page.tsx` renders `GraphoShell`. `GraphoShell` mounts the `App`
component, which is the production notes workspace built around the BlockNote
editor.

`App` composes a top bar, a floating sidebar (`Sidebar`), the editor stage
(`EditorView` keyed by active note), an optional inspector, and the
history/export/import modals. It reads all data and actions from the global
store.

### Global state

State lives in `lib/store.tsx`, a React context with a hooks-based store. The
store holds:

- the list of notes (including trashed notes),
- the active note id,
- UI state (sidebar, inspector, focus mode, modals, history panel),
- settings (accent, font, theme, export options).

Components subscribe through a `useStore` hook. Persisting a note calls the
database layer through the store actions.

### Persistence

Persistence is in `lib/db.ts`. Grapho uses `sql.js`, a SQLite build compiled to
WebAssembly. The database file is kept in IndexedDB so it survives reloads and
stays fully client side.

Tables include:

- `pages` for notes (id, title, content, timestamps, trash state),
- `meta` for flags such as the seed marker,
- a versions table for per-note snapshots.

On first run, the database is seeded with a welcome note built from
`WELCOME_MARKDOWN` passed through `markdownToBlocks`.

### Editors

There are two editors in the codebase:

1. `EditorView` (production, BlockNote). This is the editor the app mounts by
   default. It renders `BlockNoteView`, handles change synchronization into the
   store, and includes a paste handler that converts pasted Markdown into
   BlockNote blocks.
2. `features/editor/document-editor.tsx` (prototype). A plain-text
   contenteditable editor with a slash command menu, used by the separate
   `WorkspaceShell`. It stores block content as plain strings and therefore
   cannot render inline Markdown such as `**bold**`. It is not part of the
   default route.

## Markdown pipeline

The markdown logic is centralized in `lib/markdown.ts`. It converts between
BlockNote block arrays and Markdown text in both directions.

### Functions

- `markdownToBlocks(md)` parses a Markdown string into BlockNote blocks. It
  recognizes headings (`#` to `######`), bullet and numbered lists, checklists
  (`- [ ]` or `- [x]`), blockquotes, fenced code blocks, horizontal rules,
  images, and tables.
- `blocksToMarkdown(blocks)` serializes BlockNote blocks back to Markdown.
- `parseInline(text)` converts inline Markdown inside a line into styled inline
  content. It is a delimiter-stack parser that supports nesting and the
  strong/emphasis combinations ChatGPT emits:
  - `**bold**` and `__bold__`
  - `*italic*` and `_italic_`
  - `***bold italic***`
  - nesting such as `**bold *nested* bold**` and `*italic **bold** italic*`
  - `` `code` ``
  - `~~strike~~`
  - `[links](https://example.com)`
  Unmatched delimiters (a stray `**`) are rendered literally rather than
  dropped.
- `inlineToMarkdown(content)`, `inlineToText(content)`, `blocksToPlainText(blocks)`,
  `wordCount(blocks)`, and `deriveTitle(blocks)` are helpers used by search,
  previews, the sidebar, and the inspector.

### Inline parsing design

`parseInline` first splits out code spans (verbatim) and links, then runs a
delimiter-stack emphasis parser over the remaining text. Each delimiter run is
tracked with open/close flags, and matched pairs are folded into nested groups.
Styles are merged down onto leaf text nodes so, for example,
`**bold *nested* bold**` becomes one bold run with an inner bold plus italic
span. This keeps output compatible with BlockNote's flat inline content model.

## Import

The Import modal (`ImportModal`) accepts pasted text from ChatGPT or any
Markdown source. On import it calls `markdownToBlocks` and creates a new note
from the result. The placeholder documents the supported syntax: headings,
bullets, `**bold**`, `*italic*`, numbered lists, blockquotes, and dividers.

The BlockNote editor also intercepts paste directly. `EditorView` attaches a
capture-phase paste listener on the editor host. When the pasted text looks
like Markdown (headings, lists, `**`, `~~`, code spans, links), the handler
prevents the default paste, parses the text with `markdownToBlocks`, and
replaces the current block with the parsed blocks. Plain text and rich HTML
paste are left to BlockNote's default handling.

## Export

The Export modal (`ExportModal`) offers two formats:

- Markdown: `blocksToMarkdown` serialized and downloaded as a `.md` file.
- PDF: rendered entirely client side by `renderNoteToPdfBlob` in `lib/pdf.tsx`,
  which uses `@react-pdf/renderer`. The export settings select page size
  (A4, Letter, Legal), orientation, margin preset (narrow, normal, wide),
  template (minimal, modern, academic), and header or footer toggles. Templates
  use built-in PDF fonts so no network fetch is required.

A live preview in the modal mirrors the chosen template and margins.

## Theming and settings

Theme handling lives in `lib/constants.ts` and `lib/useSystemTheme.ts`. The
supported modes are system, light, and dark. The resolved theme is applied to
the document root as a `data-theme` attribute in `App`.

Settings include:

- `accent`: neutral, blue, green, gold, or rainbow (plum). The accent tunes the
  single accent hue used for focus rings, selection, and active states.
- `font`: inter, georgia, merriweather, or mono, applied to the editor surface.
- `theme`: system, light, or dark.
- `export`: page size, orientation, margins, template, header, footer.

Per-session in-editor typography (size, line height) is managed by
`lib/docState.ts` and applied as CSS variables on the document surface.

## Testing

The smoke test runs pure logic and the PDF renderer in Node:

```
npm run smoke
```

It covers:

- Markdown to BlockNote blocks and back (round trip),
- heading level, bold, checklist, code fence, quote, and divider parsing,
- title derivation, plain-text extraction, and word counts,
- nested and combined inline emphasis (`***`, `**bold *nested* bold**`, italic
  wrapping bold),
- links, strike, `snake_case` treated as literal, and unmatched stars staying
  literal,
- PDF rendering for the minimal, modern, and academic templates.

## Notes and caveats

- The app is offline-first. All note data stays in the browser. There is no
  server and no sync.
- The prototype `DocumentEditor` in `features/editor` is excluded from the
  default route and cannot render inline Markdown. It is kept as a separate
  reference implementation.
- A successful production build requires the dependencies to be installed. If you
  see `Module not found: Can't resolve '@blocknote/core'`, run a full
  `npm install` first.
- Per the project AGENTS guidance, this version of Next.js has breaking changes.
  Read the relevant guide under `node_modules/next/dist/docs/` before changing
  framework-level code.

## Reference

Main source modules:

- `lib/markdown.ts` - Markdown conversion and inline parsing.
- `lib/db.ts` - SQLite WASM persistence.
- `lib/store.tsx` - Global state.
- `lib/pdf.tsx` - PDF export.
- `components/EditorView.tsx` - Editor host and paste handling.
- `components/App.tsx` - Workspace composition.
