# Grapho 📝

**Write freely.**

Grapho is a lightning-fast, offline-first note-taking app. Everything you write is stored
locally on your device in SQLite — no accounts, no cloud, no tracking. It pairs the rich
editing experience of Notion with the speed and privacy of a local-first tool.

> γράφω (gráphō) — Greek for “I write”.

---

## Features

| Area | What's included |
|------|-----------------|
| **Editor** | BlockNote block-based rich text: headings, bullets, numbered & checkbox lists, quotes, code blocks, dividers, tables, images, links, and Markdown auto-format while you type (`#` → H1, `-` → bullet, `1.` → list, `**bold**`, `> quote`, `` `code` ``, `---`) |
| **Emojis** | Searchable emoji picker with categories, skin tones, and a frequently-used row (`[😊]` button or `Cmd/Ctrl+Shift+E`); type `:` in the editor for quick inline emoji search |
| **Organization** | Sidebar with note list, full-text search, trash with 30-day retention and restore |
| **Version history** | Every change is snapshotted (up to 200 versions/note); restore any version |
| **Export** | One-click PDF (A4/Letter/Legal, portrait/landscape, narrow/normal/wide margins, Minimal/Modern/Academic templates, header & footer) plus Markdown export — all rendered offline |
| **Import** | "Import from ChatGPT" parses pasted Markdown into formatted blocks |
| **Themes** | Light, Dark, and Sepia palettes |
| **Fonts** | System sans, Georgia, serif fallback for the editor |
| **Focus mode** | Distraction-free writing (Cmd/Ctrl+Shift+F) |
| **Keyboard shortcuts** | See below |

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) 16 (App Router, React 19, Turbopack)
- **Editor:** [BlockNote](https://blocknote.dev) (`@blocknote/shadcn` UI)
- **Database:** [SQLite](https://sql.js.org) via `sql.js` (WASM), persisted to IndexedDB
- **PDF:** [@react-pdf/renderer](https://react-pdf.org) (built-in fonts → fully offline)
- **Icons:** [lucide-react](https://lucide.dev)
- **Styling:** Tailwind CSS v4

## Getting Started

```bash
npm install        # also copies sql.js WASM → public/sql-wasm.wasm (postinstall)
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npm run smoke      # Node-side checks for markdown + PDF rendering
```

## How Data Flows

```
You type → BlockNote editor
   → throttled sync into app state (250ms)
   → debounced SQLite save (800ms) + version snapshot
   → whole DB file exported to IndexedDB
   → PDF/Markdown export rendered on demand
```

### SQLite schema

```
pages      id, title, content (BlockNote JSON), created_at, updated_at,
           trashed_at, is_shared
versions   id, page_id, version, title, content, created_at   (indexed on page_id)
settings   key, value
meta       key, value
```

The brief's separate `blocks` table is folded into `pages.content` — BlockNote stores the
whole document as one JSON array, so a separate table would add joins without value.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New note |
| `Cmd/Ctrl + E` | Export to PDF |
| `Cmd/Ctrl + Shift + E` | Insert emoji |
| `Cmd/Ctrl + F` | Search notes |
| `Cmd/Ctrl + H` | Version history |
| `Cmd/Ctrl + Shift + F` | Focus mode |
| `Cmd/Ctrl + Delete` | Move note to trash |
| `Cmd/Ctrl + 1` / `Cmd/Ctrl + 2` | My Notes / Trash |
| `Cmd/Ctrl + Shift + T` | Cycle theme |
| `Cmd/Ctrl + Z` / `Shift + Z` | Undo / Redo (editor) |
| `Esc` | Close modal / exit focus mode |

Formatting shortcuts (`Cmd/Ctrl + B/I/U/K`, headings, lists) are provided by BlockNote.
Typing `:` in the editor opens BlockNote's built-in emoji search grid.

## Project Structure

```
app/            layout (fonts, metadata) + page (store provider + App shell)
components/     Sidebar, EditorView, WelcomeScreen, Export/Import modals,
                HistoryPanel, SettingsMenu, Modal, EmojiButton, EmojiPicker
lib/            db.ts (sql.js + IndexedDB), store.tsx (state + autosave),
                markdown.ts (blocks ⇄ markdown), sanitize.ts (repairs
                damaged stored blocks before they reach the editor),
                pdf.tsx (PDF renderer),
                editorRegistry.ts (active editor for pickers/shortcuts),
                constants.ts, types.ts, utils.ts
hooks/          useKeyboardShortcuts.ts
scripts/        copy-wasm.mjs (postinstall), smoke-test.ts (node checks),
                repro-editor.mts (headless BlockNote crash repro)
public/         sql-wasm.wasm (copied from node_modules/sql.js)
```

## Shipping as a Desktop App (Tauri)

This repo is the web layer a Tauri shell would wrap — the entire app is client-side and
works offline, so it ports to Tauri with no architecture changes. To add the shell on a
machine with Rust installed:

```bash
npm install -D @tauri-apps/cli
npm run tauri init          # scaffold src-tauri
npm run tauri dev           # or `npm run tauri build`
```

Notes for the Tauri integration:

- Set the Tauri webview URL to the built `out/`/`next start` server (or bundle the static
  export) and enable the `local` custom protocol.
- `sql.js` already loads its WASM from `/sql-wasm.wasm`; adjust `lib/db.ts`'s `locateFile`
  if the asset lives under a custom protocol path.
- Data already lives in IndexedDB; for true desktop-grade persistence you can swap the
  IndexedDB layer in `lib/db.ts` for Tauri SQLite commands (the schema above stays the
  same).

## Roadmap

- [x] Phase 1 — Foundation: app shell, SQLite, notes CRUD, auto-save
- [x] Phase 2 — Editor: BlockNote, Markdown auto-format, formatting toolbar
- [x] Phase 3 — Organization: sidebar, search, trash + restore
- [x] Phase 4 — Version history + restore
- [x] Phase 5 — PDF export with templates/settings + Markdown export
- [x] Phase 6 — Focus mode, themes, fonts, shortcuts
- [x] Emoji picker — searchable, categorized, skin tones, recents (`Cmd/Ctrl+Shift+E` + `:` trigger)
- [ ] Tauri desktop shell (needs Rust toolchain)
- [ ] Diff view between versions
- [ ] Shared notes / sync (CRDT-based, future)

## License

Private project. All rights reserved.
