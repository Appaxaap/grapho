import Link from "next/link";
import { ArrowRight, Check, GitBranch, LockKeyhole, Menu, PenLine, Sparkles, WandSparkles } from "lucide-react";
import "./site.css";

const features = [
  ["Write without friction", "A calm, structured canvas that gets out of the way while you think.", PenLine],
  ["Organize simply", "Projects, workspaces, documents, and nested blocks—without database ceremony.", Sparkles],
  ["Deliver with confidence", "Export meaningful documents to Markdown, HTML, plain text, and PDF.", WandSparkles],
] as const;

const capabilities = ["Structured blocks", "Rich text formatting", "Markdown import and export", "Local full-text search", "Document backlinks", "Print-ready PDF export"];

export default function PublicSite() {
  return (
    <main className="site-shell">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="site-brand" href="/site" aria-label="Grapho home">
          <span className="site-mark"><img src="/Branding/png-logo.png" alt="" /></span>
          <span>Grapho</span>
        </Link>
        <div className="site-nav-links">
          <a href="#features">Features</a>
          <a href="#principles">Principles</a>
          <a href="#open-source">Open source</a>
          <a className="site-github" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={14} /> GitHub</a>
        </div>
        <button className="site-menu" type="button" aria-label="Open navigation menu" title="Open navigation menu"><Menu size={18} /></button>
      </nav>

      <section className="site-hero" aria-labelledby="hero-title">
        <div className="site-eyebrow"><span className="site-dot" /> A focused writing studio</div>
        <h1 id="hero-title">Make something<br /><em>worth sharing.</em></h1>
        <p className="site-hero-copy">Grapho is a modern, local-first writing app for turning blank pages into finished documents.</p>
        <div className="site-actions"><a className="site-button site-button-primary" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer">Explore on GitHub <ArrowRight size={16} /></a><a className="site-button site-button-quiet" href="#features">See what it does</a></div>
        <div className="site-hero-note"><LockKeyhole size={13} /> Your writing stays on your machine.</div>
      </section>

      <section className="site-editor-preview" aria-label="Grapho writing workspace preview">
        <div className="preview-sidebar"><div className="preview-sidebar-head"><span className="site-mark small"><img src="/Branding/png-logo.png" alt="" /></span><span>Library</span><span className="preview-plus">+</span></div><div className="preview-search">⌕ &nbsp; Search documents</div><div className="preview-label">Workspace</div><div className="preview-folder active">▾ &nbsp; Projects</div><div className="preview-folder">▸ &nbsp; Personal</div><div className="preview-folder">▸ &nbsp; Archive</div></div>
        <div className="preview-canvas"><div className="preview-meta">PROJECTS &nbsp; / &nbsp; PRODUCT NOTES</div><div className="preview-kicker">DOCUMENT · MARKDOWN COMPATIBLE</div><h2>A clear place<br />to think.</h2><p className="preview-line">Write naturally. Grapho keeps the structure out of your way.</p><div className="preview-block"><span className="preview-check">✓</span><span>Ship a document that feels finished</span></div><div className="preview-block muted">Start writing here…</div></div>
      </section>

      <section className="site-section" id="features" aria-labelledby="features-title"><div className="site-section-heading"><span className="site-eyebrow">The whole workflow</span><h2 id="features-title">From blank page<br />to finished document.</h2></div><div className="site-feature-grid">{features.map(([title, copy, Icon]) => <article className="site-feature" key={title}><span className="site-feature-icon"><Icon size={17} /></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

      <section className="site-principles" id="principles" aria-labelledby="principles-title"><div><span className="site-eyebrow">A quieter kind of software</span><h2 id="principles-title">Don&apos;t manage your knowledge.<br /><em>Make something with it.</em></h2></div><div className="site-capabilities">{capabilities.map((item) => <div key={item}><Check size={14} /> {item}</div>)}</div></section>

      <section className="site-open" id="open-source" aria-labelledby="open-title"><div><span className="site-eyebrow">Built in the open</span><h2 id="open-title">Your tools should<br />belong to you.</h2><p>Grapho is local-first, privacy-minded, and developed publicly. Read the code, understand the storage model, and help shape a focused writing tool.</p></div><a className="site-button site-button-primary" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={16} /> View the project <ArrowRight size={16} /></a></section>

      <footer className="site-footer"><span>© {new Date().getFullYear()} Grapho</span><span>Local-first · made for finished work</span><a href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer">GitHub <ArrowRight size={13} /></a></footer>
    </main>
  );
}
