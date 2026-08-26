"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./services.module.css";

const MOTIONS = ["clip", "left", "rise", "right", "scale"] as const;

let motionCursor = 0;

function nextMotion() {
  const motion = MOTIONS[motionCursor % MOTIONS.length];
  motionCursor += 1;
  return motion;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

function shouldAnimate() {
  return (
    window.matchMedia("(max-width: 1023px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(true);
  const [motion] = useState(nextMotion);

  useEffect(() => {
    const el = ref.current;
    if (!el || !shouldAnimate()) return;

    const rect = el.getBoundingClientRect();
    const visible = rect.top < window.innerHeight * 0.9 && rect.bottom > 48;
    if (visible) return;

    setShown(false);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "80px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-ox-reveal=""
      data-ox-motion={motion}
      className={cn(shown ? styles.revealed : styles.hidden, className)}
      style={{ transitionDelay: shown ? `${delayMs}ms` : "0ms" } as CSSProperties}
    >
      {children}
    </div>
  );
}
