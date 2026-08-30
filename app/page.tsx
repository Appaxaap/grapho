"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, GitBranch, LockKeyhole, Menu, MousePointer2 } from "lucide-react";
import "./site.css";

const features = [
  ["01", "Write in the foreground", "A quiet canvas for the thought that is still becoming."],
  ["02", "Keep things findable", "Folders and search give your work a place without turning it into a system."],
  ["03", "Leave beautifully", "Turn a living draft into a document you can send, print, or keep."],
];

export default function PublicSite() {
  return (
    <main className="new-site" id="top">
      <nav className="new-nav" aria-label="Main navigation">
        <Link href="/" className="new-brand"><span className="new-brand-mark"><img src="/Branding/Primary-logo.png" alt="" /></span><span>Grapho</span></Link>
        <div className="new-nav-links"><a href="#product">The product</a><a href="#principle">Why Grapho</a><a href="#open-source">Open source</a></div>
        <Link className="new-nav-cta" href="/app">Open Grapho <ArrowUpRight size={14} /></Link>
        <Link className="new-mobile-menu" href="/app" aria-label="Open Grapho"><Menu size={18} /></Link>
      </nav>

      <section className="new-hero" aria-labelledby="new-hero-title">
        <Image className="new-hero-image" src="/images/grapho-landscape-hero.webp" alt="A writing desk looking out over a mountain landscape" fill priority sizes="100vw" />
        <div className="new-hero-cover" aria-hidden="true" />
        <div className="new-hero-topline"><span>01 / A local-first writing space</span><span>For the work that matters</span></div>
        <div className="new-hero-copy"><p className="new-kicker">A beautiful place to begin</p><h1 id="new-hero-title">Write freely.<br /><i>Make it yours.</i></h1><p className="new-hero-description">Grapho is a calm, local-first writing and document app for turning unfinished thoughts into work worth sharing.</p><div className="new-hero-actions"><Link className="new-pill new-pill-light" href="/app">Start writing <ArrowUpRight size={15} /></Link><a className="new-text-link" href="#product">Explore the product <span>↓</span></a></div></div>
        <div className="new-hero-card" aria-label="Grapho document preview"><div className="new-card-top"><span><i /> Grapho</span><span>Product brief</span></div><div className="new-card-body"><small>01 — THE BEGINNING</small><strong>A clear place<br />for clear thinking.</strong><p>Ideas become easier to finish when the interface knows when to step back.</p><div className="new-card-rule" /><span className="new-card-status"><LockKeyhole size={11} /> Saved locally</span></div></div>
        <div className="new-hero-bottom"><span>Scroll to discover</span><span>Open source · No account required</span></div>
      </section>

      <section className="new-intro" id="product"><div className="new-intro-index">02 / The product</div><div><p className="new-kicker">Less interface. More intention.</p><h2>The space between<br /><i>idea and outcome.</i></h2><p className="new-body">Most writing tools ask you to manage the work before you make it. Grapho starts somewhere else: with a beautiful, understandable document and enough structure to carry it forward.</p></div><div className="new-intro-aside">Designed for drafts, notes,<br />briefs, essays, and everything<br />that deserves to become real.</div></section>

      <section className="new-product-stage" aria-label="Grapho writing interface"><div className="new-product-window"><div className="new-product-rail"><span className="new-product-logo">G</span><span className="rail-active">✦</span><span>⌕</span><span>□</span><span>↗</span><span className="rail-bottom">◌</span></div><aside><span className="new-side-title">Library <b>+</b></span><span className="new-side-label">PROJECTS</span><span className="new-side-item active">Product brief</span><span className="new-side-item">Launch notes</span><span className="new-side-label">PERSONAL</span><span className="new-side-item">Reading list</span></aside><article><div className="new-doc-meta"><span>PROJECTS / PRODUCT BRIEF</span><span>Saved locally</span></div><small>DOCUMENT · 01</small><h3>A clear place<br /><i>for clear thinking.</i></h3><p>Grapho gives a thought enough room to become a document. No dashboards. No noise. Just the next useful line.</p><div className="new-doc-section"><span>01</span><strong>What matters</strong><ul><li>Writing stays in the foreground</li><li>Structure remains understandable</li><li>The finished document travels well</li></ul></div></article><div className="new-cursor"><MousePointer2 size={14} /><span>you</span></div></div></section>

      <section className="new-features"><div className="new-section-heading"><p className="new-kicker">03 / A smaller toolkit</p><h2>Everything you need.<br /><i>Nothing to maintain.</i></h2></div><div className="new-feature-grid">{features.map(([number, title, copy]) => <article className={`new-feature new-feature-${number}`} key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>{number === "01" && <div className="feature-lines"><i /><i /><i /></div>}{number === "02" && <div className="feature-folders"><b>Projects</b><span>Product brief</span><span>Launch notes</span></div>}{number === "03" && <div className="feature-paper"><small>READY TO SHARE</small><strong>PDF</strong></div>}</article>)}</div></section>

      <section className="new-principle" id="principle"><div className="new-principle-number">04 / The principle</div><div className="new-principle-quote"><span>“</span><h2>The interface<br />should know when<br />to <i>disappear.</i></h2></div><p className="new-body">Your writing belongs close to you. Grapho works offline, stores documents locally, and stays open about how it is made.</p></section>

      <section className="new-open" id="open-source"><div><p className="new-kicker">05 / Built in the open</p><h2>Readable software<br /><i>for readable work.</i></h2><p className="new-body">Grapho is open source and local-first. Inspect it, run it, shape it, or simply use it as a quiet place to write.</p><Link className="new-pill new-pill-dark" href="https://github.com/Appaxaap/grapho" target="_blank">Explore the repository <ArrowUpRight size={15} /></Link></div><div className="new-code-card"><div><GitBranch size={13} /> Appaxaap / grapho <span>public</span></div><pre><code><i>const</i> document = {`{`}<br />  home: <b>&quot;your computer&quot;</b>,<br />  format: <b>&quot;your choice&quot;</b>,<br />  source: <b>&quot;open&quot;</b><br />{`}`};</code></pre><small><Check size={12} /> local-first by design</small></div></section>

      <section className="new-final"><p className="new-kicker">06 / Begin anywhere</p><h2>There is a first line<br />waiting for <i>you.</i></h2><Link className="new-pill new-pill-light" href="/app">Open Grapho <ArrowUpRight size={15} /></Link><p className="new-final-note">Linux builds available · free and open source</p></section>
      <footer className="new-footer"><Link href="/" className="new-brand"><span className="new-brand-mark"><img src="/Branding/Primary-logo.png" alt="" /></span><span>Grapho</span></Link><span>Write beautifully. Organize simply. Export professionally.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}
