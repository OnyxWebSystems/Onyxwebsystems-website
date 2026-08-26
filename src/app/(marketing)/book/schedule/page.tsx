import { ScheduleConsultationForm } from "../schedule-form";

export const metadata = { title: "Choose a consultation time" };

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] : (sp.token ?? "");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">Consultation</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Choose your time</h1>
      <p className="mt-4 text-sm text-[#5c5c5c]">
        These times are open on the Onyx Web Systems calendar. Pick one 30-minute slot and we will send the
        invitation.
      </p>
      <div className="mt-10">
        <ScheduleConsultationForm token={token} />
      </div>
    </div>
  );
}
