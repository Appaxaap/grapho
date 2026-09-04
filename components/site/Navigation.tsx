import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";

export function Navigation() {
  return <nav className="rebuild-nav" aria-label="Main navigation"><Link className="rebuild-brand" href="/"><span>G</span> Grapho</Link><div className="rebuild-links"><a href="#why">Why Grapho</a><a href="#writing">Writing</a><a href="#local-first">Local-first</a><a href="#export">Export</a><a href="#open-source">Open source</a></div><a className="rebuild-nav-action" href="https://github.com/Appaxaap/grapho/releases/tag/v1.0.0">Download <ArrowUpRight size={14} /></a><Link className="rebuild-mobile-menu" href="/app" aria-label="Open Grapho"><Menu size={18} /></Link></nav>;
}
