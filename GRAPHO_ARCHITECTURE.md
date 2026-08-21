# Grapho architecture

This document defines the ownership boundaries for Grapho. The goal is a small, predictable local-first desktop/web application whose UI can evolve without mixing rendering, persistence, and native concerns.

## Repository map

```text
grapho/
├── app/                         # Next.js route and global browser entry points
│   ├── page.tsx                 # Route composition only
│   ├── layout.tsx               # HTML shell and fonts
│   └── globals.css              # App-wide reset and global styles
├── grapho-ui/
│   ├── domain/                  # Framework-independent product model
│   │   └── model.ts             # Block, DocumentItem, folder contracts and seeds
│   ├── persistence/             # Durable storage adapters
│   │   └── storage.ts           # Versioned localStorage read/write/validation
│   ├── features/
│   │   └── workspace/           # Workspace feature composition and UI behavior
│   │       └── GraphoShell.tsx  # Client feature shell (current composition root)
│   ├── styles/                  # Grapho design system and native window styling
│   │   └── grapho.css
│   └── README.md
├── src-tauri/                   # Native desktop boundary
│   ├── capabilities/             # Explicit Tauri permissions
│   ├── icons/                    # Desktop assets
│   ├── src/                      # Rust bootstrap and native commands
│   └── tauri.conf.json           # Window, bundle, and native build config
├── public/                      # Static web assets
└── GRAPHO_*.md                  # Product, UX, release, and architecture contracts
```

## Dependency direction

```text
app route
  ↓
features/workspace
  ├── domain
  ├── persistence
  └── styles

src-tauri is a separate native adapter and must not be imported by domain code.
```

### Allowed ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| `app/` | Routes, document shell, global CSS entry | Workspace behavior or persistence logic |
| `domain/` | Types, invariants, pure transformations, seed data | React, browser APIs, Tauri, localStorage |
| `persistence/` | Serialization, schema versions, validation, recovery | JSX, visual state, direct DOM manipulation |
| `features/` | User interactions, rendering, feature-level state | Storage schema details or Rust implementation details |
| `styles/` | Tokens, layout, visual states, platform-specific CSS | Application state or business decisions |
| `src-tauri/` | Native windows, permissions, native filesystem/dialog APIs | React component logic or domain rules |

## Rules for new code

1. **One responsibility per module.** A file should have one reason to change.
2. **UI calls services, not storage APIs.** When persistence grows, add a workspace repository/service instead of adding more localStorage calls to `GraphoShell`.
3. **Domain types stay framework-free.** Domain modules must be usable from tests, browser code, and future Tauri/Rust adapters.
4. **Native APIs stay behind adapters.** Tauri imports belong in a desktop adapter or a clearly named native hook, never in model or persistence validation.
5. **Keep state close to its owner.** Modal state belongs to the workspace feature; document state belongs to the document/workspace service; visual tokens belong to styles.
6. **Validate at boundaries.** Parse and validate imported files and persisted data before state updates.
7. **Use stable IDs.** Never use array indexes as document or block identity.
8. **Every async operation has a state machine.** At minimum: idle, pending, success, and error. Destructive operations must remain visible while pending.
9. **No duplicate commands across toolbars.** A moved action has one canonical location; use contextual shortcuts only when they add value.
10. **Browser and Tauri behavior must remain explicit.** Native-only layout and controls require `.is-native-window` or a native adapter.

## Planned extractions from the current composition root

`GraphoShell.tsx` is currently the feature composition root and is intentionally the next refactor target. Extract in this order:

1. `features/workspace/useWorkspace.ts` — document selection, folders, CRUD, and workspace state.
2. `features/editor/` — blocks, title editing, slash commands, formatting, and editor history.
3. `features/workspace/components/Sidebar.tsx` — folder/document navigation and search.
4. `features/workspace/components/WorkspaceToolbar.tsx` — top and bottom command surfaces.
5. `features/operations/` — import/export/reset/delete operation state machines.
6. `persistence/repository.ts` — a typed repository interface so storage can move from localStorage to Tauri/SQLite without UI changes.
7. `desktop/tauriWindow.ts` — native window lifecycle and permissions behind a small adapter.

Each extraction should preserve behavior, pass `npm run build`, and be committed separately.

## Validation gates

Before merging a change:

- `npm run build` must pass.
- Native changes require `npm run tauri:build`.
- Persistence changes require malformed-data and reload checks.
- UI state changes require keyboard, narrow viewport, dark/light mode, and reduced-motion checks.
- Tauri changes require testing the installed RPM/DEB, not only the browser dev server.

## Current known limitation

The workspace shell still contains several feature areas in one file. The directory boundaries above are now established; the next architectural changes should extract the listed feature modules incrementally rather than creating a second monolith elsewhere.
