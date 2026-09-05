# Grapho writing studio

The public landing page now uses a dark, type-led writing studio. It replaces the paper/zine treatment with the existing Charcoal, Slate, Sage, and Forest Green palette. Rules, typography specimens, a live canvas, a document index, and an export composition form the page.

## Font correction

The previous landing used variables scoped to `.grapho-ui` without that ancestor. The new `.studio` root defines its own complete font tokens and explicitly loads the bundled Geist Mono font.

- Default and interface: local Grapho Geist Mono.
- Sans specimen: locally installed Inter Variable.
- Mono specimen: the existing workspace stack, including system fallbacks. JetBrains Mono is not bundled.
- Serif specimen: Georgia.

Chromium's actual font inspection reported `Geist Mono / GeistMono-Regular / isCustomFont: true` for the headline.

The writing sample is editable, offers all four font choices, preserves text across switches, counts words, supports reset, and explicitly explains that its contents are temporary.

## Playful details

Existing Caveat handwriting and SVG illustrations add sage margin notes, a drawn underline, and arrows around the canvas and export story. A keyboard/touch-accessible prompt button cycles writing ideas without replacing the visitor's text. The offline section includes a paper airplane that flies when activated and announces its result. Reduced motion shows a static result. Browser checks cover prompt cycling, text preservation, flight activation, and reduced-motion animation suppression, alongside the responsive checks below.

## Validation

- TypeScript passes.
- ESLint: no errors, 11 existing warnings outside the changed components.
- Browser: no runtime errors; editing, switching, reset, mobile anchor dismissal, Escape dismissal, and reduced motion pass.
- Widths checked: 1920, 1600, 1440, 1280, 1024, 430, 390, and 375px. Neither the document nor the canvas overflows horizontally.
- Production build attempted: blocked by Turbopack's internal process/port binding error, `Operation not permitted`. Production completion is not claimed.
- Changes are scoped to the public landing. No workspace or Tauri window behavior is changed.

The corresponding public-landing rules in the locally ignored `GRAPHO_DESIGN_SYSTEM.md` have been updated. Screenshots in this folder show the desktop hero, mobile hero/canvas, and font specimens.
