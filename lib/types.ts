import type { Block } from "@blocknote/core";

/** A note (page) as stored in SQLite and held in app state. */
export interface Note {
  id: string;
  title: string;
  /** BlockNote document (array of block JSON). */
  content: Block[];
  createdAt: number;
  updatedAt: number;
  /** Set when the note is in the trash; `null` otherwise. */
  trashedAt: number | null;
  isShared: boolean;
  /** Last time content was flushed to the database. */
  lastSavedAt: number;
}

/** A version-history snapshot of a note. */
export interface Version {
  id: string;
  pageId: string;
  version: number;
  title: string;
  content: Block[];
  createdAt: number;
}

export type AccentName = "neutral" | "blue" | "green" | "gold" | "rainbow";
export type FontName = "inter" | "georgia" | "merriweather" | "mono";
export type PageSize = "A4" | "LETTER" | "LEGAL";
export type Orientation = "portrait" | "landscape";
export type MarginPreset = "normal" | "narrow" | "wide";
export type TemplateName = "minimal" | "modern" | "academic";

export interface ExportSettings {
  pageSize: PageSize;
  orientation: Orientation;
  margins: MarginPreset;
  template: TemplateName;
  header: boolean;
  footer: boolean;
}

export interface AppSettings {
  /** Accent color style — the app is a dark editorial workspace; this picks the single accent hue. */
  accent: AccentName;
  font: FontName;
  export: ExportSettings;
}

export type ViewMode = "notes" | "trash";
