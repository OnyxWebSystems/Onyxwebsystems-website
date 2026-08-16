import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">About</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">A technology partner for operators</h1>
      <p className="mt-6 text-base leading-relaxed text-[#5c5c5c]">
        Onyx Web Systems builds Business Operating Systems, applications, and web experiences that help companies
        create demand, connect channels, and convert conversations into booked work.
      </p>
      <p className="mt-4 text-base leading-relaxed text-[#5c5c5c]">
        We work as a long-term technology partner — scoping modules around how your team actually runs, then wiring
        the front desk, pipeline, ops, and follow-ups into one coherent system.
      </p>
      <Link
        href="/book"
        className="ox-btn-solid mt-10 inline-block px-5 py-2.5 text-sm font-medium"
      >
        Book a Consultation
      </Link>
    </div>
  );
}
