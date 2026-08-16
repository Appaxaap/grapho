import App from "./App";

export function GraphoShell() {
  // Mount the BlockNote-based editor (full Markdown rendering: **bold**, *italic*,
  // # headings, nested emphasis, and paste-to-convert) rather than the plain-text
  // prototype workspace shell, which could not render inline Markdown at all.
  return <App />;
}
