import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, FileText, GitBranch, LockKeyhole, Sparkles } from "lucide-react";
import { Footer } from "../components/site/Footer";
import { Navigation } from "../components/site/Navigation";
import "./site.css";

export const metadata: Metadata = {
  title: "Grapho | Where thoughts become documents",
  description: "A local-first writing application for turning unfinished thoughts into lasting documents.",
};

export default function PublicSite() {
  return <main className="atelier" id="top"><Navigation />
    <section className="atelier-hero" aria-labelledby="atelier-title">
      <div className="atelier-coordinate" aria-hidden="true"><span>01</span><i /><span>BEGIN</span></div>
      <header><p><span /> LOCAL-FIRST WRITING, WITHOUT THE NOISE</p><h1 id="atelier-title"><span>Every document</span><span>starts as a</span><em>loose thought.</em></h1></header>
      <div className="atelier-thoughts" aria-hidden="true"><span>an opening line</span><span>the point I almost lost</span><span>→ connect these</span><span>make this clearer</span></div>
      <div className="atelier-sheet" aria-label="An unfinished thought becoming a Grapho document"><div className="atelier-sheet-bar"><span>PROJECTS / UNTITLED</span><span><i /> SAVED LOCALLY</span></div><div className="atelier-sheet-body"><small>DOCUMENT 01</small><h2>A place for the idea<br />before it becomes <em>obvious.</em></h2><p>Begin with the sentence you have. Structure can arrive later.</p><div className="atelier-block"><b>01</b><span>Write while the thought is alive.</span></div><div className="atelier-block"><b>02</b><span>Shape it without leaving the page.</span></div><div className="atelier-caret" /></div><div className="atelier-tools"><span>Text</span><b>B</b><i>I</i><span>H2</span><span>↗</span></div></div>
      <div className="atelier-entry"><p>Grapho turns the scattered beginning into a document you can finish, keep, and carry anywhere.</p><div><Link href="/app">Enter the workspace <ArrowUpRight size={15} /></Link><a href="#movement">Watch it take shape <ArrowDown size={14} /></a></div></div>
      <div className="atelier-scroll" aria-hidden="true"><span>SCROLL TO COMPOSE</span><i /></div>
    </section>

    <section className="atelier-movement" id="movement"><aside><span>02</span><p>THE MOVEMENT<br />OF A THOUGHT</p></aside><div className="atelier-sentence"><span>Capture the fragment.</span><span>Find its shape.</span><span>Leave with something</span><em>worth keeping.</em></div><div className="atelier-glyph" aria-hidden="true"><i /><i /><i /><b>G</b></div></section>

    <section className="atelier-workspace"><div className="atelier-workspace-copy"><span>03 / INSIDE GRAPHO</span><h2>The interface<br />becomes <em>quiet.</em></h2><p>Tools appear in context. Structure stays visible. Your writing owns the room.</p></div><div className="atelier-window"><div className="atelier-window-top"><span>Grapho</span><span>Document saved <i /></span></div><aside><b>Library</b><small>WORKSPACE</small><span className="active">Product thinking</span><span>Loose notes</span><span>Reading</span><small>DOCUMENTS</small><span>A quieter tool</span><span>Open questions</span></aside><article><small>PRODUCT THINKING / DRAFT 04</small><h3>Software should make<br />the thought feel <em>larger.</em></h3><p>Not the interface.</p><div className="atelier-selection"><span>When the tools recede, the idea becomes easier to see.</span></div><div className="atelier-toolbar"><b>B</b><i>I</i><span>H2</span><span>Link</span><span>Comment</span></div></article></div></section>

    <section className="atelier-principles"><header><span>04 / WHAT REMAINS</span><h2>Less software.<br /><em>More ownership.</em></h2></header><div><article><LockKeyhole /><span>01</span><h3>Lives with you</h3><p>Local-first storage keeps your writing close and understandable.</p></article><article><FileText /><span>02</span><h3>Leaves as a document</h3><p>Export finished work in formats designed to travel.</p></article><article><GitBranch /><span>03</span><h3>Built in public</h3><p>Read the source and understand the tool holding your words.</p></article></div></section>

    <section className="atelier-end"><Sparkles aria-hidden="true" /><p>THE NEXT PAGE IS YOURS</p><h2>Start with<br /><em>one true sentence.</em></h2><Link href="/app">Open a blank document <ArrowUpRight size={16} /></Link><span><Check size={12} /> No account required</span></section><Footer />
  </main>;
}
