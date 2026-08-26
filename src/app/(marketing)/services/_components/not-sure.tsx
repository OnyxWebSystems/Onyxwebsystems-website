"use client";

import { INTAKE_PRESET_EVENT } from "./data";
import { Reveal } from "./reveal";
import { ServicesButton } from "./services-link";

export function NotSure() {
  function goToIntake() {
    window.dispatchEvent(new CustomEvent(INTAKE_PRESET_EVENT, { detail: { lookingFor: "not-sure" } }));
    document.getElementById("start-a-project")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="border-b border-black bg-[#fafafa]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Not sure where to start?</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5c5c5c]">
            Tell us what&apos;s happening in your business. We&apos;ll help identify where technology can make the
            biggest impact.
          </p>
          <div className="mt-8">
            <ServicesButton variant="solid" onClick={goToIntake}>
              Find the right solution
            </ServicesButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
