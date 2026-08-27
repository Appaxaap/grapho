import Link from "next/link";
import { ArrowRight, Check, GitBranch, LockKeyhole, Menu, PenLine, Sparkles, WandSparkles } from "lucide-react";
import "./site.css";

const workflow = [
  ["01", "Write", "A calm, structured canvas that keeps the document in the foreground.", PenLine, "Start with a clear page"],
  ["02", "Organize", "Projects, folders, and documents—nothing more complicated than necessary.", Sparkles, "Projects / Product brief"],
  ["03", "Refine", "Shape hierarchy, typography, links, tables, quotes, and callouts in context.", WandSparkles, "Heading · Quote · Table"],
  ["04", "Deliver", "Export meaningful work to PDF, Markdown, HTML, or plain text.", ArrowRight, "PDF · MD · HTML · TXT"],
] as const;

const capabilities = ["Structured blocks", "Rich text formatting", "Markdown import and export", "Local full-text search", "Document backlinks", "Print-ready PDF export"];

export default function PublicSite() {
  return (
    <main className="site-shell" id="top">
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
          <h1 id="hero-title"><span>Write something</span><br /><em><span>worth sharing.</span></em></h1>
          <p>A beautiful, local-first writing app for turning ideas into finished documents. Write without distractions, organize naturally, and export work that looks as good as it reads.</p>
          <div className="site-actions"><Link className="site-button site-button-primary" href="/app">Start writing <ArrowRight size={16} /></Link><a className="site-button site-button-quiet" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={15} /> View source</a></div>
          <div className="site-hero-note"><LockKeyhole size={13} /> Open source · local-first · no account required</div>
        </div>
        <div className="cinema-stage" aria-label="Grapho desktop writing experience"><div className="cinema-ambient" aria-hidden="true" /><div className="cinema-scanline" aria-hidden="true" />
          <div className="cinema-window-bar"><span className="cinema-lights"><i /><i /><i /></span><span>Product Brief</span><span>Saved locally</span></div>
          <div className="cinema-workspace">
            <aside><div className="cinema-library">Library <b>+</b></div><div className="cinema-search">Search documents</div><small>WORKSPACE</small><div className="cinema-folder active">Projects <span>3</span></div><div className="cinema-folder">Personal <span>1</span></div><small>PROJECTS</small><div className="cinema-document active">Product Brief</div><div className="cinema-document">Launch notes</div></aside>
            <article><div className="cinema-meta">PROJECTS / PRODUCT BRIEF</div><div className="cinema-kicker">DOCUMENT · READY TO SHARE</div><h2>Build a quieter<br />way to write.</h2><p>A focused document experience for turning a clear idea into work another person can use.</p><h3>What matters</h3><ul><li>Writing stays in the foreground</li><li>Structure remains understandable</li><li>The finished document travels well</li></ul><div className="cinema-callout">Your workspace. Your documents. Your computer.</div></article>
          </div>
          <div className="cinema-save-signal" aria-hidden="true"><i /> Local file updated</div><div className="cinema-toolbar"><span>Saved</span><i /> <b>B</b><em>I</em><span>H</span><span>↗</span></div>
        </div>
      </section>

      <section className="site-ownership" aria-labelledby="ownership-title"><div className="ownership-copy"><span className="site-eyebrow"><span className="site-dot" /> Local by design</span><h2 id="ownership-title">Your writing has<br />a home. <em>Yours.</em></h2><p>Grapho keeps the document close to you—from the first line to the finished export. No connection is required to open, edit, organize, or deliver your work.</p><div className="ownership-principles"><span>Local storage</span><span>Offline editing</span><span>Portable exports</span></div></div><div className="ownership-flow" aria-label="A document moving through a local Grapho workflow"><div className="ownership-machine"><span className="ownership-machine-top"><i /><i /><i /><b>grapho.local</b></span><div className="ownership-file"><small>PRODUCT BRIEF</small><strong>A clearer way<br />to write.</strong><span>Saved on this computer</span></div></div><div className="ownership-path"><span>WRITE</span><i /><span>KEEP</span><i /><span>EXPORT</span></div></div></section>

      <section className="site-workflow" id="features" aria-labelledby="features-title"><div className="workflow-heading"><span className="site-eyebrow"><span className="site-dot" /> The whole workflow</span><h2 id="features-title">A document should<br />move <em>forward.</em></h2><p>Grapho supports the complete path from an unfinished thought to work that is ready to leave the editor.</p></div><div className="workflow-track">{workflow.map(([number, title, copy, Icon, preview]) => <article className="workflow-step" key={title}><div className="workflow-number">{number}</div><div className="workflow-content"><span className="workflow-icon"><Icon size={15} /></span><h3>{title}</h3><p>{copy}</p></div><div className={`workflow-preview workflow-preview-${number}`}><small>{preview}</small>{number === "01" && <><strong>Product brief</strong><i /><i className="short" /></>}{number === "02" && <><span>▾ Projects</span><span className="selected">&nbsp;&nbsp;Product brief</span><span>▸ Personal</span></>}{number === "03" && <><b>B</b><em>I</em><span>H2</span><span>↗</span></>}{number === "04" && <><strong>Ready to share</strong><span>Export document →</span></>}</div></article>)}</div></section>

      <section className="site-problem" aria-labelledby="problem-title"><div className="problem-visual" aria-label="Moving from managing systems to making a document"><div className="problem-noise"><span>Workspace</span><span>Database</span><span>Knowledge system</span><span>Configuration</span></div><div className="problem-arrow">→</div><div className="problem-document"><small>THE DOCUMENT</small><strong>One clear idea.<br />Finished well.</strong><i /><i className="short" /><em>Ready to share</em></div></div><div className="problem-copy"><span className="site-eyebrow"><span className="site-dot" /> A focused alternative</span><h2 id="problem-title">Not another system<br />to <em>maintain.</em></h2><p>Modern tools can become places to configure, categorize, and manage. Grapho has a narrower purpose: give you a beautiful place to write and finish the document in front of you.</p><blockquote>Built for making documents—not managing software.</blockquote></div></section>

      <section className="site-principles" id="philosophy" aria-labelledby="principles-title"><div className="principles-mark" aria-hidden="true">“</div><div className="principles-manifesto"><span className="site-eyebrow"><span className="site-dot" /> A quieter kind of software</span><h2 id="principles-title">Don&apos;t manage<br />your knowledge.<br /><em>Make something with it.</em></h2><p>Grapho exists for the moment when collecting stops and making begins. The interface recedes. The document takes its place.</p></div><div className="principles-proof"><span>THE PRODUCT STAYS QUIET</span><div>{capabilities.map((item, index) => <p key={item}><small>{String(index + 1).padStart(2, "0")}</small>{item}<Check size={13} /></p>)}</div></div></section>

      <section className="site-open" id="open-source" aria-labelledby="open-title"><div className="open-copy"><span className="site-eyebrow"><span className="site-dot" /> Built in the open</span><h2 id="open-title">The tool should be<br />as readable as<br /><em>the document.</em></h2><p>Grapho is developed publicly. Inspect how documents are stored, understand what the application can access, report an issue, or help improve the writing experience.</p><div className="site-open-actions"><a className="site-button site-button-primary" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={16} /> Explore the repository</a><Link className="site-button site-button-quiet" href="/app">Open Grapho <ArrowRight size={16} /></Link></div></div><div className="open-repository" aria-label="Grapho public repository preview"><div className="open-repo-head"><span><GitBranch size={13} /> Appaxaap / grapho</span><b>public</b></div><div className="open-repo-tree"><span>app/</span><span>grapho-ui/</span><span>src-tauri/</span><span>README.md</span></div><pre><code><i>const</i> promise = {`{`}<br />&nbsp;&nbsp;write: <q>&quot;beautifully&quot;</q>,<br />&nbsp;&nbsp;organize: <q>&quot;simply&quot;</q>,<br />&nbsp;&nbsp;export: <q>&quot;professionally&quot;</q><br />{`}`};</code></pre><div className="open-repo-foot"><span>Local-first architecture</span><span>TypeScript + Rust</span></div></div></section>

      <section className="site-final-cta" aria-labelledby="final-title"><div className="final-journey" aria-hidden="true"><div className="final-page blank"><span>01</span><i /></div><div className="final-connector"><small>WRITE</small><i /><small>FINISH</small></div><div className="final-page finished"><small>PRODUCT BRIEF</small><strong>A quieter<br />way to write.</strong><p>Clear thinking, shaped into a document that is ready to leave the editor.</p><span>READY TO SHARE · 01</span></div></div><div className="final-copy"><span className="site-eyebrow"><span className="site-dot" /> From blank page to finished document</span><h2 id="final-title">The next page<br />is <em>yours.</em></h2><p>Write beautifully. Organize simply. Export professionally.</p><div className="site-actions"><Link className="site-button site-button-primary" href="/app">Download Grapho <ArrowRight size={16} /></Link><a className="site-button site-button-quiet" href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer"><GitBranch size={15} /> View source</a></div><small>Linux builds available · local-first · open source</small></div></section>

            <footer className="site-footer"><div className="footer-brand"><Link className="site-brand" href="/" aria-label="Grapho home"><span className="site-mark"><img src="/Branding/png-logo.png" alt="" /></span><span>Grapho</span></Link><p>Write beautifully.<br />Organize simply.<br /><em>Export professionally.</em></p></div><div className="footer-navigation"><div><span>PRODUCT</span><Link href="/app">Open Grapho</Link><a href="#features">Features</a><a href="#philosophy">Philosophy</a></div><div><span>OPEN</span><a href="https://github.com/Appaxaap/grapho" target="_blank" rel="noreferrer">Repository</a><a href="https://github.com/Appaxaap/grapho/issues" target="_blank" rel="noreferrer">Issues</a><a href="#open-source">Source story</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Grapho</span><strong>Open source · Local-first · Yours.</strong><a href="#top">Back to top ↑</a></div></footer>
    </main>
  );
}
