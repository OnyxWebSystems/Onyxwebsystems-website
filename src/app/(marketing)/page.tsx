import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { InteractiveGrid } from "@/components/marketing/interactive-grid";
import { ScrollCardStack } from "@/components/marketing/scroll-card-stack";
import { ServiceCards } from "@/components/marketing/service-cards";

export default function HomePage() {
  return (
    <div className="relative">
      <InteractiveGrid />
      <ScrollCardStack />
      <Hero />
      <ServiceCards />

      <section className="relative z-10 border-y border-black">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight">Custom Solutions. Custom Pricing.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#5c5c5c]">
            Every engagement is scoped to your modules, workflows, and growth goals. No fixed menu pricing — we
            design the system, then quote the work.
          </p>
          <Link href="/book" className="ox-btn-solid mt-8 inline-flex w-full items-center justify-center px-6 py-3 text-sm font-medium sm:w-auto">
            Get a Custom Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
