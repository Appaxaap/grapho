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

Copy this folder into the target project and render `components/GraphoShell` from a client page. Import `grapho.css` once from the target app's global stylesheet or layout.

Dependencies already used by the source project:

- `lucide-react`
- `motion`
- Tailwind CSS v4

The component currently uses local React state for UI prototyping. Persistence, Tauri commands, database access, and document services should be connected through props or a separate service layer.
