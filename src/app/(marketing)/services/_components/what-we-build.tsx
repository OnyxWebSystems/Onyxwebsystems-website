import { Reveal } from "./reveal";
import { ServicesLink } from "./services-link";
import styles from "./services.module.css";

export function WhatWeBuild() {
  return (
    <section className="border-b border-black">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">What we build</p>
        </Reveal>

        <div className="mt-16 space-y-4">
          <article className={`${styles.editorial} border-t border-black py-12 md:py-16`}>
            <Reveal>
              <div className="grid gap-8 md:grid-cols-[120px_1fr] md:items-start">
                <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">01</p>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Business Operating Systems</h2>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">
                    Connected systems that help businesses manage sales, customers, finance, people and operations
                    through one intelligent operating layer.
                  </p>
                  <div className="mt-8">
                    <ServicesLink href="#operating-systems" variant="ghost">
                      Explore operating systems
                    </ServicesLink>
                  </div>
                </div>
              </div>
            </Reveal>
          </article>

          <article className={`${styles.editorial} border-t border-black py-12 md:py-16`}>
            <Reveal delayMs={80}>
              <div className="grid gap-8 md:grid-cols-[120px_1fr] md:items-start">
                <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">02</p>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Digital Products</h2>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#5c5c5c]">
                    High-performance websites and custom applications designed around your brand, users and business
                    goals.
                  </p>
                  <div className="ox-cta-row mt-8">
                    <ServicesLink href="/services/websites" variant="ghost">
                      Explore websites
                    </ServicesLink>
                    <ServicesLink href="/services/applications" variant="ghost">
                      Explore applications
                    </ServicesLink>
                  </div>
                </div>
              </div>
            </Reveal>
          </article>
        </div>
      </div>
    </section>
  );
}
