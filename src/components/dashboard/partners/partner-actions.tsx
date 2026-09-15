"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTRACT_STATUSES, PARTNER_STATUSES, STATUS_LABELS } from "@/server/partners/constants";

export function PartnerActions({
  partnerId,
  status,
  contractStatus,
  doNotContact,
  hasWebsite,
}: {
  partnerId: string;
  status: string;
  contractStatus: string;
  doNotContact: boolean;
  hasWebsite: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(label: string, path: string, method = "POST") {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(path, { method });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  async function patch(body: Record<string, unknown>, label = "Saving…") {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="ox-btn-solid px-3 py-2 text-sm font-semibold"
          disabled={Boolean(busy) || !hasWebsite}
          onClick={() => run("Researching partner…", `/api/partners/${partnerId}/research`)}
        >
          {busy === "Researching partner…" ? "Researching partner…" : "Research partner"}
        </button>
        <button
          type="button"
          className="ox-btn-ghost px-3 py-2 text-sm"
          disabled={Boolean(busy)}
          onClick={() => run("Generating score…", `/api/partners/${partnerId}/score`)}
        >
          {busy === "Generating score…" ? "Generating score…" : "Score"}
        </button>
        <button
          type="button"
          className="ox-btn-ghost px-3 py-2 text-sm"
          disabled={Boolean(busy)}
          onClick={() => run("Generating analysis…", `/api/partners/${partnerId}/analyze`)}
        >
          {busy?.startsWith("Generating analysis") ? "Generating analysis…" : "Analyse"}
        </button>
        <button
          type="button"
          className="ox-btn-ghost px-3 py-2 text-sm"
          disabled={Boolean(busy) || doNotContact}
          onClick={() => run("Generating message…", `/api/partners/${partnerId}/outreach`)}
        >
          {busy === "Generating message…" ? "Generating message…" : "Generate message"}
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="text-xs">
          <span className="mb-1 block text-[var(--ink-muted)]">Status</span>
          <select
            className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
            value={status}
            disabled={Boolean(busy)}
            onChange={(e) => patch({ status: e.target.value })}
          >
            {PARTNER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-[var(--ink-muted)]">Agreement</span>
          <select
            className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
            value={contractStatus}
            disabled={Boolean(busy)}
            onChange={(e) => patch({ contractStatus: e.target.value })}
          >
            {CONTRACT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ox-btn-ghost self-end px-3 py-1.5 text-xs"
          disabled={Boolean(busy) || doNotContact}
          onClick={() => patch({ doNotContact: true })}
        >
          Mark do not contact
        </button>
        <button
          type="button"
          className="ox-btn-ghost self-end px-3 py-1.5 text-xs"
          disabled={Boolean(busy)}
          onClick={() => patch({ status: "ARCHIVED" })}
        >
          Archive
        </button>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {busy && !error ? <p className="text-sm text-[var(--ink-muted)]">{busy}</p> : null}
    </div>
  );
}
