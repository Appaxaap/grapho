"use client";

import { useState } from "react";
import { AirplaneDoodle } from "./LandingIllustrations";

export function PaperFlight() {
  const [flights, setFlights] = useState(0);
  return (
    <div className="studio-flight">
      <div className="studio-flight-track" aria-hidden="true">
        <svg viewBox="0 0 320 80" fill="none"><path d="M12 65C80 65 80 8 130 14S173 78 233 48 280 20 302 12" /></svg>
        <span key={flights} className={flights ? "studio-plane-launched" : ""}><AirplaneDoodle /></span>
      </div>
      <button type="button" onClick={() => setFlights(current => current + 1)}>Give it a little flight ↗</button>
      <span className="studio-handnote" aria-live="polite">{flights ? "Still works in airplane mode." : "no Wi-Fi. still a good idea."}</span>
    </div>
  );
}
