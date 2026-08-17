"use client";

import { useState } from "react";
import { BOS_MODULES } from "./data";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";
import styles from "./services.module.css";

function modulePoint(index: number, count: number, radius = 34) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

export function OperatingSystem() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = BOS_MODULES.find((m) => m.id === activeId) ?? null;

  return (
    <section id="bos" className="scroll-mt-28 border-b border-black">
      <div id="operating-systems" className="mx-auto max-w-6xl scroll-mt-28 px-6 py-24">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Business operating systems</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            One business.
            <br />
            One connected system.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">
            We replace fragmented tools and repetitive processes with connected modules designed around how your
            business actually works.
          </p>
        </Reveal>

        <div className="mt-16 hidden lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center lg:gap-12">
          <div className="relative mx-auto aspect-square w-full max-w-[620px] overflow-visible">
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
              {BOS_MODULES.map((mod, index) => {
                const p = modulePoint(index, BOS_MODULES.length);
                return (
                  <line
                    key={mod.id}
                    x1="50"
                    y1="50"
                    x2={p.x}
                    y2={p.y}
                    className={cn(styles.spoke, activeId === mod.id && styles.spokeActive)}
                  />
                );
              })}
            </svg>

            <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-black bg-white text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                Onyx
                <br />
                OS
              </p>
            </div>

            {BOS_MODULES.map((mod, index) => {
              const p = modulePoint(index, BOS_MODULES.length);
              const on = activeId === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  className={cn(
                    styles.node,
                    "w-[140px] border bg-white px-2.5 py-2.5 text-center text-[10px] font-medium uppercase leading-tight tracking-[0.12em]",
                    on ? `border-black ${styles.nodeActive}` : "border-black/20",
                  )}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onMouseEnter={() => setActiveId(mod.id)}
                  onFocus={() => setActiveId(mod.id)}
                  aria-pressed={on}
                >
                  {mod.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-[240px] border-t border-black pt-6">
            {!active ? (
              <p className="text-sm text-[#5c5c5c]">Hover a module to inspect the operating layer.</p>
            ) : (
              <div key={active.id} className={cn(styles.detail, styles.detailOpen)}>
                <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">Module</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">{active.label}</h3>
                <ul className="mt-5 space-y-2">
                  {active.capabilities.map((item) => (
                    <li key={item} className="border-b border-black/10 py-2 text-sm text-[#5c5c5c]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 lg:hidden">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center border border-black text-center text-[10px] font-semibold uppercase tracking-[0.16em]">
              Onyx
              <br />
              OS
            </div>
            <p className="text-sm text-[#5c5c5c]">Select a module to see how it connects.</p>
          </div>
          <ul>
            {BOS_MODULES.map((mod) => {
              const on = activeId === mod.id;
              return (
                <li key={mod.id} className="border-t border-black/15">
                  <button
                    type="button"
                    className="flex w-full items-baseline justify-between gap-4 py-4 text-left"
                    onClick={() => setActiveId(on ? null : mod.id)}
                    aria-expanded={on}
                  >
                    <span className="text-sm font-medium uppercase tracking-[0.14em]">{mod.label}</span>
                    <span className="text-xs text-[#5c5c5c]">{on ? "–" : "+"}</span>
                  </button>
                  <div className={cn(styles.detail, on && styles.detailOpen, on && "pb-5")}>
                    {on ? (
                      <ul className="space-y-1.5 pb-2">
                        {mod.capabilities.map((item) => (
                          <li key={item} className="text-sm text-[#5c5c5c]">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
