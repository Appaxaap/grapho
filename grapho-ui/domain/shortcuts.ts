export type ShortcutDefinition = {
  id: string;
  label: string;
  keys: string;
  key: string;
  mod?: boolean;
  shift?: boolean;
  action: "new-document" | "new-workspace" | "search" | "focus-mode" | "sidebar" | "theme" | "help";
};

export const SHORTCUTS: ShortcutDefinition[] = [
  { id: "new-document", label: "New document", keys: "Mod+N", key: "n", mod: true, action: "new-document" },
  { id: "new-workspace", label: "New workspace", keys: "Mod+Shift+W", key: "w", mod: true, shift: true, action: "new-workspace" },
  { id: "search", label: "Search documents", keys: "Mod+K", key: "k", mod: true, action: "search" },
  { id: "focus-mode", label: "Toggle focus mode", keys: "Mod+Shift+F", key: "f", mod: true, shift: true, action: "focus-mode" },
  { id: "sidebar", label: "Toggle sidebar", keys: "Mod+\\", key: "\\", mod: true, action: "sidebar" },
  { id: "theme", label: "Toggle theme", keys: "Mod+Shift+L", key: "l", mod: true, shift: true, action: "theme" },
  { id: "help", label: "Open shortcuts", keys: "?", key: "?", action: "help" },
];
