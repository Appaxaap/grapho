# Grapho Color Design System

**Version:** 1.0  
**Purpose:** Official color foundation for Grapho  
**Design principle:** Calm, focused, expressive, professional, and ownership-oriented.

## Brand

| Token | Hex | Purpose |
| --- | --- | --- |
| `brand-primary` | `#6BA587` | Grapho identity, primary actions, active states, focus, progress |
| `brand-soft` | `#97BFA6` | Soft brand surfaces and secondary highlights |
| `brand-subtle` | `#CFE8D8` | Selected areas, hover surfaces, callouts |
| `brand-strong` | `#4CAF7D` | Strong interactive and positive states |

Forest Green is Grapho's defining color. It must be used intentionally and must not become a general application background.

## Neutral palette

| Token | Hex | Purpose |
| --- | --- | --- |
| `neutral-charcoal` | `#0E1116` | Primary dark background, primary text, strong headings |
| `neutral-slate` | `#1D232A` | Dark panels, navigation, secondary surfaces |
| `neutral-stone` | `#6B7280` | Metadata, descriptions, supporting text |
| `neutral-fog` | `#E5E7EB` | Borders, dividers, input outlines, disabled surfaces |
| `neutral-paper` | `#F8FAFC` | Light application and document background |

## Accent palette

| Token | Hex | Purpose |
| --- | --- | --- |
| `accent-sage` | `#97BFA6` | Quiet selection and writing emphasis |
| `accent-mint` | `#CFE8D8` | Soft backgrounds, selected surfaces, callouts |
| `accent-sand` | `#EADFC5` | Warm editorial and informational emphasis |
| `accent-sky` | `#A7C5E0` | Informational and reference-related surfaces |

## Semantic palette

| Token | Hex | Purpose |
| --- | --- | --- |
| `semantic-success` | `#4CAF7D` | Saved, completed, exported, positive states |
| `semantic-warning` | `#F0B429` | Warnings, pending attention, unsaved changes |
| `semantic-error` | `#E74C3C` | Errors, invalid input, destructive warnings |
| `semantic-info` | `#3B82F6` | Neutral information and help states |

## Usage rules

- Neutral colors form most of the interface.
- Forest Green is the brand identity and primary interactive accent.
- Sage and Mint form the quiet brand family.
- Sand and Sky provide controlled contextual expression.
- Semantic colors communicate meaning and must not be used decoratively.
- Dark mode uses Charcoal and Slate, not green backgrounds.
- Text hierarchy follows Charcoal/Slate → Stone → disabled Fog.
- Borders use Fog or a token-derived translucent neutral; avoid heavy black borders.
- Use semantic tokens rather than raw hex values in components.
- New colors require an intentional update to this document and the implementation token layer.

## Relationships

```text
Forest Green → Sage → Mint
Charcoal → Slate → Stone → Fog → Paper
Sand + Sky provide restrained expression
Semantic colors communicate system meaning
```

## Implementation mapping

The runtime CSS mapping lives in `grapho-ui/styles/grapho.css` under the `--grapho-*` namespace. Components must consume those semantic variables rather than introducing arbitrary colors.
