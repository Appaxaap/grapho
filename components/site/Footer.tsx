import Link from "next/link";
export function Footer() { return <footer className="rebuild-footer"><Link href="/" className="rebuild-brand"><span>G</span> Grapho</Link><div><a href="https://github.com/Appaxaap/grapho">GitHub</a><a href="#open-source">License</a><a href="/app">Download</a></div><small>© {new Date().getFullYear()} Grapho · Open source · Local-first</small></footer>; }
