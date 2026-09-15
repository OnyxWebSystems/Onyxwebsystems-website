"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PartnerScoreBadge, PartnerStatusBadge } from "./score-badge";
import { PARTNER_STATUSES, STATUS_LABELS } from "@/server/partners/constants";

export type PartnerRow = {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  companySize: string | null;
  targetClientDescription: string | null;
  partnerScore: number;
  clientValueScore: number;
  fitScore: number;
  competitionRiskScore: number;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  contactPageUrl: string | null;
  status: string;
  recommendedAction: string | null;
  doNotContact: boolean;
};

export function PartnerTable({ partners }: { partners: PartnerRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("QUALIFIED");
  const allIds = useMemo(() => partners.map((p) => p.id), [partners]);

  async function bulk(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/partners/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, ...body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Bulk update failed");
      setSelected([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {selected.length ? (
        <div className="flex flex-wrap items-center gap-2 border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 text-sm">
          <span>{selected.length} selected</span>
          <select
            className="border border-[var(--line)] bg-transparent px-2 py-1 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {PARTNER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <button type="button" className="ox-btn-ghost px-3 py-1.5 text-xs" disabled={busy} onClick={() => bulk({ status })}>
            Assign status
          </button>
          <button type="button" className="ox-btn-ghost px-3 py-1.5 text-xs" disabled={busy} onClick={() => bulk({ archive: true })}>
            Archive
          </button>
          <button
            type="button"
            className="ox-btn-ghost px-3 py-1.5 text-xs"
            disabled={busy}
            onClick={() => bulk({ doNotContact: true })}
          >
            Mark do not contact
          </button>
          <button type="button" className="ox-btn-ghost px-3 py-1.5 text-xs" disabled={busy} onClick={() => bulk({ tags: ["HOT"] })}>
            Tag HOT
          </button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {busy ? <p className="text-sm text-[var(--ink-muted)]">Saving…</p> : null}
      <div className="overflow-x-auto border border-[var(--line)]">
        <table className="cx-table min-w-[1100px]">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.length > 0 && selected.length === allIds.length}
                  onChange={(e) => setSelected(e.target.checked ? allIds : [])}
                  aria-label="Select all partners"
                />
              </th>
              <th>Company</th>
              <th>Website</th>
              <th>Industry</th>
              <th>Location</th>
              <th>Size</th>
              <th>Target client</th>
              <th>Score</th>
              <th>Client value</th>
              <th>Onyx fit</th>
              <th>Competition risk</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Recommended action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(partner.id)}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked ? [...current, partner.id] : current.filter((id) => id !== partner.id),
                      )
                    }
                    aria-label={`Select ${partner.companyName}`}
                  />
                </td>
                <td>
                  <Link href={`/dashboard/partners/${partner.id}`} className="font-medium underline-offset-2 hover:underline">
                    {partner.companyName}
                  </Link>
                  {partner.doNotContact ? (
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--danger)]">Do not contact</div>
                  ) : null}
                </td>
                <td>
                  {partner.website ? (
                    <a href={partner.website} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                      {partner.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{partner.industry || "—"}</td>
                <td>{[partner.city, partner.country].filter(Boolean).join(", ") || "—"}</td>
                <td>{partner.companySize || "Unknown"}</td>
                <td className="max-w-[180px] truncate">{partner.targetClientDescription || "Unknown"}</td>
                <td>
                  <PartnerScoreBadge score={partner.partnerScore} />
                </td>
                <td>{partner.clientValueScore}</td>
                <td>{partner.fitScore}</td>
                <td>{partner.competitionRiskScore}</td>
                <td>
                  {partner.primaryContactEmail || partner.contactPageUrl ? "Available" : "Not found"}
                </td>
                <td>
                  <PartnerStatusBadge status={partner.status} />
                </td>
                <td className="max-w-[200px]">{partner.recommendedAction || "—"}</td>
                <td>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link href={`/dashboard/partners/${partner.id}`} className="underline-offset-2 hover:underline">
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!partners.length ? (
              <tr>
                <td colSpan={15} className="px-4 py-6 text-sm text-[var(--ink-muted)]">
                  No partners match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
