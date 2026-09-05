"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const links = [["The canvas", "#canvas"], ["The thinking", "#why"], ["Your words", "#local-first"], ["Open source", "#open-source"]];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    const onPointer = (event: PointerEvent) => { if (!nav.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);
  return (
    <nav className="studio-nav studio-wrap" aria-label="Main navigation" ref={nav}>
      <Link className="studio-wordmark" href="/">grapho<span>_</span></Link>
      <div className="studio-nav-links">{links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</div>
      <Link className="studio-nav-open" href="/app">Start writing <ArrowUpRight size={16} /></Link>
      <button className="studio-menu-toggle" type="button" ref={toggle} aria-expanded={open} aria-controls="studio-mobile-links" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      <div id="studio-mobile-links" className="studio-mobile-links" hidden={!open}>{links.map(([label, href]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={16} /></a>)}<Link href="/app">Start writing <ArrowUpRight size={16} /></Link></div>
    </nav>
  );
}
