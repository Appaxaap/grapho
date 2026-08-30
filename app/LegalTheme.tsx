"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export function LegalTheme({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const readTheme = () => setTheme(window.localStorage.getItem("grapho-theme") === "dark" ? "dark" : "light");
    readTheme();
    window.addEventListener("storage", readTheme);
    return () => window.removeEventListener("storage", readTheme);
  }, []);

  const toggleTheme = () => setTheme((current) => {
    const next = current === "dark" ? "light" : "dark";
    window.localStorage.setItem("grapho-theme", next);
    return next;
  });

  return <div className={`legal-theme legal-theme-${theme}`} data-theme={theme}><button className="legal-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Moon size={13} /> : <Sun size={13} />}<span>{theme === "dark" ? "Dark" : "Light"}</span></button>{children}</div>;
}
