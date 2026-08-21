# Grapho UI

Standalone Grapho workspace UI based on the Ergastírio / Kýklos design language.

## Included

- Local-first document workspace shell
- Folder and document sidebar
- Local search field
- Writing canvas with structured blocks
- Floating formatting toolbar
- Style panel
- Focus mode toggle
- Dark/light theme toggle
- Responsive desktop/mobile layout
- Reduced-motion support
- Grapho-local typography and design tokens with Geist Mono/system fallbacks

## Copying into another Next.js project

The UI is organized by responsibility:

- `domain/` — document and block contracts plus seed data.
- `persistence/` — versioned local-storage adapter and validation.
- `features/workspace/` — the client workspace composition and interactions.
- `styles/` — Grapho design tokens, responsive rules, and native-window styles.

Render `features/workspace/GraphoShell` from a client page. The workspace imports its own style entrypoint.

Dependencies already used by the source project:

- `lucide-react`
- `motion`
- Tailwind CSS v4

The component currently uses local React state for UI prototyping. Persistence, Tauri commands, database access, and document services should be connected through props or a separate service layer.
