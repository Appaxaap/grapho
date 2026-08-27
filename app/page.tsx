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
        <Link className="site-brand" href="/" aria-label="Grapho home">
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

      <section className="studio-hero" aria-labelledby="hero-title">
        <div className="studio-copy">
          <div className="site-eyebrow"><span className="site-dot" /> A focused writing studio</div>
          <h1 id="hero-title">Write the thing<br />you came to <em>make.</em></h1>
          <p>Grapho gives ideas a quiet place to become clear, structured, and ready to share—without turning writing into workspace management.</p>
          <div className="site-actions"><Link className="site-button site-button-primary" href="/app">Start writing <ArrowRight size={16} /></Link><a className="site-button site-button-quiet" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={15} /> View source</a></div>
          <div className="site-hero-note"><LockKeyhole size={13} /> Local-first. No account required.</div>
        </div>
        <div className="studio-artifact" aria-label="A finished document made in Grapho">
          <div className="studio-paper-meta"><span>GRAPHO / ESSAY</span><span>04 · 18 · 2026</span></div>
          <div className="studio-paper-kicker">A NOTE ON FINISHING</div>
          <h2>Ideas become useful<br />when they leave<br />the notebook.</h2>
          <p>Writing is not only a way to remember. It is a way to shape a thought until another person can hold it.</p>
          <blockquote>Make the structure quiet.<br />Make the meaning clear.</blockquote>
          <div className="studio-paper-footer"><span>Ready to share</span><span>01</span></div>
        </div>
      </section>

      <section className="site-section" id="features" aria-labelledby="features-title"><div className="site-section-heading"><span className="site-eyebrow">The whole workflow</span><h2 id="features-title">From blank page<br />to finished document.</h2></div><div className="site-feature-grid">{features.map(([title, copy, Icon]) => <article className="site-feature" key={title}><span className="site-feature-icon"><Icon size={17} /></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

      <section className="site-principles" id="principles" aria-labelledby="principles-title"><div><span className="site-eyebrow">A quieter kind of software</span><h2 id="principles-title">Don&apos;t manage your knowledge.<br /><em>Make something with it.</em></h2></div><div className="site-capabilities">{capabilities.map((item) => <div key={item}><Check size={14} /> {item}</div>)}</div></section>

      <section className="site-open" id="open-source" aria-labelledby="open-title"><div><span className="site-eyebrow">Built in the open</span><h2 id="open-title">Your tools should<br />belong to you.</h2><p>Grapho is local-first, privacy-minded, and developed publicly. Read the code, understand the storage model, and help shape a focused writing tool.</p></div><div className="site-open-actions"><Link className="site-button site-button-primary" href="/app">Open the app <ArrowRight size={16} /></Link><a className="site-button site-button-quiet" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={16} /> View source</a></div></section>

      <footer className="site-footer"><span>© {new Date().getFullYear()} Grapho</span><span>Local-first · made for finished work</span><div className="site-footer-links"><Link href="/app">Open app</Link><a href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer">GitHub <ArrowRight size={13} /></a></div></footer>
    </main>
  );
}
