"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { DEFAULT_SCORING_WEIGHTS } from "@/server/partners/constants";

type Settings = {
  scoringWeights: typeof DEFAULT_SCORING_WEIGHTS;
  categories: string[];
  onyxServices: string[];
  minPartnerScore: number;
  minClientValueScore: number;
  defaultCommissionBps: number;
  minProjectValueCents: number;
};

export default function PartnerSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/partners/settings")
      .then(async (res) => {
        const data = (await res.json()) as { settings?: Settings; error?: string };
        if (!res.ok) throw new Error(data.error || "Could not load settings");
        setSettings(data.settings as Settings);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load settings"));
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    setError(null);
    setForbidden(false);
    const form = new FormData(event.currentTarget);
    const weights = {
      purchasingPower: Number(form.get("purchasingPower")),
      relevance: Number(form.get("relevance")),
      network: Number(form.get("network")),
      competition: Number(form.get("competition")),
      technologyGap: Number(form.get("technologyGap")),
      credibility: Number(form.get("credibility")),
      contactability: Number(form.get("contactability")),
      geography: Number(form.get("geography")),
    };
    const payload = {
      scoringWeights: weights,
      minPartnerScore: Number(form.get("minPartnerScore")),
      minClientValueScore: Number(form.get("minClientValueScore")),
      defaultCommissionBps: Number(form.get("defaultCommissionBps")),
      minProjectValueCents: Math.round(Number(form.get("minProjectValue")) * 100),
      categories: String(form.get("categories") || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      onyxServices: String(form.get("onyxServices") || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      const res = await fetch("/api/partners/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { settings?: Settings; error?: string };
      if (res.status === 403) {
        setForbidden(true);
        throw new Error("Only owners and managers can change these settings.");
      }
      if (!res.ok) throw new Error(data.error || "Could not save settings");
      setSettings(data.settings as Settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  const weights = settings?.scoringWeights ?? DEFAULT_SCORING_WEIGHTS;
  const field = "w-full border border-[var(--line)] bg-transparent px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <PageHeader
        label="Partner Engine"
        title="Settings"
        description="Scoring weights, categories, and programme defaults. Commission is stored for a later phase."
        actions={
          <Link href="/dashboard/partners" className="ox-btn-ghost px-4 py-2.5 text-sm font-semibold">
            Back
          </Link>
        }
      />
      {!settings && !error ? <p className="text-sm text-[var(--ink-muted)]">Loading…</p> : null}
      {settings ? (
        <form onSubmit={save} className="cx-card space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(weights).map(([key, value]) => (
              <label key={key} className="text-sm">
                <span className="mb-1 block text-xs text-[var(--ink-muted)]">{key}</span>
                <input name={key} type="number" min={0} max={40} defaultValue={value} className={field} />
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--ink-muted)]">Minimum partner score</span>
              <input name="minPartnerScore" type="number" defaultValue={settings.minPartnerScore} className={field} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--ink-muted)]">Minimum client value score</span>
              <input name="minClientValueScore" type="number" defaultValue={settings.minClientValueScore} className={field} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--ink-muted)]">Default commission %</span>
              <input name="defaultCommissionBps" type="number" defaultValue={settings.defaultCommissionBps} className={field} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-[var(--ink-muted)]">Minimum project value (USD)</span>
              <input name="minProjectValue" type="number" defaultValue={settings.minProjectValueCents / 100} className={field} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-[var(--ink-muted)]">Categories (one per line)</span>
            <textarea name="categories" rows={8} className={field} defaultValue={settings.categories.join("\n")} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-[var(--ink-muted)]">Onyx services (one per line)</span>
            <textarea name="onyxServices" rows={8} className={field} defaultValue={settings.onyxServices.join("\n")} />
          </label>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          {forbidden ? null : null}
          <button type="submit" disabled={busy} className="ox-btn-solid px-4 py-2.5 text-sm font-semibold">
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
