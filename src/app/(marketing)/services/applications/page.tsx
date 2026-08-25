import { LogoStage } from "../_components/logo-swap";
import { ServicesLink } from "../_components/services-link";
import { WorkCase, WorkCta, WorkHero } from "../_components/work-case";

export const metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return (
    <div>
      <WorkHero
        kicker="Digital products · Applications"
        title="Software shaped around how the night actually runs."
        body="SEC Nightlife is a guest experience and venue operations platform — one product for discovering events, booking tables, hosting nights, hiring staff, and getting paid."
      />

      <section>
        <div className="mx-auto max-w-6xl px-6">
          <WorkCase
            index="01"
            kicker="Nightlife operations"
            name="SEC Nightlife"
            story="SEC brings party-goers and venues onto the same platform. Guests find what's on, book or join tables with a clear minimum spend, browse menus, buy tickets, host their own nights, and apply for nightlife jobs. Venues list themselves, publish events, run promotions, hire promoters, and get paid through Sec Wallet — all from one operating layer."
            stage={<LogoStage src="/work/sec-logo.png" alt="SEC Nightlife logo" />}
            actions={
              <ServicesLink href="https://secnightlife.com" variant="solid">
                Open the app
              </ServicesLink>
            }
          />
        </div>
      </section>

      <WorkCta
        title="Need an application built around how you actually operate?"
        body="We design custom web and mobile products from the workflow out — then connect them to the rest of the business."
        actions={
          <>
            <ServicesLink href="/services?intent=application#start-a-project" variant="solid">
              Start an application project
            </ServicesLink>
            <ServicesLink href="/book">Book a consultation</ServicesLink>
          </>
        }
      />
    </div>
  );
}
