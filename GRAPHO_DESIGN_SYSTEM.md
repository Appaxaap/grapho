# Grapho Design System

This document defines the visual and interaction language for Grapho across the browser and Tauri desktop application. It is the reference for designing new screens, components, states, and native surfaces.

## 1. Product character

Grapho should feel:

- **Quiet:** the writing surface is the primary visual focus.
- **Premium:** depth comes from restrained translucency, soft borders, layered shadows, and deliberate spacing—not excessive decoration.
- **Local-first:** save state and recovery are visible without becoming intrusive.
- **Structured:** navigation, tools, and content have clear hierarchy.
- **Confident:** controls are predictable, responsive, and never silently fail.

Avoid:

- Generic dashboard styling.
- Excessive gradients or saturated accents.
- Unexplained icon-only actions.
- Duplicating the same action across toolbars.
- Blocking dialogs for routine operations.
- Color-only status communication.

## 2. Design tokens

The canonical CSS tokens live in `grapho-ui/styles/grapho.css` under the `--grapho-*` namespace.

### Surfaces

| Token | Purpose |
| --- | --- |
| `--grapho-background` | Main application canvas. |
| `--grapho-panel` | Translucent panels and floating surfaces. |
| `--grapho-panel-solid` | Dialogs and surfaces requiring a stable background. |
| `--grapho-control` | Quiet control background. |
| `--grapho-control-hover` | Hover and selected-control background. |
| `--grapho-border` | Low-contrast structural border. |

Light mode uses a warm neutral canvas. Dark mode uses near-black surfaces with slightly lifted panels. New surfaces must use the existing tokens rather than introducing arbitrary colors.

### Content colors

| Token | Purpose |
| --- | --- |
| `--grapho-foreground` | Primary text and high-emphasis controls. |
| `--grapho-muted` | Supporting text and secondary controls. |
| `--grapho-faint` | Metadata, labels, hints, and inactive decoration. |
| `--grapho-accent` | Focus, active editing, links, and primary emphasis. |
| `--grapho-accent-soft` | Selection, callout, and active-block background. |

Destructive actions may use red as a semantic exception. Success, pending, and error states must include text or an icon in addition to color.

### Typography

- UI text uses the project font stack defined by `--grapho-font` and `--grapho-font-sans`.
- Editor text uses a readable body size and relaxed line height.
- Labels use small uppercase text with increased tracking.
- Titles use tight tracking and strong hierarchy.
- Metadata is intentionally quiet and must not compete with document content.
- Do not introduce a second display typeface without a documented product reason.

### Shape and depth

- Small controls: rounded corners, compact padding.
- Floating tools: rounded-xl to rounded-2xl.
- Dialogs and major panels: rounded-3xl.
- Native window surface: rounded 18px when transparent composition is available.
- Glass surfaces use `grapho-glass`, translucent panels, backdrop saturation, low-contrast borders, and layered shadows.
- Shadows should separate layers, not create a heavy card-based dashboard.

## 3. Layout principles

### Workspace hierarchy

```text
Native title bar (Tauri only)
  ↓
Application toolbar
  ↓
Sidebar + writing canvas
  ↓
Contextual editing toolbar
```

- The writing canvas owns the largest uninterrupted area.
- The sidebar is a navigation tool, not a second content canvas.
- Top-toolbar actions are workspace-level and secondary.
- Bottom-toolbar actions are contextual editing/document actions.
- An action must have one canonical toolbar location.

### Spacing

Use the existing Tailwind spacing scale and prefer consistent rhythm over one-off pixel values:

- `2–4px`: icon internals and separators.
- `8px`: compact control gaps.
- `12–16px`: control padding and panel internals.
- `20–24px`: section separation.
- `32px+`: major canvas and modal separation.

## 4. Component contracts

### Buttons

Every button must define:

- Resting state.
- Hover state.
- Active/pressed state.
- Focus-visible state.
- Disabled state when unavailable.
- Busy state when asynchronous.
- Accessible label for icon-only buttons.

Use `ToolbarButton` for compact icon actions unless the action needs a dedicated visual treatment.

Primary buttons are reserved for the main action of a surface. Destructive buttons must use explicit labels such as `Delete document`, never only a trash icon in a confirmation dialog.

### Toolbars

- Keep toolbars compact and horizontally scrollable on narrow screens.
- Group related actions with separators.
- Do not duplicate actions between top and bottom toolbars.
- Keep destructive actions visually separated from creation and formatting actions.
- Show save state in the toolbar or an adjacent persistent status surface.

### Dialogs

Every dialog must provide:

- A blurred/dimmed backdrop.
- A glass or solid readable surface.
- `role="dialog"` and `aria-modal="true"`.
- A labelled heading.
- Escape dismissal unless an operation is actively destructive or pending.
- A visible cancel path.
- A pending state that keeps the dialog open until completion.
- A success or error result after completion.

Destructive dialogs must not disappear immediately after confirmation. They must show a spinner and a clear pending label such as `Deleting…`.

### Toasts and status messages

- Use `role="status"` and `aria-live="polite"` for non-critical updates.
- Keep copy short and action-oriented.
- Pending notifications show progress and cannot be dismissed prematurely.
- Completed notifications may be dismissed.
- Errors must provide a recovery action when one exists, such as `Retry`.

### Empty states

Every empty state must answer:

1. What is empty?
2. Why is it empty, if known?
3. What is the next useful action?

Examples:

- Empty folder → `Create a document`.
- Empty search → `Clear search`.
- Invalid import → choose another backup or retry.

## 5. Interaction states

All asynchronous actions follow this state model:

```text
idle → pending → success
              ↘ error → retry or recovery
```

Required examples:

- Save: `Saved`, `Saving…`, `Could not save — Retry`.
- Delete: confirmation → `Deleting…` → `Document deleted`.
- Import: `Importing backup…` → `Backup imported` or validation error.
- Export: `Exporting…` → export-ready confirmation.
- Reset: confirmation → `Resetting local data…` → completion.

While pending:

- Prevent duplicate submission.
- Disable conflicting actions.
- Keep the operation surface visible.
- Do not silently mutate or close the surface.

## 6. Accessibility rules

- Use semantic buttons, inputs, headings, sections, and dialogs.
- Every icon-only button requires `aria-label` and a useful `title`.
- Use `aria-pressed` for toggles.
- Use `aria-busy` for active operations.
- Use live regions for save and operation feedback.
- Never remove visible focus without providing an equivalent focus state.
- Maintain sufficient contrast in both themes.
- Support keyboard Escape for menus and dialogs.
- Support reduced motion through the existing `prefers-reduced-motion` rule.
- Do not rely on hover-only controls for essential actions.

## 7. Browser and Tauri behavior

### Browser

- No native title bar or window controls.
- Use browser viewport layout and browser lifecycle events.
- Use browser download and print APIs for export.
- Keep the application surface fully opaque and responsive.

### Tauri desktop

- Use the custom native title bar only when `is-native-window` is active.
- Native title bar uses macOS-style traffic-light controls:
  - Red: close.
  - Yellow: minimize.
  - Green: maximize/restore.
- Native window controls must remain accessible and must have explicit Tauri capabilities.
- Native title-bar dragging must be permissioned through `core:window:allow-start-dragging`.
- Transparent composition and rounded clipping are native-only enhancements.
- Native layout must offset the title bar before positioning the sidebar and application toolbar.

## 8. Responsive rules

- The writing canvas remains usable without the sidebar.
- Floating toolbars may scroll horizontally rather than wrapping into unreadable rows.
- Dialogs use viewport padding and a maximum readable width.
- Touch targets should remain comfortably tappable.
- Do not allow the native title bar or modal backdrops to cover interactive content.

## 9. Implementation checklist

Before adding a component:

- What layer owns it?
- Is the action already available elsewhere?
- What are its idle, pending, success, error, empty, and disabled states?
- What is its keyboard behavior?
- What is its narrow-viewport behavior?
- Does it work in both browser and Tauri modes?
- Does it use existing tokens and component patterns?
- Does it need a changelog or roadmap update?

Before merging:

- Run `npm run build`.
- Run `npm run tauri:build` for native changes.
- Test dark and light themes.
- Test keyboard focus and Escape behavior.
- Test reduced motion.
- Test operation feedback and failure recovery.
- Commit the logical change separately and push it separately.
