import { RescheduleConsultationForm } from "../reschedule-form";

export const metadata = { title: "Reschedule consultation" };

export default async function ReschedulePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] : (sp.token ?? "");

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[#5c5c5c]">Consultation</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Reschedule your meeting</h1>
      <p className="mt-4 text-sm text-[#5c5c5c]">
        You can choose another open time until the day of the meeting. On the day itself, this time is locked.
      </p>
      <div className="mt-10">
        <RescheduleConsultationForm token={token} />
      </div>
    </div>
  );
}
