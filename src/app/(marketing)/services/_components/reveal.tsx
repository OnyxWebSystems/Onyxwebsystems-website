"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./services.module.css";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "80px 0px 80px 0px" },
    );
    io.observe(el);
    const fallback = window.setTimeout(() => setShown(true), 900);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(shown ? styles.revealed : styles.hidden, className)}
      style={{ transitionDelay: shown ? `${delayMs}ms` : "0ms" } as CSSProperties}
    >
      {children}
    </div>
  );
}
