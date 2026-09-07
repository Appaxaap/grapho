"use client";

import { useSyncExternalStore } from "react";
import { motion, type Variants } from "motion/react";

type Kind = "noise" | "pencil" | "folders" | "device" | "community" | "spark";
const captions: Record<Kind, string> = {
  noise: "a complicated way to do a simple thing.",
  pencil: "a little scribble goes a long way.",
  folders: "organized enough. promise.",
  device: "home is where your files are.",
  community: "good ideas like company.",
  spark: "there it is. the start of something.",
};
const movingLine: Variants = {
  rest: { pathLength: 0, opacity: 0 },
  draw: { pathLength: 1, opacity: 1, transition: { duration: 1.1, ease: "easeInOut" } },
};
const movingAppear: Variants = {
  rest: { opacity: 0, scale: .85, y: 12 },
  draw: { opacity: 1, scale: 1, y: 0, transition: { duration: .7, ease: "easeOut" } },
};
function subscribeMotionPreference(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getMotionPreference = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function AnimatedSketch({ kind }: { kind: Kind }) {
  const reduced = useSyncExternalStore(subscribeMotionPreference, getMotionPreference, () => false);
  const line: Variants = reduced ? { rest: { pathLength: 1, opacity: 1 }, draw: { pathLength: 1, opacity: 1, transition: { duration: 0 } } } : movingLine;
  const appear: Variants = reduced ? { rest: { opacity: 1 }, draw: { opacity: 1, transition: { duration: 0 } } } : movingAppear;
  return (
    <figure className={"studio-sketch studio-sketch-" + kind}>
      <motion.svg key={reduced ? "reduced" : "motion"} viewBox="0 0 360 240" fill="none" aria-hidden="true"
        initial={reduced ? false : "rest"} whileInView="draw" viewport={{ once: true, amount: .2 }}
        animate={reduced ? "draw" : undefined}
        variants={{ rest: {}, draw: { transition: { staggerChildren: reduced ? 0 : .15 } } }}>
        {kind === "noise" && <>
          <motion.path className="sketch-muted" variants={line} d="M32 114C80 12 219 12 222 87S46 186 72 83 286 69 256 159 112 205 121 112 316 40 292 123 162 204 159 139" />
          <motion.path variants={line} d="M159 139C177 164 204 173 242 158S282 123 318 124m-14-9 15 9-14 10" />
          <motion.g variants={appear}><rect x="252" y="174" width="66" height="46" rx="3" /><path d="M264 188h36m-36 10h24" /><circle cx="50" cy="198" r="3" /></motion.g>
          <motion.path variants={line} d="m287 73 4-14m12 25 14-5M25 66l-8-8" />
        </>}
        {kind === "pencil" && <>
          <motion.path className="sketch-muted" variants={line} d="M57 46h177l24 24v134H57V46Zm177 0v26h24M79 168h148M79 185h101" />
          <motion.path variants={line} d="M79 122c26-49 33 49 57 0s29 39 55 5 23-15 36-15M80 148c37-6 76 2 124-6" />
          <motion.g variants={{ rest: { x: -62, y: 28, rotate: -12, opacity: 0 }, draw: { x: reduced ? 40 : [0, 16, 32, 40], y: reduced ? -18 : [0, -8, 0, -18], rotate: reduced ? 4 : [0, -3, 0, 4], opacity: 1, transition: { duration: reduced ? 0 : 2.2, ease: "easeInOut" } } }}>
            <path className="sketch-solid" d="m188 113 54-84 16 10-53 85-20 9 3-20Z" /><path d="m190 112 16 10m29-82 16 10m-57 65 53-84" />
          </motion.g>
          <motion.path variants={line} d="m288 70 14-7m-18-8 4-16" />
        </>}
        {kind === "folders" && <>
          <motion.g variants={{ rest: { x: -44, y: -22, rotate: -18, opacity: 0 }, draw: { x: 0, y: 0, rotate: -6, opacity: 1, transition: { duration: reduced ? 0 : 1.3 } } }}><path className="sketch-solid" d="M94 36h99v130H94z" /><path d="M110 60h62m-62 15h44m-44 15h55" /></motion.g>
          <motion.g variants={{ rest: { x: 44, y: -28, rotate: 18, opacity: 0 }, draw: { x: 0, y: 0, rotate: 6, opacity: 1, transition: { duration: reduced ? 0 : 1.3 } } }}><path className="sketch-solid" d="M162 42h91v129h-91z" /><path d="M178 68h54m-54 15h36m-36 15h45" /></motion.g>
          <motion.path variants={line} className="sketch-solid" d="M62 119V96h81l18 23h139l-23 89H83l-21-89Z" />
          <motion.path variants={line} d="M111 156h47m-47 12h25m159-96 13-8m-11 23 16-1" />
          <motion.circle variants={appear} cx="248" cy="167" r="16" /><motion.path variants={line} d="m241 167 5 5 9-11" />
        </>}
        {kind === "device" && <>
          <motion.path className="sketch-muted" variants={line} d="M61 61h236v141H61zM43 207h272l-15 14H58l-15-14Z" />
          <motion.path variants={line} d="M136 86h79l17 18v78h-96V86Zm79 0v20h17M151 126h63m-63 15h46m-46 15h55" />
          <motion.g variants={appear}><circle className="sketch-solid" cx="272" cy="75" r="29" /><path d="m259 75 9 9 17-21" /></motion.g>
          <motion.path variants={line} d="M39 132c-18-50 9-104 65-113m-9-4 12 3-5 12M318 98c13 49-4 86-22 106" />
          <motion.circle variants={appear} cx="82" cy="83" r="3" />
        </>}
        {kind === "community" && <>
          <motion.path className="sketch-muted" variants={line} d="M53 115h254M125 115V63q0-17 20-17h57q22 0 22 20v49M224 115v49q0 19 20 19h57" />
          {[53,125,224,307].map((x,i) => <motion.circle key={x} variants={appear} cx={x} cy="115" r={i === 1 ? 20 : 11} className="sketch-solid" />)}
          <motion.circle variants={appear} cx="174" cy="46" r="12" className="sketch-solid" />
          <motion.circle variants={appear} cx="301" cy="183" r="12" className="sketch-solid" />
          <motion.path variants={line} d="m119 115 4 5 8-10m40-68 7 4-7 5M288 38l5-13m10 21 14-4" />
          <motion.path variants={line} d="M48 164h89m-89 11h57M164 211h88" />
        </>}
        {kind === "spark" && <>
          <motion.path variants={line} d="M139 142c-51-51-18-112 38-112 54 0 88 61 37 112l-7 20h-61l-7-20Z" />
          <motion.path variants={line} d="M148 172h57m-52 10h47m-38 12h21M162 158v-41l-14-13 15-10 14 12 15-12 13 10-14 13v41" />
          <motion.g variants={{ rest: { opacity: 0, scale: .6 }, draw: { opacity: 1, scale: reduced ? 1 : [1, 1.1, 1], transition: { duration: reduced ? 0 : .9 } } }}><path d="m89 63-18-9m193 9 18-9M176 12V2M91 119l-23 5m197-5 23 5M119 25l-10-14m125 14 10-14" /></motion.g>
          <motion.path className="sketch-muted" variants={line} d="M118 218c33-8 77-6 113 0" />
        </>}
      </motion.svg>
      <figcaption><span className="studio-handnote">{captions[kind]}</span></figcaption>
    </figure>
  );
}
