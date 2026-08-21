# Grapho Release Notes

## Current release — Reliability and Native Desktop Foundation

Grapho is now a local-first writing workspace with durable browser/Tauri-compatible document storage, document-level undo/redo, Markdown-friendly editing, PDF export, and a Fedora/Nobara desktop package.

## Highlights

### Local-first document workspace

- Documents are stored locally and remain available after reloads and application restarts.
- New documents can be created from the active project/folder.
- Document titles and content are saved automatically.
- Documents retain their block structure and block types.
- Active document and active folder are restored from local storage.
- Document ordering is retained.
- Projects/folders currently include Projects, Personal, and Archive.
- A collapsible document sidebar is available.
- Document titles can be searched from the sidebar.

### Durable local persistence

- Added versioned local storage using `grapho.workspace.v1`.
- Added validation for stored document data.
- Invalid or malformed stored data falls back to the default workspace.
- Added debounced auto-save.
- Added save-state feedback:
  - Saved
  - Saving…
  - Could not save
- Added JSON backup export through `grapho-backup.json`.
- Added a confirmed reset-local-data action.

### Document editing

- Editable document titles.
- Editable paragraph blocks.
- Heading blocks.
- Quote blocks.
- Bulleted lists.
- Ordered lists.
- Callout blocks.
- Code blocks.
- Tables.
- Dividers.
- Add-block controls.
- Block deletion.
- Block type changes.
- Markdown paste parsing.
- Markdown-style shortcuts for headings, quotes, lists, ordered lists, and code blocks.

### Slash commands

Typing `/` opens the block command menu.

Currently supported block commands include:

- Paragraph/text
- Heading
- Quote
- Bulleted list
- Ordered list
- Callout
- Code
- Table
- Divider

The menu can be dismissed with `Escape`.

The slash menu also supports:

- Command search/filtering
- Basic, Lists, and Advanced categories
- Arrow-key navigation
- Enter to select
- Empty-result feedback

### Search

Sidebar search now searches across:

- Document titles
- Project/folder names
- Paragraphs
- Headings
- Quotes
- Lists
- Code blocks
- Tables
- Other document block content

Search remains scoped to the selected workspace folder.

### Undo and redo

Undo and redo now operate on Grapho document state instead of relying only on browser content-editable history.

Supported shortcuts:

- Linux/Windows: `Ctrl+Z`
- Linux/Windows redo: `Ctrl+Shift+Z` or `Ctrl+Y`
- macOS: `Cmd+Z`
- macOS redo: `Cmd+Shift+Z` or `Cmd+Y`

The bottom toolbar also provides Undo and Redo controls.

History currently supports document edits including:

- Text edits
- Title edits
- New blocks
- Block deletion
- Block type changes
- Paste operations
- Document creation
- Clear-document actions

Redo history is cleared after a new edit, and history is capped at 100 states.

### Formatting and writing tools

- Bold
- Italic
- Underline
- Strikethrough
- Heading formatting
- Quote formatting
- Code formatting
- Link formatting
- Highlighting
- Left and center alignment
- Remove formatting
- Text selection toolbar
- Focus mode
- Theme switching
- Light and dark visual themes
- Persisted theme preference

### PDF export

- PDF export is available through the browser print flow.
- The printed document uses the writing canvas rather than the surrounding application chrome.
- Screen-only overlays are hidden during printing.
- The bottom editor fade is excluded from printed output.
- Print footer spacing prevents branding from covering document content.
- Stray unfinished page-number content is hidden from exported PDFs.
- The `Grapho` print footer branding remains available.

### Native desktop application

- Added a Tauri desktop wrapper.
- Added a custom native title bar.
- Added native minimize, maximize, and close controls.
- Native controls render only inside the Tauri application.
- Browser mode does not reserve space for or display native window controls.
- Disabled default Tauri decorations to support the custom title bar.
- Added native application icon configuration.
- Added Fedora/Nobara RPM packaging.
- Added Debian packaging.
- Configured production desktop builds for RPM and DEB targets.

### Workspace interface

- Grapho-branded workspace shell.
- Icon-based Grapho identity.
- Projects and documents sidebar.
- Document metadata and project context.
- Search field.
- Collapsible sidebar.
- Document style panel.
- Help and shortcuts modal.
- Bottom writing toolbar.
- Responsive browser layout.
- Native desktop layout.
- Reduced-motion support.
- Focus-visible styling.
- Accessible labels on key icon and native window controls.

## Keyboard shortcuts currently available

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo |
| `/` | Open block command menu |
| `Enter` | Create a new block |
| `Shift + Enter` | Create a new line |
| `Escape` | Close menus |
| `# + Space` | Heading shortcut |
| `> + Space` | Quote shortcut |
| `- + Space` | Bulleted-list shortcut |
| `1. + Space` | Ordered-list shortcut |
| `PDF` toolbar action | Export through print |

## Validation completed

- Production Next.js build passed.
- TypeScript compilation passed as part of the production build.
- CSS diagnostics passed for PDF export fixes.
- Tauri native build workflow passed previously for RPM and DEB targets.
- PDF export issues involving the bottom fade and stray `Page` text were fixed.

## Known limitations

The following roadmap items are planned but are not part of this release yet:

- JSON backup import.
- Markdown file import and Markdown export.
- Full-text content search.
- Project creation, renaming, deletion, and document movement.
- Favorites, trash, archive behavior, and recent documents.
- Complete Notion-style slash command catalog and fuzzy search.
- Central keyboard shortcut registry.
- Native file dialogs and native application-data storage.
- Dedicated settings screen.
- Automated persistence, editor, UI, and native packaging tests.
- Full accessibility audit.

## Related documents

- [`GRAPHO_ROADMAP.md`](./GRAPHO_ROADMAP.md) — planned implementation order.
- [`GRAPHO_CHANGELOG.md`](./GRAPHO_CHANGELOG.md) — implementation status and engineering history.
