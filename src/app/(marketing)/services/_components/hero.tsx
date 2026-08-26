import { ServicesLink } from "./services-link";

export function ServicesHero() {
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
      <div className="relative mx-auto flex max-w-6xl flex-col justify-center px-6 py-16 md:min-h-[78vh] md:py-24">
        <p className="ox-reveal text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Services</p>
        <h1 className="ox-reveal ox-reveal-delay-1 mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-[4.5rem] lg:leading-[1.05]">
          We build the systems behind modern businesses.
        </h1>
        <p className="ox-reveal ox-reveal-delay-2 mt-6 max-w-2xl text-base leading-relaxed text-[#5c5c5c] sm:text-lg">
          From business operating systems to high-performance websites and custom applications, Onyx designs and
          builds digital infrastructure around how your business actually operates.
        </p>
        <div className="ox-reveal ox-reveal-delay-3 ox-cta-row mt-10">
          <ServicesLink href="#start-a-project" variant="solid">
            Start a project
          </ServicesLink>
          <ServicesLink href="/book" variant="ghost">
            Book a consultation
          </ServicesLink>
        </div>
        <div className="ox-rule ox-reveal-delay-3 mt-16 h-px w-full max-w-xs bg-black" />
      </div>
    </section>
  );
}
