import type {
  AccentName,
  AppSettings,
  FontName,
  MarginPreset,
  Orientation,
  PageSize,
  TemplateName,
  ThemeMode,
} from "./types";

export const APP_NAME = "Grapho";
export const APP_TAGLINE = "Write freely.";
export const APP_ORIGIN =
  "γράφω (gráphō) — Greek for “I write”; the root behind Grapho.";

/** How long notes stay in the trash before being permanently deleted. */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Maximum version snapshots kept per note. */
export const MAX_VERSIONS_PER_NOTE = 200;

/** Debounce before flushing dirty notes to the database (ms). */
export const SAVE_DEBOUNCE_MS = 800;

/** Throttle for propagating editor changes into React state (ms). */
export const EDITOR_SYNC_THROTTLE_MS = 250;

/**
 * Theme Style — the five accent styles from the inspector. The app is a dark
 * editorial workspace; selecting a style tunes the single accent hue (focus,
 * selection, active states). Every option is a restrained solid tone.
 */
export const ACCENTS: { id: AccentName; label: string; swatch: string }[] = [
  { id: "neutral", label: "Champagne", swatch: "#D4B985" },
  { id: "blue", label: "Blue", swatch: "#3B82F6" },
  { id: "green", label: "Green", swatch: "#34D399" },
  { id: "gold", label: "Gold", swatch: "#F59E0B" },
  { id: "rainbow", label: "Plum", swatch: "#E4D4DF" },
];

/** App theme modes — the editor/system preference unless forced. */
export const THEMES: { id: ThemeMode; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export const FONTS: { id: FontName; label: string; preview: string; className: string }[] = [
  { id: "inter", label: "Inter", preview: "Aa", className: "font-editor-inter" },
  { id: "georgia", label: "Georgia", preview: "Aa", className: "font-editor-georgia" },
  { id: "merriweather", label: "Merriweather", preview: "Aa", className: "font-editor-serif" },
  { id: "mono", label: "JetBrains Mono", preview: "Aa", className: "font-editor-mono" },
];

export const PAGE_SIZES: { id: PageSize; label: string }[] = [
  { id: "A4", label: "A4" },
  { id: "LETTER", label: "Letter" },
  { id: "LEGAL", label: "Legal" },
];

export const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
];

export const MARGIN_PRESETS: { id: MarginPreset; label: string; points: number }[] = [
  { id: "narrow", label: "Narrow", points: 36 },
  { id: "normal", label: "Normal", points: 72 },
  { id: "wide", label: "Wide", points: 96 },
];

export const TEMPLATES: { id: TemplateName; label: string; description: string }[] = [
  { id: "minimal", label: "Minimal", description: "Clean, airy, no frills" },
  { id: "modern", label: "Modern", description: "Sans-serif with accent rules" },
  { id: "academic", label: "Academic", description: "Serif, classic document" },
];

export const DEFAULT_EXPORT: AppSettings["export"] = {
  pageSize: "A4",
  orientation: "portrait",
  margins: "normal",
  template: "modern",
  header: true,
  footer: true,
};

export const DEFAULT_SETTINGS: AppSettings = {
  accent: "neutral",
  font: "georgia",
  theme: "system",
  export: DEFAULT_EXPORT,
};

export const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Cmd/Ctrl + N", action: "New note" },
  { keys: "Cmd/Ctrl + E", action: "Export to PDF" },
  { keys: "Cmd/Ctrl + Shift + E", action: "Insert emoji" },
  { keys: "Cmd/Ctrl + F", action: "Search notes" },
  { keys: "Cmd/Ctrl + H", action: "Version history" },
  { keys: "Cmd/Ctrl + Delete", action: "Move note to trash" },
  { keys: "Cmd/Ctrl + 1", action: "My Notes" },
  { keys: "Cmd/Ctrl + 2", action: "Trash" },
  { keys: "Cmd/Ctrl + Shift + T", action: "Cycle accent style" },
  { keys: "Cmd/Ctrl + Z", action: "Undo (editor)" },
  { keys: "Cmd/Ctrl + Shift + Z", action: "Redo (editor)" },
  { keys: "Esc", action: "Close modal / dismiss menu" },
];
