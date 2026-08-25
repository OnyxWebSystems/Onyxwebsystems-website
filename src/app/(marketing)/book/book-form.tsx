"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlotPicker } from "@/components/booking/slot-picker";
import { BUSINESS_TIMEZONE, formatInTimeZone } from "@/lib/timezones";
import {
  APP_FEATURES,
  APP_PLATFORMS,
  APP_USERS,
  BOS_MODULES,
  BOS_STAGES,
  EXISTING_WEBSITE,
  TEAM_SIZES,
  TIMELINES,
  WEB_FEATURES,
  WEB_NEEDS,
  intakeIsComplete,
  type BookingIntake,
  type ServiceInterest,
} from "@/lib/booking-intake";

function ChoiceGroup({
  legend,
  options,
  value,
  onChange,
  multiple,
}: {
  legend: string;
  options: readonly string[];
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multiple?: boolean;
}) {
  function toggle(option: string) {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      onChange(current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
      return;
    }
    onChange(option);
  }

  return (
    <fieldset>
      <legend className="text-sm text-[#5c5c5c]">{legend}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = multiple ? Array.isArray(value) && value.includes(option) : value === option;
          return (
            <label key={option} className="flex items-start gap-2 border border-black/15 px-3 py-2 text-sm">
              <input
                type={multiple ? "checkbox" : "radio"}
                name={legend}
                checked={checked}
                onChange={() => toggle(option)}
                className="mt-1"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function BookConsultationForm() {
  const router = useRouter();
  const [serviceInterest, setServiceInterest] = useState<ServiceInterest>("bos");
  const [modules, setModules] = useState<string[]>(["Customer Experience / Front Desk"]);
  const [intake, setIntake] = useState<BookingIntake>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [timeZone, setTimeZone] = useState(BUSINESS_TIMEZONE);
  const [done, setDone] = useState<{ email: string; when: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    goals: "",
  });

  function toggleModule(mod: string) {
    setModules((prev) => (prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) {
      setError("Please choose a date and time before requesting a consultation.");
      return;
    }
    if (serviceInterest === "bos" && modules.length === 0) {
      setError("Select at least one BOS module so we know what to prepare.");
      return;
    }
    if (!intakeIsComplete(serviceInterest, intake)) {
      setError("Choose the service details below so we can prepare for the meeting.");
      return;
    }
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
          intake,
          startsAt,
          timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setDone({
        email: form.email,
        when: formatInTimeZone(new Date(startsAt), timeZone),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-black p-8">
        <p className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">Consultation booked</p>
        <h2 className="mt-3 text-2xl font-semibold">Check your email</h2>
        <p className="mt-3 text-sm text-[#5c5c5c]">
          We sent a confirmation and calendar invitation to <span className="text-black">{done.email}</span>.
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
              onClick={() => {
                setServiceInterest(value);
                setIntake({});
              }}
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
        <>
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
          <ChoiceGroup
            legend="Where are you in the process?"
            options={BOS_STAGES}
            value={intake.stage ?? ""}
            onChange={(next) => setIntake((prev) => ({ ...prev, stage: String(next) }))}
          />
          <ChoiceGroup
            legend="Team size"
            options={TEAM_SIZES}
            value={intake.teamSize ?? ""}
            onChange={(next) => setIntake((prev) => ({ ...prev, teamSize: String(next) }))}
          />
        </>
      ) : null}

      {serviceInterest === "web" ? (
        <>
          <ChoiceGroup
            legend="What do you need?"
            options={WEB_NEEDS}
            value={intake.webNeed ?? []}
            onChange={(next) => setIntake((prev) => ({ ...prev, webNeed: Array.isArray(next) ? next : [next] }))}
            multiple
          />
          <ChoiceGroup
            legend="Which pages or features matter?"
            options={WEB_FEATURES}
            value={intake.webFeatures ?? []}
            onChange={(next) => setIntake((prev) => ({ ...prev, webFeatures: Array.isArray(next) ? next : [next] }))}
            multiple
          />
          <ChoiceGroup
            legend="Do you already have a website?"
            options={EXISTING_WEBSITE}
            value={intake.existingWebsite ?? ""}
            onChange={(next) => setIntake((prev) => ({ ...prev, existingWebsite: String(next) }))}
          />
          <ChoiceGroup
            legend="Timeline"
            options={TIMELINES}
            value={intake.timeline ?? ""}
            onChange={(next) => setIntake((prev) => ({ ...prev, timeline: String(next) }))}
          />
        </>
      ) : null}

      {serviceInterest === "app" ? (
        <>
          <ChoiceGroup
            legend="Platform"
            options={APP_PLATFORMS}
            value={intake.appPlatform ?? []}
            onChange={(next) => setIntake((prev) => ({ ...prev, appPlatform: Array.isArray(next) ? next : [next] }))}
            multiple
          />
          <ChoiceGroup
            legend="Who will use it?"
            options={APP_USERS}
            value={intake.appUsers ?? []}
            onChange={(next) => setIntake((prev) => ({ ...prev, appUsers: Array.isArray(next) ? next : [next] }))}
            multiple
          />
          <ChoiceGroup
            legend="Which features should we prepare for?"
            options={APP_FEATURES}
            value={intake.appFeatures ?? []}
            onChange={(next) => setIntake((prev) => ({ ...prev, appFeatures: Array.isArray(next) ? next : [next] }))}
            multiple
          />
          <ChoiceGroup
            legend="Timeline"
            options={TIMELINES}
            value={intake.timeline ?? ""}
            onChange={(next) => setIntake((prev) => ({ ...prev, timeline: String(next) }))}
          />
        </>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block text-[#5c5c5c]">Goals / notes</span>
        <textarea
          rows={4}
          className="w-full border border-black/20 bg-white px-3 py-2 outline-none focus:border-black"
          value={form.goals}
          onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
          placeholder="Anything else we should prepare for before the meeting?"
        />
      </label>

      <SlotPicker
        value={startsAt}
        timeZone={timeZone}
        onChange={(next) => setStartsAt(next)}
        onTimeZoneChange={setTimeZone}
      />

      {error ? <p className="text-sm text-[#8b1538]">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !startsAt}
        className="ox-btn-solid px-6 py-3 text-sm font-medium disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Request consultation"}
      </button>
    </form>
  );
}
