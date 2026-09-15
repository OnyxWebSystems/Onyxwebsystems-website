"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PARTNER_CATEGORIES, PARTNER_STATUSES, STATUS_LABELS } from "@/server/partners/constants";

export function PartnerFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const values = useMemo(
    () => ({
      status: params.get("status") ?? "all",
      category: params.get("category") ?? "all",
      minScore: params.get("minScore") ?? "",
      q: params.get("q") ?? "",
    }),
    [params],
  );

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-3">
      <label className="text-xs">
        <span className="mb-1 block text-[var(--ink-muted)]">Status</span>
        <select
          className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
          value={values.status}
          onChange={(e) => setParam("status", e.target.value)}
        >
          <option value="all">All statuses</option>
          {PARTNER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        <span className="mb-1 block text-[var(--ink-muted)]">Category</span>
        <select
          className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
          value={values.category}
          onChange={(e) => setParam("category", e.target.value)}
        >
          <option value="all">All categories</option>
          {DEFAULT_PARTNER_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        <span className="mb-1 block text-[var(--ink-muted)]">Min score</span>
        <input
          type="number"
          min={0}
          max={100}
          className="w-24 border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
          value={values.minScore}
          onChange={(e) => setParam("minScore", e.target.value)}
        />
      </label>
      <label className="min-w-[180px] flex-1 text-xs">
        <span className="mb-1 block text-[var(--ink-muted)]">Search</span>
        <input
          className="w-full border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
          placeholder="Company, contact, website, industry"
          defaultValue={values.q}
          onBlur={(e) => setParam("q", e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value.trim());
          }}
        />
      </label>
      {params.toString() ? (
        <button type="button" className="ox-btn-ghost px-3 py-1.5 text-xs" onClick={() => router.push(pathname)}>
          Clear
        </button>
      ) : null}
    </div>
  );
}
