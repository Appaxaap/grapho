import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local browser-validation tooling (not app code).
    ".pwtools/**",
    ".pwbrowsers/**",
    // Generated Tauri/Rust output is not application source.
    "src-tauri/target/**",
    "src-tauri/gen/**",
  ]),
]);

export default eslintConfig;
