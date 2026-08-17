import { ServicesLink } from "./services-link";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="border-b border-black">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <h2 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Let&apos;s build what your business needs next.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">
            Whether you&apos;re replacing manual processes, launching a new digital product or building the
            infrastructure for your next stage of growth, let&apos;s talk.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ServicesLink href="#start-a-project" variant="solid">
              Start a project
            </ServicesLink>
            <ServicesLink href="/book" variant="ghost">
              Book a consultation
            </ServicesLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
