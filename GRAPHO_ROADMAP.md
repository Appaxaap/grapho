# Grapho Implementation Roadmap

This document is the implementation reference for the Grapho editor and native desktop application.

## 1. Durable document persistence — highest priority

Currently documents only exist in React memory. Persist these locally:

- Created documents
- Document titles
- Block content
- Block types
- Formatting
- Tables and code blocks
- Deleted or archived state
- Project/folder assignment
- Active document
- Active project
- Document ordering
- Last edited timestamp

For the first version, a versioned `localStorage` store is sufficient. Later, native Tauri storage can move to an application-data JSON or SQLite database.

Also add:

- Storage schema versioning
- Validation for corrupted data
- Automatic recovery to default documents
- Export/import backup as JSON
- “Reset local data” option in settings

## 2. Reliable undo and redo

Undo/redo should operate on document editing actions, not only browser-level input events.

It should support:

- Typing
- Deleting text
- Formatting
- Block creation
- Block deletion
- Block movement
- Block type changes
- Title edits
- Paste operations
- Table edits
- Undo after switching documents
- Redo after undo
- Clearing redo history after a new edit

Keyboard shortcuts should support:

- Linux/Windows: `Ctrl+Z`
- Linux/Windows redo: `Ctrl+Shift+Z` and `Ctrl+Y`
- macOS: `Cmd+Z`
- macOS redo: `Cmd+Shift+Z`

The shortcut handler should avoid interfering with native inputs and content-editable elements where the browser/editor already handles the event correctly.

## 3. Notion-style slash command menu

Typing `/` should provide commands such as:

- Text
- Heading 1
- Heading 2
- Heading 3
- Bulleted list
- Numbered list
- To-do list
- Toggle list
- Quote
- Callout
- Code
- Divider
- Table
- Image
- Video
- File
- Bookmark
- Link
- Mention
- Date/reminder
- Page/document link
- Equation
- Template
- Synced block

Useful behavior:

- Search commands while typing
- Keyboard navigation with arrow keys
- Enter to select
- Escape to close
- Command categories
- Recent commands
- Fuzzy matching
- Proper positioning near the cursor
- Mobile-friendly command menu

## 4. Real document model

The current prototype can eventually benefit from a formal data model:

```text
Workspace
 ├── Projects
 │    └── Documents
 └── Settings
```

Each document should have:

- Stable ID
- Title
- Icon
- Project ID
- Blocks
- Created date
- Updated date
- Favorite/pinned state
- Archived state
- Trash state
- Optional parent document ID

Each block should have:

- Stable ID
- Type
- Text/content
- Formatting
- Children
- Metadata

Stable IDs are important for persistence, undo/redo, collaboration, and future syncing.

## 5. Project and sidebar functionality

Improve the sidebar with:

- Create project
- Rename project
- Delete/archive project
- Move document between projects
- Drag-and-drop document ordering
- Favorite documents
- Recent documents
- Trash
- Project icons/colors
- Expand/collapse projects
- Context menus
- “New document” inside a specific project
- Empty states

## 6. Search

The current search should become more useful by searching:

- Document titles
- Paragraph content
- Headings
- Code blocks
- Project names

Add:

- Highlighted matches
- Keyboard navigation
- Search result previews
- Recent searches
- Search across archived documents
- A shortcut such as `Ctrl+K` or `Ctrl+P`

## 7. Auto-save and save state

Add a visible but subtle save indicator:

- `Saved`
- `Saving…`
- `Offline`
- `Could not save`

Recommended behavior:

- Debounced saves after edits
- Immediate save when switching documents
- Save before window close
- Recovery after an interrupted save
- No blocking dialogs during normal editing

## 8. Import and export

Useful initial formats:

- Markdown import
- Markdown export
- JSON backup/export
- HTML export
- Plain text export
- PDF export later

Also support:

- Paste Markdown
- Dragging `.md` files into Grapho
- Exporting the current document
- Exporting an entire project

## 9. Keyboard shortcut system

Create a central shortcut registry instead of scattering shortcuts throughout the component.

Shortcuts could include:

- New document
- Search
- Focus mode
- Toggle sidebar
- Toggle theme
- Undo
- Redo
- Save/export
- Open help
- Move block up/down
- Duplicate block
- Delete block
- Add block
- Navigate documents

The help modal should be generated from the same registry so it never becomes outdated.

## 10. Native Tauri integration

For the desktop app, add:

- Native file open/save dialogs
- Open document from the file manager
- Export using native save dialogs
- Window close/save handling
- Native application menu
- System tray support, if useful
- Desktop notifications
- Application data directory storage
- Proper version migration
- RPM update testing
- App icon variants for different sizes

The browser version should continue using browser APIs and local storage.

## 11. Settings

Add a settings screen for:

- Theme
- Font size
- Editor width
- Line height
- Default project
- Default document type
- Autosave behavior
- Keyboard shortcut reference
- Import/export
- Clear local data
- Application version

## 12. Accessibility and usability

Important improvements:

- Full keyboard navigation
- Visible focus states
- ARIA labels for icon buttons
- Proper tooltip text
- Screen-reader labels
- Sufficient color contrast
- Reduced-motion support
- Accessible slash menu
- Accessible dialogs
- Accessible title bar buttons
- Tab navigation that does not trap users unexpectedly

## 13. Testing

Add tests for the most important behavior.

### Persistence

- Loading default documents
- Loading saved documents
- Saving title changes
- Saving content changes
- Creating documents
- Handling malformed storage
- Migrating old storage versions

### Editor

- Markdown shortcuts
- Slash commands
- Formatting
- Block insertion/deletion
- Undo/redo
- Document switching

### UI

- Sidebar filtering
- Project selection
- Search
- Theme switching
- Browser/native title-bar behavior

Also perform manual native tests:

- Close and reopen the RPM-installed app
- Create and edit documents
- Upgrade the RPM
- Confirm documents survive the upgrade
- Confirm browser and Tauri behavior remain different where intended

## Suggested release order

### Release 0.1.2 — Reliability

- Local document persistence
- Auto-save
- Save state
- Recovery from malformed data
- Undo/redo fixes
- Basic tests

### Release 0.2.0 — Editor foundation

- Formal document/block model
- Complete slash command menu
- Better block operations
- Keyboard shortcut registry
- Markdown import/export

### Release 0.3.0 — Workspace features

- Project management
- Trash/archive
- Favorites
- Drag-and-drop ordering
- Full document search
- Recent documents

### Release 0.4.0 — Native desktop features

- Native file dialogs
- Application data storage
- Export flows
- Native menus
- Window lifecycle handling
- Better RPM update behavior

### Release 1.0.0 — Polish

- Accessibility pass
- Comprehensive tests
- Performance improvements
- Documentation
- Backup/import recovery
- Stable migration strategy

## Immediate next implementation

The immediate next implementation should be **local persistence plus auto-save**, followed by a focused fix for the **undo/redo history model**. Those two features are essential before adding more editor functionality.
