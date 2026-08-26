import { Reveal } from "./reveal";
import { ServicesLink } from "./services-link";
import styles from "./services.module.css";

export function DigitalProducts() {
  return (
    <section className="border-b border-black">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Digital products</p>
        </Reveal>

        <div className="mt-16">
          <article id="web" className={`${styles.editorial} scroll-mt-28 border-t border-black py-14 md:py-20`}>
            <div id="websites" className="scroll-mt-28">
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">Websites</p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Digital experiences built to perform.</h2>
                </div>
                <div>
                  <p className="max-w-xl text-base leading-relaxed text-[#5c5c5c]">
                    High-performance websites designed around your brand, audience and business goals.
                  </p>
                  <div className="mt-8">
                    <ServicesLink href="/services/websites" variant="ghost">
                      Explore websites
                    </ServicesLink>
                  </div>
                </div>
              </div>
            </Reveal>
            </div>
          </article>

          <article id="apps" className={`${styles.editorial} scroll-mt-28 border-t border-black py-14 md:py-20`}>
            <div id="applications" className="scroll-mt-28">
            <Reveal delayMs={80}>
              <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">Applications</p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Software built around your business.</h2>
                </div>
                <div>
                  <p className="max-w-xl text-base leading-relaxed text-[#5c5c5c]">
                    Custom applications designed around your workflows, users and operational requirements.
                  </p>
                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#5c5c5c]">
                    Recent work includes{" "}
                    <a
                      href="https://secnightlife.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-black underline underline-offset-4"
                    >
                      SEC Nightlife
                    </a>
                    {" "}
                    — a nightlife operations and guest experience platform.
                  </p>
                  <div className="mt-8">
                    <ServicesLink href="/services/applications" variant="ghost">
                      Explore applications
                    </ServicesLink>
                  </div>
                </div>
              </div>
            </Reveal>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
