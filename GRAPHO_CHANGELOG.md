# Grapho Implementation Changelog

This file tracks implementation progress against [`GRAPHO_ROADMAP.md`](./GRAPHO_ROADMAP.md).

For user-facing release notes, see [`GRAPHO_RELEASE_NOTES.md`](./GRAPHO_RELEASE_NOTES.md).

## Changelog maintenance rule

Whenever an item from `GRAPHO_ROADMAP.md` is implemented, changed, or intentionally deferred:

1. Update the relevant status in this file.
2. Add a dated entry under **Change history**.
3. Mention the relevant files and validation performed.
4. Keep roadmap items separate when they are implemented in separate changes.

The roadmap remains the source of planned work. This file is the source of implementation history and current completion status.

## Status legend

- **Complete** — implemented and available in the current application.
- **Partial** — some functionality exists, but the full roadmap item is not complete.
- **Pending** — not implemented yet.
- **Manual validation** — implemented, but native/runtime validation is still required.

## Current status

### 1. Durable document persistence — Partial

#### Complete

- Created documents are persisted locally.
- Document titles are persisted.
- Block content is persisted.
- Block types are persisted.
- Tables and code blocks are persisted as document block data.
- Folder/project assignment is persisted.
- Active document is persisted.
- Active folder is persisted.
- Document ordering is persisted.
- Storage uses a versioned payload: `grapho.workspace.v1`.
- Stored data is minimally validated before loading.
- Invalid or malformed storage is ignored and the default documents are used.
- JSON backup export is available as `grapho-backup.json`.
- Reset local data is available with confirmation.

#### Remaining

- Formatting marks are not represented in the persisted block model.
- Deleted and archived document state is not fully implemented.
- Automatic recovery UI for corrupted data is not implemented.
- JSON backup import is not implemented.
- Reset and backup actions should move into a dedicated settings screen.
- Native Tauri application-data storage is not implemented yet.

### 2. Reliable undo and redo — Partial

#### Complete

- Document-level history replaces the previous browser-only `execCommand` history.
- Undo and redo work across document state changes such as editing, title updates, block changes, paste operations, and document creation.
- Redo history is cleared after a new edit.
- History is capped at 100 states.
- `Ctrl+Z` and `Cmd+Z` undo.
- `Ctrl+Shift+Z`, `Ctrl+Y`, `Cmd+Shift+Z`, and `Cmd+Y` redo.
- Undo and redo are available from the bottom toolbar.

#### Remaining

- History is currently maintained in the shell rather than a dedicated editor/history module.
- Formatting changes made through `document.execCommand` need explicit state synchronization and dedicated regression tests.
- Block movement is not implemented.
- History behavior across document switching needs dedicated testing.

### 3. Notion-style slash command menu — Partial

#### Complete

- Typing `/` opens the block command menu.
- Existing block types can be selected from the menu.
- Escape dismisses the menu.
- Commands can create or change paragraph, heading, quote, list, ordered list, code, table, divider, and callout blocks.
- Markdown-style block shortcuts are supported for headings, quotes, lists, ordered lists, and code blocks.

#### Remaining

- Searchable command filtering is not implemented.
- Arrow-key navigation is not implemented.
- Command categories and recent commands are not implemented.
- Fuzzy matching is not implemented.
- To-do, toggle, image, video, file, bookmark, mention, date/reminder, equation, template, and synced-block commands are not implemented.
- Mobile-specific slash-menu behavior needs validation.

### 4. Real document model — Partial

#### Complete

- Documents have stable IDs.
- Blocks have stable IDs.
- Documents contain titles, folders, blocks, and updated state.
- Supported block types include paragraph, heading, quote, list, ordered list, callout, table, code, and divider.
- A basic workspace/project/document structure exists.

#### Remaining

- Document icons are not implemented.
- Created and updated timestamps are not represented as durable timestamps.
- Favorites and pinned state are not implemented.
- Archived and trash state are not implemented.
- Parent documents and nested documents are not implemented.
- Block children and metadata are not implemented.
- Formatting is not represented in the formal block model.

### 5. Project and sidebar functionality — Partial

#### Complete

- Projects/folders currently include Projects, Personal, and Archive.
- Documents can be created in the active folder.
- Documents can be selected from the sidebar.
- Sidebar search filters documents by title.
- Sidebar can be collapsed.
- Native/browser layouts are supported.

#### Remaining

- Creating, renaming, and deleting projects is not implemented.
- Moving documents between projects is not implemented.
- Drag-and-drop ordering is not implemented.
- Favorites, recent documents, trash, and real archive behavior are not implemented.
- Project icons/colors and context menus are not implemented.

### 6. Search — Partial

#### Complete

- Sidebar search exists.
- Search currently filters document titles.

#### Remaining

- Full-text search across block content is not implemented.
- Headings, code blocks, and project names are not searched independently.
- Match highlighting, result previews, keyboard navigation, recent searches, and archived-document search are not implemented.
- Global `Ctrl+K`/`Ctrl+P` search is not implemented.

### 7. Auto-save and save state — Partial

#### Complete

- Document state is saved through a debounced local-storage write.
- Save state is shown in the bottom toolbar.
- `Saved`, `Saving…`, and `Could not save` states are available.
- Persistence uses a local-first browser-compatible implementation.

#### Remaining

- Immediate save on document switching is not separately implemented.
- Save-before-window-close handling is not implemented.
- Offline-specific state is not implemented.
- Interrupted-save recovery UI is not implemented.
- Native Tauri application-data saving is not implemented.

### 8. Import and export — Partial

#### Complete

- PDF export is available through the browser print flow.
- Markdown paste is parsed into Grapho blocks.
- JSON backup export is available.
- PDF print cleanup hides screen-only overlays and unfinished page-number content.

#### Remaining

- Markdown file import is not implemented.
- Markdown export is not implemented.
- JSON backup import is not implemented.
- HTML and plain-text export are not implemented.
- Native save dialogs are not implemented.
- Drag-and-drop Markdown import is not implemented.
- Project-level export is not implemented.

### 9. Keyboard shortcut system — Partial

#### Complete

- Undo and redo keyboard shortcuts are implemented.
- Help and shortcut information is available in the help modal.
- Escape closes active menus.
- Existing editing shortcuts include Enter, Shift+Enter, Backspace, Delete, slash commands, and Markdown shortcuts.

#### Remaining

- A central shortcut registry is not implemented.
- The help modal is not generated from a shared shortcut registry.
- New document, search, focus mode, sidebar, theme, export, navigation, duplicate, and block movement shortcuts are not centrally implemented.

### 10. Native Tauri integration — Partial

#### Complete

- Tauri desktop application is configured.
- Fedora/Nobara RPM packaging is configured.
- Debian packaging is configured.
- Native title bar is implemented.
- Native minimize, maximize, and close controls are implemented.
- Browser mode does not render native window controls.
- Tauri window decorations are disabled for the custom title bar.
- Application icon and native build configuration exist.

#### Remaining

- Native file open/save dialogs are not implemented.
- File-manager document opening is not implemented.
- Native application menu is not implemented.
- System tray and desktop notifications are not implemented.
- Native application-data storage is not implemented.
- Window close/save lifecycle handling is not implemented.
- RPM upgrade testing remains a manual validation task.

### 11. Settings — Partial

#### Complete

- Theme switching is implemented.
- Theme preference is persisted separately.
- Document style panel exists.
- Help and shortcut modal exists.
- Local data reset is available from the workspace toolbar.

#### Remaining

- Dedicated settings screen is not implemented.
- Font size, editor width, line height, default project, default document type, and autosave settings are not configurable.
- Import/export settings are not implemented.
- Application version display is not implemented.

### 12. Accessibility and usability — Partial

#### Complete

- Icon buttons have accessible labels in key areas.
- Focus-visible styling exists.
- Native title-bar controls have accessible labels.
- Reduced-motion CSS support exists.
- Help modal uses dialog semantics.
- Browser and native title-bar behavior are separated.

#### Remaining

- Full keyboard navigation audit is not complete.
- Slash-menu accessibility audit is not complete.
- Screen-reader and dialog behavior need dedicated testing.
- Accessibility contrast and tab-order audit are not complete.
- Tooltip coverage is incomplete.

### 13. Testing — Partial

#### Complete

- Production Next.js build has passed after the reliability implementation.
- CSS diagnostics passed for the PDF fixes.
- Native packaging/build workflow has previously passed for RPM and DEB targets.
- Manual PDF export issues involving the bottom overlay and stray page label were fixed.

#### Remaining

- Automated persistence tests are not implemented.
- Automated undo/redo tests are not implemented.
- Slash-command tests are not implemented.
- Sidebar, search, theme, and title-bar tests are not implemented.
- Full manual RPM close/reopen/upgrade validation remains.
- ESLint currently also scans generated Tauri build artifacts and reports unrelated generated-file parsing errors.

## Release tracking

### Release 0.1.2 — Reliability

**Status: Partial**

Completed:

- Local document persistence
- Debounced auto-save
- Save state
- Basic malformed-storage fallback
- JSON backup export
- Reset local data
- Initial document-level undo/redo

Remaining:

- Automated reliability tests
- Complete undo/redo coverage
- JSON backup import
- Native close/save handling

### Release 0.2.0 — Editor foundation

**Status: Pending**

- Formal document/block model improvements
- Complete slash command menu
- Better block operations
- Central keyboard shortcut registry
- Markdown import/export

### Release 0.3.0 — Workspace features

**Status: Pending**

- Project management
- Trash/archive
- Favorites
- Drag-and-drop ordering
- Full document search
- Recent documents

### Release 0.4.0 — Native desktop features

**Status: Partial**

Completed:

- Tauri desktop wrapper
- RPM and DEB packaging
- Custom native title bar
- Browser/native title-bar separation

Remaining:

- Native file dialogs
- Application-data storage
- Export flows
- Native menus
- Window lifecycle handling
- Full RPM update validation

### Release 1.0.0 — Polish

**Status: Pending**

- Accessibility pass
- Comprehensive tests
- Performance improvements
- Documentation
- Backup/import recovery
- Stable migration strategy

## Change history

### 2026-08-21 — Slash command navigation

- Added command filtering/search to the block slash menu.
- Added Basic, Lists, and Advanced command categories.
- Added Arrow Up/Down keyboard navigation.
- Added Enter to select and Escape to dismiss.
- Added accessible command search input and empty-result state.
- Validation: production build pending after this change.

### 2026-08-21 — Reliability implementation

Implemented the roadmap’s immediate next phase:

- Added versioned local document persistence in `grapho-ui/storage.ts`.
- Persisted documents, titles, blocks, folders, active document, active folder, and ordering.
- Added malformed-storage fallback to default documents.
- Added debounced auto-save and save-state feedback.
- Added JSON backup export.
- Added reset-local-data action.
- Replaced browser `execCommand` undo/redo with document-level history.
- Added Linux/Windows and macOS undo/redo keyboard shortcuts.
- Added a bounded history of 100 document states.
- Validated with `npm run build`.

### 2026-08-21 — PDF export cleanup

- Disabled the screen-only bottom fade during printing.
- Added extra print footer spacing.
- Hid the unfinished print page-number helper that rendered stray `Page` text.
- Validated with CSS diagnostics and `npm run build`.

### 2026-08-21 — Native/browser UI polish

- Added a custom Tauri title bar with window controls.
- Limited native title-bar controls to Tauri runtime.
- Kept browser mode free of native window controls.
- Improved sidebar text readability and bottom toolbar presentation.
- Removed the redundant Focus mode icon from the top toolbar.

### 2026-08-21 — Tauri packaging

- Added Tauri desktop configuration.
- Configured RPM and DEB bundle targets.
- Added Fedora/Nobara RPM build support.
- Added Tauri runtime dependency and native icon configuration.
- Native build workflow was validated previously.
