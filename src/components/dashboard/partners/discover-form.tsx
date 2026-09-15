"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PARTNER_CATEGORIES, ONYX_SERVICES, PARTNER_TYPES } from "@/server/partners/constants";

export function DiscoverForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setExistingId(null);
    const form = new FormData(event.currentTarget);
    const keywords = String(form.get("keywords") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const services = form.getAll("services").map(String);
    const payload = {
      companyName: String(form.get("companyName") || ""),
      website: String(form.get("website") || "") || null,
      category: String(form.get("category") || "") || null,
      country: String(form.get("country") || "") || null,
      province: String(form.get("province") || "") || null,
      city: String(form.get("city") || "") || null,
      industry: String(form.get("industry") || "") || null,
      companySize: String(form.get("companySize") || "") || null,
      targetClientSize: String(form.get("targetClientSize") || "") || null,
      targetClientDescription: String(form.get("targetClientDescription") || "") || null,
      keywords,
      recommendedServices: services,
      partnerType: String(form.get("partnerType") || "REFERRAL"),
      primaryContactName: String(form.get("primaryContactName") || "") || null,
      primaryContactRole: String(form.get("primaryContactRole") || "") || null,
      primaryContactEmail: String(form.get("primaryContactEmail") || "") || null,
      source: "manual",
    };

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { partner?: { id: string }; error?: string; existingId?: string };
      if (res.status === 409 && data.existingId) {
        setExistingId(data.existingId);
        setError(data.error || "This company is already in the partner database.");
        return;
      }
      if (!res.ok || !data.partner) throw new Error(data.error || "Could not add partner");
      router.push(`/dashboard/partners/${data.partner.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add partner");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full border border-[var(--line)] bg-transparent px-3 py-2 text-sm";

  return (
    <form onSubmit={onSubmit} className="cx-card space-y-5 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Company name</span>
          <input name="companyName" required className={field} />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Website</span>
          <input name="website" placeholder="https://" className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Partner category</span>
          <select name="category" className={field} defaultValue="Business Consultants">
            {DEFAULT_PARTNER_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            <option value="Custom">Custom</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Partner type</span>
          <select name="partnerType" className={field} defaultValue="REFERRAL">
            {PARTNER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Country</span>
          <input name="country" defaultValue="South Africa" className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Region / province</span>
          <input name="province" className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">City</span>
          <input name="city" className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Industry</span>
          <input name="industry" className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Number of employees</span>
          <input name="companySize" placeholder="e.g. 11-50" className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Client size</span>
          <input name="targetClientSize" placeholder="e.g. mid-market SMEs" className={field} />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Target client / client revenue range</span>
          <textarea name="targetClientDescription" rows={3} className={field} />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Keywords</span>
          <input name="keywords" placeholder="Comma separated" className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Decision maker</span>
          <input name="primaryContactName" className={field} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Role</span>
          <input name="primaryContactRole" className={field} />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-xs text-[var(--ink-muted)]">Public business email</span>
          <input name="primaryContactEmail" type="email" className={field} />
        </label>
      </div>
      <fieldset>
        <legend className="cx-label mb-2">Preferred Onyx services</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ONYX_SERVICES.map((service) => (
            <label key={service} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="services" value={service} />
              {service}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? (
        <p className="text-sm text-[var(--danger)]">
          {error}{" "}
          {existingId ? (
            <a href={`/dashboard/partners/${existingId}`} className="underline">
              Open existing record
            </a>
          ) : null}
        </p>
      ) : null}
      <button type="submit" disabled={busy} className="ox-btn-solid px-4 py-2.5 text-sm font-semibold">
        {busy ? "Saving…" : "Add partner"}
      </button>
    </form>
  );
}
