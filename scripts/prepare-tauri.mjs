import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const outputDirectory = resolve("out");
const appEntry = resolve(outputDirectory, "app", "index.html");
const desktopEntry = resolve(outputDirectory, "index.html");

if (!existsSync(appEntry)) {
  throw new Error(`Expected desktop entry was not generated: ${appEntry}`);
}

copyFileSync(appEntry, desktopEntry);
console.log("Prepared Tauri entry: out/index.html -> Grapho workspace");
