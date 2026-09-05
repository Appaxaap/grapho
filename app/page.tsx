import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Download, FileText, Folder, GitBranch, HardDrive, Laptop, WifiOff } from "lucide-react";
import { LandingCanvas } from "../components/site/LandingCanvas";
import { LandingMotion } from "../components/site/LandingMotion";
import { Navigation } from "../components/site/Navigation";
import { HandArrow, Scribble } from "../components/site/LandingIllustrations";
import { PaperFlight } from "../components/site/PaperFlight";
import "./site.css";

export const metadata: Metadata = {
  title: "Grapho | A little space for your next big thought.",
  description: "A local-first writing canvas. Shape your thoughts, organize your documents, and make something worth sharing.",
};

const release = "https://github.com/Appaxaap/grapho/releases/tag/v1.0.0";
const repository = "https://github.com/Appaxaap/grapho";

function Actions() {
  return <div className="studio-actions">
    <a className="studio-button" href={release}>Get Grapho <Download size={16} /></a>
    <Link className="studio-text-link" href="/app">Open in browser <ArrowUpRight size={16} /></Link>
  </div>;
}

export default function PublicSite() {
  return (
    <div className="studio" id="top">
      <LandingMotion />
      <a className="studio-skip" href="#main">Skip to content</a>
      <Navigation />
      <main id="main">
        <section className="studio-hero studio-wrap" aria-labelledby="hero-title">
          <div className="studio-hero-top"><span className="studio-eyebrow"><i /> A PLACE FOR YOUR WORDS</span><span className="studio-edition">OPEN SOURCE / V.1.0.0</span></div>
          <div className="studio-hero-grid">
            <div className="studio-hero-copy">
              <h1 id="hero-title">Room<br />to <span className="studio-marked">think.<Scribble /></span></h1>
              <p>A quiet canvas for the thought you haven’t quite found the words for. Write it. Shape it. Keep it yours.</p>
              <Actions />
              <span className="studio-platforms">Linux · Windows · Android</span>
            </div>
            <LandingCanvas />
          </div>
          <div className="studio-hero-bottom"><a href="#why"><ArrowDown size={15} /> A little less noise. A little more space.</a><span>01 — THE CANVAS</span></div>
        </section>

        <section className="studio-statement studio-wrap" id="why">
          <span className="studio-eyebrow">02 / LESS, BUT BETTER</span>
          <div data-studio-reveal>
            <p className="studio-crossed">Another dashboard.<br />Another workspace.<br />Another thing to manage.</p>
            <span className="studio-handnote studio-problem-note">I just wanted to write a proposal.</span>
            <h2>What if you<br />just <em>wrote?</em></h2>
            <p className="studio-body">Grapho gives your ideas a place to become documents. The tools arrive when you need them. The rest of the time, it’s you and the page.</p>
          </div>
          <div className="studio-margin-note" aria-hidden="true">LESS INTERFACE<br /><span>↓</span><br />MORE IDEAS</div>
        </section>

        <section className="studio-writing studio-wrap" id="writing">
          <header className="studio-section-head" data-studio-reveal><span className="studio-eyebrow">03 / FIND YOUR FORM</span><h2>Different voices.<br /><span>The same thought.</span></h2><p className="studio-body">A technical note. A personal essay. Your next proposal. Give each document the space and character it needs.</p></header>
          <div className="studio-type-specimens" data-studio-reveal>
            <div><span className="studio-eyebrow">SANS / CLEAR & DIRECT</span><p className="studio-sans">Make<br />your point.</p><span>For the idea that needs clarity.</span></div>
            <div><span className="studio-eyebrow">MONO / THOUGHTFULLY PRECISE</span><p className="studio-mono">Follow<br />the thought.</p><span>For the details that matter.</span></div>
            <div><span className="studio-eyebrow">SERIF / A LITTLE MORE HUMAN</span><p className="studio-serif">Find<br /><em>your voice.</em></p><span>For the story only you can tell.</span></div>
          </div>
          <div className="studio-writing-foot"><span>Markdown · Rich text · Tables · Block editing</span><a className="studio-text-link" href="#canvas">Try the canvas above <ArrowUpRight size={16} /></a></div>
        </section>

        <section className="studio-organize studio-wrap">
          <div data-studio-reveal><span className="studio-eyebrow">04 / A PLACE FOR EVERYTHING</span><h2>A small system.<br /><span>A clearer head.</span></h2><p className="studio-body">Projects, folders, documents. Familiar by design. Keep related thoughts together and find your way back to the one that matters.</p></div>
          <div className="studio-file-index" data-studio-reveal aria-label="Example document organization">
            <div className="studio-index-heading"><Folder size={18} /><span>My corner of the world</span><span>03</span></div>
            {["The next big idea", "Notes from the in-between", "Something worth sharing"].map((title, index) => <div className="studio-index-row" key={title}><span>0{index + 1}</span><FileText size={18} /><span>{title}</span><span>.grapho</span></div>)}
            <div className="studio-index-caption">A little order. A lot of possibility.</div>
          </div>
        </section>

        <section className="studio-local" id="local-first">
          <div className="studio-wrap">
            <div className="studio-local-top"><span className="studio-eyebrow">05 / OWN YOUR WORDS</span><span><WifiOff size={16} /> OFFLINE IS A FEATURE</span></div>
            <div className="studio-local-grid">
              <h2 data-studio-reveal>Your words.<br />Your files.<br /><span>Your device.</span></h2>
              <div className="studio-local-details" data-studio-reveal><HardDrive size={48} strokeWidth={1} /><p>Your writing shouldn’t need permission to exist.</p><p className="studio-body">Write without an account or an internet connection. Your documents stay on your device, ready when you are.</p><div className="studio-ownership"><span><Laptop size={18} /> Your device</span><i /><span><FileText size={18} /> Your documents</span></div><PaperFlight /></div>
            </div>
          </div>
        </section>

        <section className="studio-export studio-wrap" id="export">
          <div className="studio-export-copy" data-studio-reveal><span className="studio-eyebrow">06 / MAKE IT SOMETHING</span><h2>From rough idea<br />to <em>ready to send.</em></h2><p className="studio-body">A good document deserves a good exit. Export your work in a format that belongs wherever it’s going next.</p><div className="studio-formats"><span>PDF</span><span>Markdown</span><span>HTML</span><span>Plain text</span></div><p className="studio-small">Native PDF export in the desktop app.</p></div>
          <div className="studio-document-stack" data-studio-reveal>
            <span className="studio-handnote studio-export-note">look at you, all professional.<HandArrow /></span>
            <article className="studio-export-document"><header><span>GRAPHO / FIELD NOTES</span><span>001</span></header><div><span className="studio-eyebrow">AN IDEA, FINISHED.</span><h3>Good things<br />begin with<br /><em>a thought.</em></h3><p>Give it a little time.<br />A little structure.<br />And somewhere to go.</p></div><footer><span>MADE WITH GRAPHO</span><ArrowUpRight size={20} /></footer></article>
          </div>
        </section>

        <section className="studio-source studio-wrap" id="open-source">
          <span className="studio-eyebrow">07 / NOTHING BEHIND THE CURTAIN</span>
          <div data-studio-reveal><GitBranch size={32} strokeWidth={1.3} /><h2>Made in the open.<br /><span>Yours to make better.</span></h2><p className="studio-body">Read it. Build it. Change it. Grapho is open source, because the tools you think with should be yours to understand.</p><a className="studio-text-link" href={repository}>Appaxaap / grapho <ArrowUpRight size={18} /></a><span className="studio-license">MIT LICENSE · TYPESCRIPT · RUST</span></div>
        </section>

        <section className="studio-final studio-wrap">
          <div data-studio-reveal><span className="studio-eyebrow">08 / IT STARTS HERE</span><h2>One blank page.<br /><span>Anything next.</span></h2><Actions /><p className="studio-handnote studio-final-note">first drafts are allowed to be terrible.</p></div>
          <a className="studio-endmark" href="/app" aria-label="Start writing in Grapho"><ArrowUpRight strokeWidth={0.6} /></a>
        </section>
      </main>
      <footer className="studio-footer studio-wrap"><Link className="studio-wordmark" href="/">grapho<span>_</span></Link><nav aria-label="Footer navigation"><Link href="/documentation">Documentation</Link><a href={repository}>GitHub</a><a href={repository + "/blob/main/LICENSE"}>License</a></nav><span>A little space to make something.</span></footer>
    </div>
  );
}
