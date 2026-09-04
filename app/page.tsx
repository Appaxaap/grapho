import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, GitBranch, LockKeyhole } from "lucide-react";
import { Footer } from "../components/site/Footer";
import { Navigation } from "../components/site/Navigation";
import { ProductCanvas } from "../components/site/ProductCanvas";
import "./site.css";

export const metadata: Metadata = {
  title: "Grapho | A quiet place for serious writing",
  description: "A local-first writing application for turning ideas into finished, portable documents.",
};

const journey = [["01", "Capture", "Begin before the thought disappears."], ["02", "Compose", "Give every idea structure without leaving the page."], ["03", "Carry", "Export a finished document that remains yours."]];

export default function PublicSite() {
  return <main className="signal-site" id="top"><Navigation />
    <section className="signal-hero" aria-labelledby="signal-title"><div className="signal-rail" aria-hidden="true"><span>GRAPHO / 01</span><i /><span>LOCAL-FIRST WRITING</span></div><div className="signal-intro"><p className="signal-label"><span /> The document is the interface</p><h1 id="signal-title">Think in words.<br /><em>Leave with work.</em></h1><p className="signal-lede">A focused writing space where rough thoughts become clear, portable documents.</p><div className="signal-actions"><Link href="/app">Open Grapho <ArrowUpRight size={15} /></Link><a href="#experience">See how it works <ArrowDown size={14} /></a></div></div><div className="signal-stage"><div className="signal-stage-meta"><span>LIVE DOCUMENT</span><span>Saved locally</span></div><ProductCanvas compact /><p><i /> Nothing between the thought and the page.</p></div><div className="signal-ticker" aria-hidden="true"><span>WRITE</span><i>→</i><span>SHAPE</span><i>→</i><span>FINISH</span><i>→</i><span>KEEP</span></div></section>
    <section className="signal-manifesto" id="experience"><p className="signal-index">02 / THE EXPERIENCE</p><h2>Most writing tools ask you to manage the tool. <em>Grapho asks what you want to say.</em></h2></section>
    <section className="signal-workflow"><header><p className="signal-label"><span /> One continuous flow</p><h2>From first line<br />to final file.</h2></header><div className="signal-steps">{journey.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p><i aria-hidden="true">↗</i></article>)}</div></section>
    <section className="signal-proof"><div className="signal-proof-copy"><p className="signal-index">03 / THE PRODUCT</p><h2>Your workspace.<br /><em>Already in motion.</em></h2><p>Projects, block-based editing, formatting, tables, export, and local persistence live in one calm system.</p></div><ProductCanvas /></section>
    <section className="signal-values"><article><LockKeyhole /><span>01</span><h3>Local by design</h3><p>Your writing lives on your device, not inside an account you rent.</p></article><article><Check /><span>02</span><h3>Portable by default</h3><p>The end result is a document you can keep, move, and share.</p></article><article><GitBranch /><span>03</span><h3>Built in the open</h3><p>Read the source, run it yourself, or help shape what comes next.</p></article></section>
    <section className="signal-finale"><p className="signal-label"><span /> Your next document</p><h2>There is a blank page<br /><em>waiting for a good idea.</em></h2><Link href="/app">Start writing <ArrowUpRight size={16} /></Link></section><Footer />
  </main>;
}
