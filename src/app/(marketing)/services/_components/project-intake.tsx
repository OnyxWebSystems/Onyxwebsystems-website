"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BOS_MODULES,
  CONFIRMATION_STEPS,
  INTAKE_PRESET_EVENT,
  INVESTMENT_OPTIONS,
  LOOKING_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  type InvestmentId,
  type LookingFor,
  type TimelineId,
} from "./data";
import { Reveal } from "./reveal";
import { ServicesButton, ServicesLink } from "./services-link";
import { cn } from "@/lib/utils";
import styles from "./services.module.css";

type IntakeState = {
  lookingFor: LookingFor | "";
  modules: string[];
  problem: string;
  company: string;
  industry: string;
  website: string;
  teamSize: string;
  timeline: TimelineId | "";
  investment: InvestmentId | "";
  name: string;
  email: string;
  phone: string;
};

const INITIAL: IntakeState = {
  lookingFor: "",
  modules: [],
  problem: "",
  company: "",
  industry: "",
  website: "",
  teamSize: "",
  timeline: "",
  investment: "",
  name: "",
  email: "",
  phone: "",
};

const STEPS = [
  { n: "01", title: "Intent" },
  { n: "02", title: "Problem" },
  { n: "03", title: "Business" },
  { n: "04", title: "Scope" },
  { n: "05", title: "Contact" },
];

function Tile({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={cn(styles.tile, selected && styles.tileOn, "px-4 py-3 text-sm")}>
      {children}
    </button>
  );
}

export function ProjectIntake() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<IntakeState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    function onPreset(event: Event) {
      const lookingFor = (event as CustomEvent<{ lookingFor?: LookingFor }>).detail?.lookingFor;
      if (!lookingFor) return;
      setForm((f) => ({ ...f, lookingFor }));
      setStep(0);
      setDone(false);
      setError(null);
    }
    window.addEventListener(INTAKE_PRESET_EVENT, onPreset);
    return () => window.removeEventListener(INTAKE_PRESET_EVENT, onPreset);
  }, []);

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  function toggleModule(label: string) {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(label) ? f.modules.filter((m) => m !== label) : [...f.modules, label],
    }));
  }

  function canContinue() {
    if (step === 0) {
      if (!form.lookingFor) return false;
      if (form.lookingFor === "bos" && form.modules.length === 0) return false;
      return true;
    }
    if (step === 1) return form.problem.trim().length >= 8;
    if (step === 2) return form.company.trim().length > 0 && form.teamSize.length > 0;
    if (step === 3) return Boolean(form.timeline && form.investment);
    if (step === 4) return form.name.trim().length >= 2 && form.email.includes("@") && form.phone.trim().length >= 7;
    return false;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/project-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lookingFor: form.lookingFor,
          modules: form.lookingFor === "bos" ? form.modules : [],
          problem: form.problem,
          company: form.company,
          industry: form.industry || null,
          website: form.website || null,
          teamSize: form.teamSize,
          timeline: form.timeline,
          investment: form.investment,
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit project request");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit project request");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section id="start-a-project" className="scroll-mt-28 border-b border-black">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Start a project</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Request received.</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5c5c5c]">
            We&apos;ve received your project details. Our team will review your requirements and determine the best
            next step.
          </p>
          <ol className="mt-12 max-w-xl">
            {CONFIRMATION_STEPS.map((item) => (
              <li key={item.n} className="grid grid-cols-[72px_1fr] border-t border-black/15 py-4">
                <span className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">{item.n}</span>
                <span className="text-sm font-medium uppercase tracking-[0.12em]">{item.title}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <ServicesLink href="/book" variant="solid">
              Book a consultation
            </ServicesLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="start-a-project" className="scroll-mt-28 border-b border-black">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.22em] text-[#5c5c5c]">Start a project</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Start a project.</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5c5c5c]">
            Tell us what you&apos;re building. We&apos;ll determine the best way to build it.
          </p>
        </Reveal>

        <div className="mt-12 max-w-3xl">
          <div className="flex items-end justify-between gap-6">
            <p className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">
              {STEPS[step].n} — {STEPS[step].title}
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-[#5c5c5c]">
              {step + 1} / {STEPS.length}
            </p>
          </div>
          <div className="mt-3 h-px bg-black/10">
            <div className="h-px bg-black" style={{ width: `${progress}%`, transition: "width 400ms ease" }} />
          </div>

          <form
            className="mt-10"
            onSubmit={(e) => {
              e.preventDefault();
              if (step < STEPS.length - 1) {
                if (canContinue()) setStep((s) => s + 1);
                return;
              }
              if (canContinue()) void submit();
            }}
          >
            {step === 0 ? (
              <fieldset>
                <legend className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">What are you looking for?</legend>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {LOOKING_OPTIONS.map((option) => (
                    <Tile
                      key={option.id}
                      selected={form.lookingFor === option.id}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          lookingFor: option.id,
                          modules: option.id === "bos" ? f.modules : [],
                        }))
                      }
                    >
                      {option.label}
                    </Tile>
                  ))}
                </div>
                {form.lookingFor === "bos" ? (
                  <div className="mt-10">
                    <p className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">Which modules?</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {BOS_MODULES.map((mod) => (
                        <Tile
                          key={mod.id}
                          selected={form.modules.includes(mod.label)}
                          onClick={() => toggleModule(mod.label)}
                        >
                          {mod.label}
                        </Tile>
                      ))}
                    </div>
                  </div>
                ) : null}
              </fieldset>
            ) : null}

            {step === 1 ? (
              <label className="block">
                <span className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">
                  What problem are you trying to solve?
                </span>
                <textarea
                  rows={6}
                  required
                  className="mt-4 w-full border border-black/20 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                  value={form.problem}
                  onChange={(e) => setForm((f) => ({ ...f, problem: e.target.value }))}
                  placeholder="Describe the operational gap, product, or system you need."
                />
              </label>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    ["company", "Company", "text"],
                    ["industry", "Industry", "text"],
                    ["website", "Website", "text"],
                  ] as const
                ).map(([key, label, type]) => (
                  <label key={key} className="block text-sm">
                    <span className="mb-2 block uppercase tracking-[0.16em] text-[#5c5c5c]">{label}</span>
                    <input
                      required={key === "company"}
                      type={type}
                      className="w-full border border-black/20 bg-white px-4 py-3 outline-none focus:border-black"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </label>
                ))}
                <fieldset className="sm:col-span-2">
                  <legend className="mb-3 text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">Team size</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TEAM_SIZE_OPTIONS.map((size) => (
                      <Tile key={size} selected={form.teamSize === size} onClick={() => setForm((f) => ({ ...f, teamSize: size }))}>
                        {size}
                      </Tile>
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-10">
                <fieldset>
                  <legend className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">Project timeline</legend>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {TIMELINE_OPTIONS.map((option) => (
                      <Tile
                        key={option.id}
                        selected={form.timeline === option.id}
                        onClick={() => setForm((f) => ({ ...f, timeline: option.id }))}
                      >
                        {option.label}
                      </Tile>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm uppercase tracking-[0.16em] text-[#5c5c5c]">Investment range</legend>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {INVESTMENT_OPTIONS.map((option) => (
                      <Tile
                        key={option.id}
                        selected={form.investment === option.id}
                        onClick={() => setForm((f) => ({ ...f, investment: option.id }))}
                      >
                        {option.label}
                      </Tile>
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    ["name", "Name", "text"],
                    ["email", "Email", "email"],
                    ["phone", "Phone", "tel"],
                  ] as const
                ).map(([key, label, type]) => (
                  <label key={key} className={`block text-sm ${key === "phone" ? "sm:col-span-2" : ""}`}>
                    <span className="mb-2 block uppercase tracking-[0.16em] text-[#5c5c5c]">{label}</span>
                    <input
                      required
                      type={type}
                      className="w-full border border-black/20 bg-white px-4 py-3 outline-none focus:border-black"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
            ) : null}

            {error ? <p className="mt-6 text-sm text-[#8b1538]">{error}</p> : null}

            <div className="mt-10 flex flex-wrap items-center gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  className="border border-black/20 px-5 py-3 text-sm text-[#5c5c5c] transition-colors hover:border-black hover:text-black"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <ServicesButton type="submit" variant="solid" disabled={!canContinue()}>
                  Continue
                </ServicesButton>
              ) : (
                <ServicesButton type="submit" variant="solid" disabled={!canContinue() || submitting}>
                  {submitting ? "Submitting…" : "Submit project request"}
                </ServicesButton>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
