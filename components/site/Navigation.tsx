import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";

export function Navigation() {
  return <nav className="rebuild-nav" aria-label="Main navigation"><Link className="rebuild-brand" href="/"><span>G</span> Grapho</Link><div className="rebuild-links"><a href="#product">Product</a><a href="#story">Story</a><a href="#open-source">GitHub</a></div><Link className="rebuild-nav-action" href="/app">Download <ArrowUpRight size={14} /></Link><Link className="rebuild-mobile-menu" href="/app" aria-label="Open Grapho"><Menu size={18} /></Link></nav>;
}
