import { LogoStage, LogoSwap } from "../_components/logo-swap";
import { ServicesLink } from "../_components/services-link";
import { TestimonialButton } from "../_components/testimonial-lightbox";
import { WorkCase, WorkCta, WorkHero } from "../_components/work-case";

export const metadata = { title: "Websites" };

export default function WebsitesPage() {
  return (
    <div>
      <WorkHero
        kicker="Digital products · Websites"
        title="Sites that carry a brand — and convert."
        body="Two recent builds: a Pretoria streetwear house that needed a story people could walk into, and a nightlife platform that needed a public face as sharp as the product behind it."
      />

      <section>
        <div className="mx-auto max-w-6xl px-6">
          <WorkCase
            index="01"
            kicker="Streetwear · Pretoria"
            name="Thrift Rotate"
            story="Thrift Rotate is a Hatfield streetwear brand born in the township — inspired by the rich and the poor, driven by faith and ambition. We built them a site that tells that origin story in full, then lets people buy the collection the way the brand actually sells: Instagram and WhatsApp, one rotation at a time."
            stage={
              <LogoSwap
                whiteSrc="/work/thrift-rotate-bag-white.png"
                blackSrc="/work/thrift-rotate-bag-black.png"
                alt="Thrift Rotate logo"
              />
            }
            actions={
              <>
                <ServicesLink href="https://onyxwebsystems.github.io/thrift-rotate-website">
                  View website
                </ServicesLink>
                <TestimonialButton />
              </>
            }
          />

          <WorkCase
            index="02"
            kicker="Nightlife · South Africa"
            name="SEC"
            story="SEC Nightlife is the operating layer for the South African night — discover events, book tables, browse menus, and walk in with tickets ready. We built about.secnightlife.com as the brand site that explains the platform to guests and venues before they ever open the app."
            stage={<LogoStage src="/work/sec-logo.png" alt="SEC Nightlife logo" />}
            actions={
              <ServicesLink href="https://about.secnightlife.com/">View website</ServicesLink>
            }
          />
        </div>
      </section>

      <WorkCta
        title="Ready for a website that works as hard as the business behind it?"
        body="Tell us what you're launching. We'll scope the story, the build, and the path from first visit to booked work."
        actions={
          <>
            <ServicesLink href="/services?intent=website#start-a-project" variant="solid">
              Book a website
            </ServicesLink>
            <ServicesLink href="/book">Book a consultation</ServicesLink>
          </>
        }
      />
    </div>
  );
}
