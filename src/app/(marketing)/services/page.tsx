import Link from "next/link";

export const metadata = { title: "Services" };

const BOS_MODULES = [
  "Customer Experience / Front Desk",
  "Lead Management & Speed-to-Lead",
  "Sales & CRM",
  "Marketing",
  "Operations",
  "Customer Support",
  "Internal Comms",
  "Reporting & Analytics",
  "Follow-Ups",
  "Document / Data Processing",
  "Custom Agents / Workflows",
  "Custom module",
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">Services</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Built to operate, not just look finished</h1>
      <p className="mt-4 max-w-2xl text-sm text-[#5c5c5c]">
        Modules are scoped per client. Complete interconnected systems are available when you are ready to run the
        whole stack.
      </p>

      <section id="bos" className="mt-16 scroll-mt-24 border-t border-black pt-10">
        <h2 className="text-2xl font-semibold">Business Operating Systems</h2>
        <p className="mt-3 max-w-2xl text-sm text-[#5c5c5c]">
          Replace fragmented tools with a connected operating layer — starting with the digital front desk and
          expanding into the modules your business actually needs.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BOS_MODULES.map((mod) => (
            <div key={mod} className="border border-black/15 px-4 py-3 text-sm">
              {mod}
            </div>
          ))}
        </div>
      </section>

      <section id="apps" className="mt-16 scroll-mt-24 border-t border-black pt-10">
        <h2 className="text-2xl font-semibold">App Development</h2>
        <p className="mt-3 max-w-2xl text-sm text-[#5c5c5c]">
          Custom web and mobile applications designed around real operations — from guest experience to internal
          workflows.
        </p>
        <div className="mt-8 border border-black p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">Portfolio</div>
          <h3 className="mt-2 text-xl font-semibold">SEC Nightlife</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5c5c5c]">
            Nightlife operations and guest experience platform built for SEC Nightlife — covering event discovery,
            venue presence, and the operational layer behind a multi-venue nightlife brand.
          </p>
          <a
            href="https://secnightlife.com"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
          >
            secnightlife.com
          </a>
        </div>
      </section>

      <section id="web" className="mt-16 scroll-mt-24 border-t border-black pt-10">
        <h2 className="text-2xl font-semibold">Web Development</h2>
        <p className="mt-3 max-w-2xl text-sm text-[#5c5c5c]">
          Premium marketing sites, landing pages, booking flows, dashboards, and integrations — designed to convert
          and connect into your operating system.
        </p>
      </section>

      <section className="mt-16 border border-black bg-[#fafafa] p-8">
        <h2 className="text-2xl font-semibold">Custom Solutions. Custom Pricing.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[#5c5c5c]">
          We quote after understanding scope, modules, and outcomes — not from a public price list.
        </p>
        <Link
          href="/book"
          className="ox-btn-solid mt-6 inline-block px-5 py-2.5 text-sm font-medium"
        >
          Book a Consultation
        </Link>
      </section>
    </div>
  );
}
