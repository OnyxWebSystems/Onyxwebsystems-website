"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Business Operating Systems",
  "App Development",
  "Web Development",
  "Booking flows that convert",
  "Connected dashboards",
] as const;

const CYCLE_MS = 3500;

export function ServicePhraseCarousel() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % PHRASES.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="ox-phrase-carousel">
      <p className="ox-phrase-line" aria-live="polite">
        <span key={index} className="ox-phrase-text">
          {PHRASES[index]}
        </span>
      </p>
      <div className="ox-phrase-track" aria-hidden="true">
        <span key={reduceMotion ? "static" : index} className="ox-phrase-fill" />
      </div>
    </div>
  );
}
