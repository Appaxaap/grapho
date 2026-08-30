"use client";

import { useEffect, useState, type ReactNode } from "react";

export function LegalTheme({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const readTheme = () => setTheme(window.localStorage.getItem("grapho-theme") === "dark" ? "dark" : "light");
    readTheme();
    window.addEventListener("storage", readTheme);
    return () => window.removeEventListener("storage", readTheme);
  }, []);

  return <div className={`legal-theme legal-theme-${theme}`} data-theme={theme}>{children}</div>;
}
