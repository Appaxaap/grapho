import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";

export function Navigation() {
  return <nav className="rebuild-nav" aria-label="Main navigation"><Link className="rebuild-brand" href="/"><span>G</span> Grapho</Link><div className="rebuild-links"><a href="#why">Why Grapho</a><a href="#writing">Writing</a><a href="#local-first">Local-first</a><a href="#export">Export</a><a href="#open-source">Open source</a></div><a className="rebuild-nav-action" href="https://github.com/Appaxaap/grapho/releases/tag/v1.0.0">Download <ArrowUpRight size={14} /></a><details className="rebuild-mobile-menu"><summary aria-label="Open navigation"><Menu size={18} /></summary><div><a href="#why">Why Grapho</a><a href="#writing">Writing</a><a href="#local-first">Local-first</a><a href="#export">Export</a><a href="#open-source">Open source</a><a href="https://github.com/Appaxaap/grapho/releases/tag/v1.0.0">Download</a></div></details></nav>;
}
