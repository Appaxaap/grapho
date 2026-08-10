/**
 * Copies the sql.js WASM binary into `public/` so the browser build can
 * fetch it at runtime. Run automatically after `npm install` (see the
 * `postinstall` script in package.json).
 */
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
const destDir = join(root, "public");
const dest = join(destDir, "sql-wasm.wasm");

if (!existsSync(src)) {
  console.error(
    `[copy-wasm] Could not find ${src}. Run \`npm install\` first, ` +
      "or reinstall sql.js (`npm install sql.js`)."
  );
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-wasm] Copied sql.js WASM to public/sql-wasm.wasm`);
