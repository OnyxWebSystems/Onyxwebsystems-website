"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Slot = {
  startsAt: string;
  endsAt: string;
  label: string;
  dayLabel: string;
};

export function ScheduleConsultationForm({ token }: { token: string }) {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/public/consultation-slots?days=14");
        const data = await res.json();
        if (!cancelled) {
          setSlots(data.slots ?? []);
          if (data.error) setError(data.error);
        }
      } catch {
        if (!cancelled) setError("Could not load availability.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const list = map.get(slot.dayLabel) ?? [];
      list.push(slot);
      map.set(slot.dayLabel, list);
    }
    return [...map.entries()];
  }, [slots]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/confirm-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, startsAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not book that time.");
      const picked = slots.find((s) => s.startsAt === startsAt);
      setDone(picked?.label ?? startsAt);
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
        <p className="mt-3 text-sm text-[#5c5c5c]">When: {done} (Arizona time)</p>
        <p className="mt-2 text-sm text-[#5c5c5c]">
          We sent a calendar invitation to your email and added the meeting to the Onyx Google Calendar.
        </p>
        <button type="button" className="mt-6 border border-black px-4 py-2 text-sm" onClick={() => router.push("/")}>
          Back to home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {loading ? (
        <p className="text-sm text-[#5c5c5c]">Loading open times from the Onyx calendar…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-[#5c5c5c]">
          No open slots right now — email onyxwebsystems@gmail.com and we will find a time.
        </p>
      ) : (
        grouped.map(([day, daySlots]) => (
          <fieldset key={day}>
            <legend className="text-sm text-[#5c5c5c]">{day}</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {daySlots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() => setStartsAt(slot.startsAt)}
                  className={`border px-3 py-2 text-left text-sm ${
                    startsAt === slot.startsAt ? "ox-btn-solid border-black" : "border-black/20"
                  }`}
                >
                  {new Date(slot.startsAt).toLocaleTimeString("en-US", {
                    timeZone: "America/Phoenix",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  <div className="mt-0.5 text-xs opacity-70">30 min · Arizona time</div>
                </button>
              ))}
            </div>
          </fieldset>
        ))
      )}

      {error ? <p className="text-sm text-[#8b1538]">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !startsAt}
        className="ox-btn-solid px-6 py-3 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Scheduling…" : "Confirm this time"}
      </button>
    </form>
  );
}
