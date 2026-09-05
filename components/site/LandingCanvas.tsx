"use client";

import { useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import Link from "next/link";

const sample = "A thought worth keeping.\n\nIt starts small. A sentence, a question, a little what if.\n\nGive it room.";
const voices = [
  { id: "default", label: "Grapho", name: "Geist Mono" },
  { id: "sans", label: "Sans", name: "Inter" },
  { id: "mono", label: "Mono", name: "System monospace" },
  { id: "serif", label: "Serif", name: "Georgia" },
] as const;

export function LandingCanvas() {
  const [voice, setVoice] = useState<(typeof voices)[number]>(voices[0]);
  const [text, setText] = useState(sample);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="studio-canvas-scene" id="canvas">
      <div className="studio-canvas-caption"><span>YOUR FIRST LITTLE SPACE</span><span>LIVE CANVAS ↙</span></div>
      <div className="studio-canvas">
        <div className="studio-canvas-top"><span><i /> Untitled thought</span><button type="button" onClick={() => setText(sample)} disabled={text === sample} aria-label="Reset sample text" title="Reset sample text"><RotateCcw size={16} /></button></div>
        <div className="studio-canvas-ruler" aria-hidden="true"><span>0</span><span>10</span><span>20</span><span>30</span><span>40</span></div>
        <div className="studio-canvas-page">
          <label htmlFor="studio-writing-sample">Go on, write something.</label>
          <textarea id="studio-writing-sample" className={"studio-voice-" + voice.id} value={text} onChange={event => setText(event.target.value)} placeholder="Your next thought starts here…" spellCheck={false} maxLength={3000} aria-describedby="studio-demo-note" />
        </div>
        <div className="studio-canvas-controls"><div role="group" aria-label="Canvas font">{voices.map(item => <button key={item.id} type="button" aria-pressed={voice.id === item.id} onClick={() => setVoice(item)}>{item.label}</button>)}</div><span>{words} {words === 1 ? "word" : "words"}</span></div>
      </div>
      <div className="studio-canvas-foot"><span aria-live="polite">{voice.name} / {voice.id === "default" ? "Grapho’s signature" : "Canvas voice"}</span><Link href="/app" aria-label="Open the full Grapho editor"><ArrowUpRight size={18} /></Link></div>
      <p id="studio-demo-note">A space to try. This sample resets when you leave.</p>
    </div>
  );
}
