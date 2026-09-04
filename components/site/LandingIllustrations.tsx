export function HandArrow({ className = "" }: { className?: string }) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 150 70" fill="none"><path d="M4 12c34 2 78 6 117 38" /><path d="m103 48 21 4-6-19" /></svg>;
}

export function Scribble({ className = "" }: { className?: string }) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 220 24" fill="none"><path d="M3 15c34-8 65 3 98-3 38-7 73 4 116-5" /><path d="M8 20c48-5 91 1 139-4" /></svg>;
}

export function CloudCross() {
  return <svg className="zine-cloud" aria-hidden="true" viewBox="0 0 180 125" fill="none"><path d="M37 79c-19-2-23-30-5-39 8-4 16-2 21 2 4-19 31-28 46-14 5 4 7 10 8 16 18-5 35 8 34 26-1 14-12 23-26 23H43" /><path className="zine-cloud-x" d="m28 15 126 96M151 13 31 111" /></svg>;
}

export function AirplaneDoodle() {
  return <svg className="zine-plane" aria-hidden="true" viewBox="0 0 130 90" fill="none"><path d="m8 52 111-41-37 69-22-24-25 12 7-22-34 6Z" /><path d="m42 46 40 10 37-45M60 56l-18-10" /></svg>;
}
