import Link from "next/link";
import { OnyxCardStack } from "@/components/brand/onyx-card-stack";
import { ServicePhraseCarousel } from "@/components/marketing/service-phrase-carousel";

export function Hero() {
  return (
    <section className="ox-hero relative">
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:min-h-[92vh] md:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
        <div className="relative z-10 max-w-3xl">
          <p className="ox-reveal text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">CREATE. CONNECT. CONVERT.</p>
          <h1 className="ox-reveal ox-reveal-delay-1 mt-6 font-[family-name:var(--font-syne)] text-4xl font-bold leading-[0.95] tracking-tight min-[390px]:text-5xl sm:text-7xl">
            We build
            <br />
            systems that
          </h1>
          <div className="ox-reveal ox-reveal-delay-2 mt-4">
            <ServicePhraseCarousel />
          </div>
          <p className="ox-reveal ox-reveal-delay-3 mt-8 max-w-lg text-base leading-relaxed text-[#5c5c5c]">
            Business Operating Systems, custom apps, and premium web experiences — built as one connected stack.
          </p>
          <div className="ox-reveal ox-reveal-delay-3 ox-cta-row mt-10">
            <Link href="/book" className="ox-btn-solid px-6 py-3 text-sm font-medium">
              Book a Consultation
            </Link>
            <Link href="/services" className="ox-btn-outline px-6 py-3 text-sm font-medium">
              Explore services
            </Link>
          </div>
        </div>
        <div className="ox-hero-stage relative z-10 hidden min-h-[16rem] md:flex md:items-center md:justify-end lg:min-h-[28rem]">
          <div className="ox-hero-brand">
            <div id="ox-hero-card-slot" className="ox-hero-card-slot" aria-hidden="true">
              <OnyxCardStack className="ox-hero-card-static" size={168} />
            </div>
            <span className="ox-hero-wordmark">onyxwebsystems</span>
          </div>
        </div>
      </div>
    </section>
  );
}
