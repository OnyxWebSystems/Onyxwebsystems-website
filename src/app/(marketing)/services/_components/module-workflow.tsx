"use client";

import { useEffect, useRef, useState } from "react";
import { SALES_WORKFLOW } from "./data";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";
import styles from "./services.module.css";

export function ModuleWorkflow() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.28 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="border-b border-black bg-[#fafafa]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Sales</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            Turn more opportunities into revenue.
          </h2>
        </Reveal>

        <div ref={ref} className="mt-16">
          <ol className="hidden md:grid md:grid-cols-6 md:gap-0">
            {SALES_WORKFLOW.map((step, index) => (
              <li key={step} className="relative">
                {index < SALES_WORKFLOW.length - 1 ? (
                  <span
                    className={cn(
                      "absolute left-[calc(50%+18px)] right-[-18px] top-[11px] h-px bg-black",
                      styles.flowRuleH,
                      on && styles.flowRuleHOn,
                    )}
                    style={{ transitionDelay: on ? `${index * 90}ms` : "0ms" }}
                  />
                ) : null}
                <div
                  className={cn(styles.flowStep, on && styles.flowStepOn)}
                  style={{ transitionDelay: on ? `${index * 90}ms` : "0ms" }}
                >
                  <span className="mb-4 block h-2.5 w-2.5 border border-black bg-white" />
                  <p className="text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">{String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.12em]">{step}</p>
                </div>
              </li>
            ))}
          </ol>

          <ol className="relative md:hidden">
            <span
              className={cn("absolute bottom-4 left-[4px] top-1 w-px bg-black", styles.flowRule, on && styles.flowRuleOn)}
            />
            {SALES_WORKFLOW.map((step, index) => (
              <li
                key={step}
                className={cn("relative pl-8", styles.flowStep, on && styles.flowStepOn)}
                style={{ transitionDelay: on ? `${index * 90}ms` : "0ms" }}
              >
                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 border border-black bg-white" />
                <p className="text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">{String(index + 1).padStart(2, "0")}</p>
                <p className="mb-6 mt-1 text-sm font-medium uppercase tracking-[0.12em]">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
