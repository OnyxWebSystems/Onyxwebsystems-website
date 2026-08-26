import { PROCESS_STEPS } from "./data";
import { Reveal } from "./reveal";

export function HowWeWork() {
  return (
    <section className="border-b border-black">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">How we work</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">From problem to system.</h2>
        </Reveal>

        <ol className="mt-16">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step.n} className="border-t border-black/15">
              <Reveal delayMs={Math.min(index * 70, 280)}>
                <div className="grid gap-3 py-7 sm:grid-cols-[88px_220px_1fr] sm:items-baseline sm:gap-8">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">{step.n}</p>
                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#5c5c5c] sm:text-base">{step.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
