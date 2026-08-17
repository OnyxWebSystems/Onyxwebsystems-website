"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type Slot = {
  startsAt: string;
  label: string;
  employeeId: string;
  employeeName: string;
};

export function BookConsultationForm() {
  const router = useRouter();
  const [serviceInterest, setServiceInterest] = useState<"bos" | "app" | "web">("bos");
  const [modules, setModules] = useState<string[]>(["Customer Experience / Front Desk"]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ when: string; email: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    goals: "",
    startsAt: "",
    employeeId: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/public/consultation-slots?days=14`);
        const data = await res.json();
        if (!cancelled) setSlots(data.slots ?? []);
      } catch {
        if (!cancelled) setError("Could not load availability.");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.startsAt === form.startsAt),
    [slots, form.startsAt],
  );

  function toggleModule(mod: string) {
    setModules((prev) => (prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/book-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          serviceInterest,
          modules: serviceInterest === "bos" ? modules : [],
          employeeId: form.employeeId || selectedSlot?.employeeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setDone({ when: selectedSlot?.label ?? form.startsAt, email: form.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-black p-8">
        <p className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">Confirmed</p>
        <h2 className="mt-3 text-2xl font-semibold">Consultation booked</h2>
        <p className="mt-3 text-sm text-[#5c5c5c]">
          We sent a confirmation to <span className="text-black">{done.email}</span>.
        </p>
        <p className="mt-2 text-sm text-[#5c5c5c]">When: {done.when}</p>
        <button
          type="button"
          className="mt-6 border border-black px-4 py-2 text-sm"
          onClick={() => router.push("/")}
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["name", "Full name", "text"],
            ["email", "Email", "email"],
            ["phone", "Phone", "tel"],
            ["company", "Company", "text"],
          ] as const
        ).map(([key, label, type]) => (
          <label key={key} className="block text-sm sm:col-span-1">
            <span className="mb-1 block text-[#5c5c5c]">{label}</span>
            <input
              required={key !== "company"}
              type={type}
              className="w-full border border-black/20 bg-white px-3 py-2 outline-none focus:border-black"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
      </div>

      <fieldset>
        <legend className="text-sm text-[#5c5c5c]">Service interest</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["bos", "Business Operating Systems"],
              ["app", "App Development"],
              ["web", "Web Development"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setServiceInterest(value)}
              className={`border px-3 py-2 text-sm ${
                serviceInterest === value ? "ox-btn-solid border-black" : "border-black/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {serviceInterest === "bos" ? (
        <fieldset>
          <legend className="text-sm text-[#5c5c5c]">BOS modules (select all that apply)</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {BOS_MODULES.map((mod) => (
              <label key={mod} className="flex items-start gap-2 border border-black/15 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={modules.includes(mod)}
                  onChange={() => toggleModule(mod)}
                  className="mt-1"
                />
                <span>{mod}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block text-[#5c5c5c]">Goals / notes</span>
        <textarea
          rows={4}
          className="w-full border border-black/20 bg-white px-3 py-2 outline-none focus:border-black"
          value={form.goals}
          onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
          placeholder="What are you trying to create, connect, or convert?"
        />
      </label>

      <fieldset>
        <legend className="text-sm text-[#5c5c5c]">Consultation slot (30 min)</legend>
        {loadingSlots ? (
          <p className="mt-3 text-sm text-[#5c5c5c]">Loading availability…</p>
        ) : slots.length === 0 ? (
          <p className="mt-3 text-sm text-[#5c5c5c]">No open slots — email onyxwebsystems@gmail.com</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {slots.map((slot) => (
              <button
                key={slot.startsAt}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    startsAt: slot.startsAt,
                    employeeId: slot.employeeId,
                  }))
                }
                className={`border px-3 py-2 text-left text-sm ${
                  form.startsAt === slot.startsAt ? "ox-btn-solid border-black" : "border-black/20"
                }`}
              >
                <div className="font-medium">{slot.label}</div>
                <div className="mt-0.5 text-xs opacity-70">{slot.employeeName}</div>
              </button>
            ))}
          </div>
        )}
      </fieldset>

      {error ? <p className="text-sm text-[#8b1538]">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !form.startsAt}
        className="ox-btn-solid px-6 py-3 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Booking…" : "Confirm consultation"}
      </button>
    </form>
  );
}
