# Grapho UI/UX laws, principles, and rules

This document is the implementation contract for Grapho's interface states. It keeps the product calm, local-first, and predictable instead of treating states as visual decoration.

## Laws

1. **State must be visible.** Every asynchronous or destructive action communicates what is happening, what happened, or what the user can do next.
2. **The primary action stays available.** Empty, filtered, and error states always offer a relevant recovery path without trapping the user.
3. **Never destroy silently.** Deletion and reset require confirmation; destructive controls use clear destructive language and feedback.
4. **Focus follows intent.** Keyboard actions, dialogs, command menus, and editors expose a visible focus target and preserve keyboard escape routes.
5. **Local work is treated as valuable.** Save status is persistent, debounced, and flushed during navigation and window lifecycle events.
6. **The interface must not surprise.** Disabled actions explain unavailability through state, opacity, and accessible labels rather than silently failing.

## Principles

- **Calm density:** secondary controls remain compact; the writing canvas remains the visual priority.
- **Progressive disclosure:** tools appear in the toolbar, style panel, command menu, or dialogs only when relevant.
- **Recovery over blame:** errors offer retry or reset paths and use neutral language.
- **Accessibility parity:** status messages use live regions, controls use labels, and keyboard behavior mirrors pointer behavior.
- **Platform respect:** browser and native window controls remain distinct while sharing the same save guarantees.
- **Reduced motion:** motion is supportive feedback and is disabled/reduced by the existing media rule.

## Implemented UI states

| State | Where | Why |
| --- | --- | --- |
| Saved / saving / save failure | `grapho-ui/components/GraphoShell.tsx`, bottom toolbar | Makes persistence state visible without interrupting writing. Failure includes a Retry action. |
| Save lifecycle flush | `grapho-ui/components/GraphoShell.tsx` | Prevents a pending debounce from losing edits during document/project switching or window close. |
| Empty folder | `grapho-ui/components/GraphoShell.tsx`, document sidebar | Gives the user a direct Create a document action instead of a blank panel. |
| Empty search results | `grapho-ui/components/GraphoShell.tsx`, document sidebar | Explains that filtering returned nothing and provides Clear search. |
| Undo/redo unavailable | `grapho-ui/components/GraphoShell.tsx`, `ToolbarButton` | Disabled controls communicate history boundaries and avoid no-op interactions. |
| Delete confirmation / deleting | `grapho-ui/components/GraphoShell.tsx` | Prevents accidental loss and communicates progress while the operation is active. |
| Invalid backup | `grapho-ui/components/GraphoShell.tsx` | Provides explicit recovery feedback instead of silently rejecting input. |
| Keyboard and dialog escape paths | `grapho-ui/components/GraphoShell.tsx` | Keeps menus and dialogs recoverable without a mouse. |
| Visible focus and reduced motion | `grapho-ui/grapho.css` | Supports keyboard navigation and users with motion sensitivity. |

## Rules for future changes

- Add the idle, pending, success, error, empty, disabled, and destructive states when introducing a new action.
- Every icon-only button needs an accessible `aria-label` and a useful `title`.
- Every modal needs `role="dialog"`, `aria-modal="true"`, a labelled heading, and Escape dismissal.
- Never use color alone to communicate an error or success.
- Do not add blocking confirmation dialogs for routine editing or saving.
- Keep state copy short, concrete, and action-oriented: “Could not save — Retry”, not technical error details.
- Validate state transitions with `npm run build`; manually check keyboard, narrow viewport, dark mode, and native title-bar behavior.
