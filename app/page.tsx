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
          <a href="#philosophy">Philosophy</a>
          <a href="#open-source">Open source</a>
          <Link className="site-github" href="/app">Download Grapho <ArrowRight size={14} /></Link>
        </div>
        <Link className="site-menu" href="/app" aria-label="Open Grapho" title="Open Grapho"><Menu size={18} /></Link>
      </nav>

      <section className="studio-hero" aria-labelledby="hero-title">
        <div className="studio-copy">
          <div className="site-eyebrow"><span className="site-dot" /> A focused writing studio</div>
          <h1 id="hero-title">Write something<br /><em>worth sharing.</em></h1>
          <p>A beautiful, local-first writing app for turning ideas into finished documents. Write without distractions, organize naturally, and export work that looks as good as it reads.</p>
          <div className="site-actions"><Link className="site-button site-button-primary" href="/app">Start writing <ArrowRight size={16} /></Link><a className="site-button site-button-quiet" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={15} /> View source</a></div>
          <div className="site-hero-note"><LockKeyhole size={13} /> Open source · local-first · no account required</div>
        </div>
        <div className="cinema-stage" aria-label="Grapho desktop writing experience">
          <div className="cinema-window-bar"><span className="cinema-lights"><i /><i /><i /></span><span>Product Brief</span><span>Saved locally</span></div>
          <div className="cinema-workspace">
            <aside><div className="cinema-library">Library <b>+</b></div><div className="cinema-search">Search documents</div><small>WORKSPACE</small><div className="cinema-folder active">Projects <span>3</span></div><div className="cinema-folder">Personal <span>1</span></div><small>PROJECTS</small><div className="cinema-document active">Product Brief</div><div className="cinema-document">Launch notes</div></aside>
            <article><div className="cinema-meta">PROJECTS / PRODUCT BRIEF</div><div className="cinema-kicker">DOCUMENT · READY TO SHARE</div><h2>Build a quieter<br />way to write.</h2><p>A focused document experience for turning a clear idea into work another person can use.</p><h3>What matters</h3><ul><li>Writing stays in the foreground</li><li>Structure remains understandable</li><li>The finished document travels well</li></ul><div className="cinema-callout">Your workspace. Your documents. Your computer.</div></article>
          </div>
          <div className="cinema-toolbar"><span>Saved</span><i /> <b>B</b><em>I</em><span>H</span><span>↗</span></div>
        </div>
      </section>

      <section className="site-ownership" aria-labelledby="ownership-title"><div className="ownership-copy"><span className="site-eyebrow"><span className="site-dot" /> Local by design</span><h2 id="ownership-title">Your writing has<br />a home. <em>Yours.</em></h2><p>Grapho keeps the document close to you—from the first line to the finished export. No connection is required to open, edit, organize, or deliver your work.</p><div className="ownership-principles"><span>Local storage</span><span>Offline editing</span><span>Portable exports</span></div></div><div className="ownership-flow" aria-label="A document moving through a local Grapho workflow"><div className="ownership-machine"><span className="ownership-machine-top"><i /><i /><i /><b>grapho.local</b></span><div className="ownership-file"><small>PRODUCT BRIEF</small><strong>A clearer way<br />to write.</strong><span>Saved on this computer</span></div></div><div className="ownership-path"><span>WRITE</span><i /><span>KEEP</span><i /><span>EXPORT</span></div></div></section>

      <section className="site-section" id="features" aria-labelledby="features-title"><div className="site-section-heading"><span className="site-eyebrow">The whole workflow</span><h2 id="features-title">From blank page<br />to finished document.</h2></div><div className="site-feature-grid">{features.map(([title, copy, Icon]) => <article className="site-feature" key={title}><span className="site-feature-icon"><Icon size={17} /></span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

      <section className="site-problem" aria-labelledby="problem-title"><div><span className="site-eyebrow">A focused alternative</span><h2 id="problem-title">Writing shouldn&apos;t feel like managing software.</h2><p>Sometimes you just want to sit down and write. Grapho keeps the interface focused on the document—not everything around it.</p></div><div className="site-less-more"><div><span>Less</span><p>Dashboards<br />Databases<br />Configuration<br />Distractions</p></div><div><span>More</span><p>Writing<br />Structure<br />Beautiful documents<br />Ownership</p></div></div></section>

      <section className="site-principles" id="philosophy" aria-labelledby="principles-title"><div><span className="site-eyebrow">A quieter kind of software</span><h2 id="principles-title">Don&apos;t manage your knowledge.<br /><em>Make something with it.</em></h2></div><div className="site-capabilities">{capabilities.map((item) => <div key={item}><Check size={14} /> {item}</div>)}</div></section>

      <section className="site-open" id="open-source" aria-labelledby="open-title"><div><span className="site-eyebrow">Built in the open</span><h2 id="open-title">Built in the open.<br /><em>Made to belong to you.</em></h2><p>Grapho is local-first, privacy-minded, and developed publicly. Read the code, understand the storage model, and help shape a focused writing tool.</p></div><div className="site-open-actions"><Link className="site-button site-button-primary" href="/app">Open the app <ArrowRight size={16} /></Link><a className="site-button site-button-quiet" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={16} /> View source</a></div></section>

      <section className="site-final-cta" aria-labelledby="final-title"><span className="site-eyebrow">From blank page to finished document</span><h2 id="final-title">Make something<br /><em>with Grapho.</em></h2><p>A quiet place to write. A simple way to organize. A better way to deliver.</p><div className="site-actions"><Link className="site-button site-button-primary" href="/app">Download Grapho <ArrowRight size={16} /></Link><a className="site-button site-button-quiet" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={15} /> View source</a></div></section>

            <footer className="site-footer"><span>© {new Date().getFullYear()} Grapho</span><span>Open source · Local-first · Yours.</span><div className="site-footer-links"><Link href="/app">Open app</Link><a href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer">GitHub <ArrowRight size={13} /></a></div></footer>
    </main>
  );
}
