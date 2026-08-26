"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlotPicker } from "@/components/booking/slot-picker";
import { BUSINESS_TIMEZONE, formatInTimeZone } from "@/lib/timezones";

export function ScheduleConsultationForm({ token }: { token: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [timeZone, setTimeZone] = useState(BUSINESS_TIMEZONE);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/confirm-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, startsAt, timeZone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not book that time.");
      setDone(formatInTimeZone(new Date(startsAt), timeZone));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book that time.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="border border-black p-8">
        <h2 className="text-2xl font-semibold">This scheduling link is missing.</h2>
        <p className="mt-3 text-sm text-[#5c5c5c]">
          Open the link from your Onyx Web Systems email, or write to onyxwebsystems@gmail.com.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="border border-black p-8">
        <p className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">Confirmed</p>
        <h2 className="mt-3 text-2xl font-semibold">Consultation booked</h2>
        <p className="mt-3 text-sm text-[#5c5c5c]">When: {done}</p>
        <p className="mt-2 text-sm text-[#5c5c5c]">We sent a calendar invitation to your email.</p>
        <button type="button" className="mt-6 border border-black px-4 py-2 text-sm" onClick={() => router.push("/")}>
          Back to home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <SlotPicker value={startsAt} timeZone={timeZone} onChange={(next) => setStartsAt(next)} onTimeZoneChange={setTimeZone} />
      {error ? <p className="text-sm text-[#8b1538]">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting || !startsAt}
        className="ox-btn-solid w-full px-6 py-3 text-sm font-medium disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Scheduling…" : "Confirm this time"}
      </button>
    </form>
  );
}
