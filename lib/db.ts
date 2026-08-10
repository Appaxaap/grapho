import type { Database } from "sql.js";
import type { Block } from "@blocknote/core";
import type { AppSettings, Note, Version } from "./types";
import { DEFAULT_SETTINGS, MAX_VERSIONS_PER_NOTE, TRASH_RETENTION_MS } from "./constants";
import { markdownToBlocks } from "./markdown";
import { sanitizeBlocks } from "./sanitize";
import { uuid } from "./utils";

/* ------------------------------------------------------------------ *
 * IndexedDB persistence (the sql.js "file" is stored here)
 * ------------------------------------------------------------------ */

const IDB_NAME = "grapho";
const IDB_STORE = "kv";
const IDB_FILE_KEY = "sqlite-file";

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<Uint8Array | undefined> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as Uint8Array | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: Uint8Array): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ------------------------------------------------------------------ *
 * SQLite schema + seeding
 * ------------------------------------------------------------------ */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS pages (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL DEFAULT 'Untitled',
  content    TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  trashed_at INTEGER,
  is_shared  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS versions (
  id         TEXT PRIMARY KEY,
  page_id    TEXT NOT NULL,
  version    INTEGER NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_versions_page ON versions(page_id, version DESC);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const WELCOME_MARKDOWN = `# Welcome to Grapho ✨

Write freely.

Grapho is a lightning-fast, offline-first note-taking app. Everything you write is saved locally on your device — instantly, privately, and forever.

## Get started

- **Create a note** — press \`Cmd/Ctrl + N\` or click "New Note" in the sidebar
- **Write with Markdown** — try \`#\` headings, \`-\` bullets, \`1.\` numbered lists, \`>\` quotes, and \`---\` dividers
- **Format as you type** — select text for bold, italic, links, and more
- **Never lose a draft** — every change is versioned (\`Cmd/Ctrl + H\`)
- **Export anytime** — turn any note into a beautiful PDF (\`Cmd/Ctrl + E\`)

> "The pen is the tongue of the mind." — Miguel de Cervantes

_Everything stays on this device. No accounts, no cloud, no tracking._`;

function parseBlocks(json: string): Block[] {
  try {
    // Sanitize on the way out of SQLite so damaged/legacy content can never
    // crash the editor (see lib/sanitize.ts). Every consumer — editor,
    // history, search, PDF export — sees loadable blocks.
    return sanitizeBlocks(JSON.parse(json));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Database lifecycle
 * ------------------------------------------------------------------ */

let dbPromise: Promise<Database> | null = null;

export async function openDatabase(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
      const saved = await idbGet(IDB_FILE_KEY);
      const db =
        saved && saved.byteLength > 0 ? new SQL.Database(saved) : new SQL.Database();
      db.run("PRAGMA foreign_keys = ON;");
      db.run(SCHEMA);
      seedIfNeeded(db);
      return db;
    })();
  }
  return dbPromise;
}

function seedIfNeeded(db: Database) {
  const seeded = db.exec("SELECT value FROM meta WHERE key = 'seeded'");
  if (seeded.length > 0 && seeded[0].values.length > 0) return;

  const now = Date.now();
  const id = uuid();
  const title = "Welcome to Grapho ✨";
  const content = JSON.stringify(markdownToBlocks(WELCOME_MARKDOWN));
  db.run(
    "INSERT INTO pages (id, title, content, created_at, updated_at, trashed_at, is_shared) VALUES (?, ?, ?, ?, ?, NULL, 0)",
    [id, title, content, now, now]
  );
  db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')");
  db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', '1')");
  db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('app_version', '0.1.0')");
}

/** Export the in-memory SQLite database to IndexedDB. */
export async function flushDatabase(): Promise<void> {
  const db = await openDatabase();
  const data = db.export();
  await idbPut(IDB_FILE_KEY, data);
}

/* ------------------------------------------------------------------ *
 * Pages
 * ------------------------------------------------------------------ */

const NOTE_COLUMNS =
  "id, title, content, created_at, updated_at, trashed_at, is_shared";

function rowToNote(row: unknown[]): Note {
  return {
    id: row[0] as string,
    title: row[1] as string,
    content: parseBlocks(row[2] as string),
    createdAt: row[3] as number,
    updatedAt: row[4] as number,
    trashedAt: row[5] as number | null,
    isShared: (row[6] as number) === 1,
    lastSavedAt: 0,
  };
}

export async function loadAllNotes(): Promise<Note[]> {
  const db = await openDatabase();
  const res = db.exec(`SELECT ${NOTE_COLUMNS} FROM pages ORDER BY updated_at DESC`);
  if (res.length === 0) return [];
  return res[0].values.map(rowToNote);
}

/** Upsert a page and snapshot a new version when content/title changed. */
export async function savePage(note: Note): Promise<void> {
  const db = await openDatabase();
  const contentJson = JSON.stringify(note.content);
  const now = Date.now();

  db.run(
    `INSERT INTO pages (id, title, content, created_at, updated_at, trashed_at, is_shared)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       content = excluded.content,
       updated_at = excluded.updated_at,
       trashed_at = excluded.trashed_at,
       is_shared = excluded.is_shared`,
    [note.id, note.title, contentJson, note.createdAt, now, note.trashedAt, note.isShared ? 1 : 0]
  );

  const latest = db.exec(
    "SELECT content FROM versions WHERE page_id = ? ORDER BY version DESC, created_at DESC LIMIT 1",
    [note.id]
  );
  const latestJson = latest.length > 0 ? (latest[0].values[0][0] as string) : null;
  const changed = latestJson === null || latestJson !== contentJson;

  if (changed) {
    const versionRow = db.exec(
      "SELECT COALESCE(MAX(version), 0) + 1 FROM versions WHERE page_id = ?",
      [note.id]
    );
    const nextVersion = versionRow[0].values[0][0] as number;
    db.run(
      "INSERT INTO versions (id, page_id, version, title, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [uuid(), note.id, nextVersion, note.title, contentJson, now]
    );
    db.run(
      `DELETE FROM versions WHERE page_id = ? AND id NOT IN (
         SELECT id FROM versions WHERE page_id = ? ORDER BY created_at DESC, version DESC LIMIT ?
       )`,
      [note.id, note.id, MAX_VERSIONS_PER_NOTE]
    );
  }
}

export async function trashPage(id: string, trashedAt: number): Promise<void> {
  const db = await openDatabase();
  db.run("UPDATE pages SET trashed_at = ?, updated_at = ? WHERE id = ?", [trashedAt, trashedAt, id]);
}

export async function restorePage(id: string): Promise<void> {
  const db = await openDatabase();
  db.run("UPDATE pages SET trashed_at = NULL, updated_at = ? WHERE id = ?", [Date.now(), id]);
}

/** Permanently delete a page and its versions. */
export async function deletePage(id: string): Promise<void> {
  const db = await openDatabase();
  db.run("DELETE FROM versions WHERE page_id = ?", [id]);
  db.run("DELETE FROM pages WHERE id = ?", [id]);
}

/** Permanently delete notes that have been in the trash past the retention window. */
export async function purgeOldTrash(): Promise<number> {
  const db = await openDatabase();
  const cutoff = Date.now() - TRASH_RETENTION_MS;
  const res = db.exec("SELECT id FROM pages WHERE trashed_at IS NOT NULL AND trashed_at < ?", [cutoff]);
  const ids = res.length > 0 ? (res[0].values.map((r) => r[0] as string) as string[]) : [];
  for (const id of ids) {
    await deletePage(id);
  }
  return ids.length;
}

/* ------------------------------------------------------------------ *
 * Versions
 * ------------------------------------------------------------------ */

export async function loadVersions(pageId: string): Promise<Version[]> {
  const db = await openDatabase();
  const res = db.exec(
    "SELECT id, page_id, version, title, content, created_at FROM versions WHERE page_id = ? ORDER BY version DESC",
    [pageId]
  );
  if (res.length === 0) return [];
  return res[0].values.map((row) => ({
    id: row[0] as string,
    pageId: row[1] as string,
    version: row[2] as number,
    title: row[3] as string,
    content: parseBlocks(row[4] as string),
    createdAt: row[5] as number,
  }));
}

export async function getVersion(id: string): Promise<Version | null> {
  const db = await openDatabase();
  const res = db.exec(
    "SELECT id, page_id, version, title, content, created_at FROM versions WHERE id = ?",
    [id]
  );
  if (res.length === 0 || res[0].values.length === 0) return null;
  const row = res[0].values[0];
  return {
    id: row[0] as string,
    pageId: row[1] as string,
    version: row[2] as number,
    title: row[3] as string,
    content: parseBlocks(row[4] as string),
    createdAt: row[5] as number,
  };
}

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */

export async function loadSettings(): Promise<AppSettings> {
  const db = await openDatabase();
  const res = db.exec("SELECT key, value FROM settings");
  if (res.length === 0) return DEFAULT_SETTINGS;
  const map = new Map(res[0].values.map((r) => [r[0] as string, r[1] as string]));
  return {
    accent: (map.get("accent") as AppSettings["accent"]) ?? DEFAULT_SETTINGS.accent,
    font: (map.get("font") as AppSettings["font"]) ?? DEFAULT_SETTINGS.font,
    export: {
      ...DEFAULT_SETTINGS.export,
      ...(map.has("export") ? (JSON.parse(map.get("export")!) as AppSettings["export"]) : {}),
    },
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDatabase();
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('accent', ?)", [settings.accent]);
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('font', ?)", [settings.font]);
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('export', ?)", [
    JSON.stringify(settings.export),
  ]);
}
