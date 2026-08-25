import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import styles from "./services.module.css";

export function WorkHero({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-black">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Link href="/services" className={styles.workBack}>
          <span className={styles.workBackArrow} aria-hidden>
            ←
          </span>
          Services
        </Link>
        <p className="ox-reveal mt-10 text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">{kicker}</p>
        <h1 className="ox-reveal ox-reveal-delay-1 mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
          {title}
        </h1>
        <p className="ox-reveal ox-reveal-delay-2 mt-6 max-w-2xl text-base leading-relaxed text-[#5c5c5c] sm:text-lg">
          {body}
        </p>
        <div className="ox-rule ox-reveal-delay-3 mt-16 h-px w-full max-w-xs bg-black" />
      </div>
    </section>
  );
}

export function WorkCase({
  index,
  kicker,
  name,
  story,
  stage,
  actions,
}: {
  index: string;
  kicker: string;
  name: string;
  story: string;
  stage: ReactNode;
  actions: ReactNode;
}) {
  return (
    <article className={`${styles.editorial} border-t border-black py-14 md:py-20`}>
      <Reveal>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <div>{stage}</div>
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">
              {index} · {kicker}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{name}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5c5c5c]">{story}</p>
            <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
          </div>
        </div>
      </Reveal>
    </article>
  );
}

export function WorkCta({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: ReactNode;
}) {
  return (
    <section className="border-b border-black">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <h2 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">{body}</p>
          <div className="mt-10 flex flex-wrap gap-3">{actions}</div>
        </Reveal>
      </div>
    </section>
  );
}
