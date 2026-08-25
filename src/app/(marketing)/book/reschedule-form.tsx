"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SlotPicker } from "@/components/booking/slot-picker";
import { BUSINESS_TIMEZONE, formatInTimeZone } from "@/lib/timezones";

export function RescheduleConsultationForm({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [currentWhen, setCurrentWhen] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [timeZone, setTimeZone] = useState(BUSINESS_TIMEZONE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/reschedule-consultation?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setBlocked(data.error ?? "This reschedule link is invalid.");
          return;
        }
        if (!data.canReschedule) {
          setBlocked("This meeting can no longer be rescheduled on the day it takes place.");
          return;
        }
        setCurrentWhen(formatInTimeZone(new Date(data.startsAt), data.guestTimeZone || BUSINESS_TIMEZONE));
        if (data.guestTimeZone) setTimeZone(data.guestTimeZone);
      } catch {
        if (!cancelled) setBlocked("Could not load this meeting.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/reschedule-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, startsAt, timeZone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reschedule.");
      setDone(formatInTimeZone(new Date(startsAt), timeZone));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reschedule.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-[#5c5c5c]">Loading your meeting…</p>;

  if (blocked) {
    return (
      <div className="border border-black p-8">
        <h2 className="text-2xl font-semibold">Reschedule unavailable</h2>
        <p className="mt-3 text-sm text-[#5c5c5c]">{blocked}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="border border-black p-8">
        <p className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">Updated</p>
        <h2 className="mt-3 text-2xl font-semibold">Consultation rescheduled</h2>
        <p className="mt-3 text-sm text-[#5c5c5c]">When: {done}</p>
        <button type="button" className="mt-6 border border-black px-4 py-2 text-sm" onClick={() => router.push("/")}>
          Back to home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {currentWhen ? <p className="text-sm text-[#5c5c5c]">Current time: {currentWhen}</p> : null}
      <SlotPicker value={startsAt} timeZone={timeZone} onChange={(next) => setStartsAt(next)} onTimeZoneChange={setTimeZone} />
      {error ? <p className="text-sm text-[#8b1538]">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting || !startsAt}
        className="ox-btn-solid px-6 py-3 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Confirm new time"}
      </button>
    </form>
  );
}
