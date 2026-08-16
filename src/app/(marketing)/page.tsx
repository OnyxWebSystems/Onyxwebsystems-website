import Link from "next/link";
import { ServiceCards } from "@/components/marketing/service-cards";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-black">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-6 py-20">
          <p className="ox-reveal text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Technology partner</p>
          <h1 className="ox-reveal ox-reveal-delay-1 mt-4 text-5xl font-bold tracking-tight lowercase sm:text-7xl">
            onyxwebsystems
          </h1>
          <div className="ox-rule ox-reveal-delay-2 mt-6 h-px w-40 bg-black" />
          <p className="ox-reveal ox-reveal-delay-2 mt-6 max-w-xl text-lg tracking-[0.08em] text-[#5c5c5c]">
            CREATE. CONNECT. CONVERT.
          </p>
          <p className="ox-reveal ox-reveal-delay-3 mt-4 max-w-lg text-base text-[#5c5c5c]">
            Business Operating Systems, custom apps, and premium web experiences — built as one connected stack.
          </p>
          <div className="ox-reveal ox-reveal-delay-3 mt-10 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="ox-btn-solid px-6 py-3 text-sm font-medium"
            >
              Book a Consultation
            </Link>
            <Link
              href="/services"
              className="border border-black px-6 py-3 text-sm font-medium transition-colors hover:bg-[#0a0a0a] hover:text-[#ffffff]"
            >
              Explore services
            </Link>
          </div>
        </div>
      </section>

      <ServiceCards />

      <section className="border-y border-black bg-[#fafafa]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight">Custom Solutions. Custom Pricing.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#5c5c5c]">
            Every engagement is scoped to your modules, workflows, and growth goals. No fixed menu pricing — we
            design the system, then quote the work.
          </p>
          <Link
            href="/book"
            className="ox-btn-solid mt-8 inline-block px-6 py-3 text-sm font-medium"
          >
            Get a Custom Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
