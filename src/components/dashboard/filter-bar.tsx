"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type FilterBarProps = {
  showChannel?: boolean;
  showStatus?: boolean;
  showSearch?: boolean;
  statusOptions?: { value: string; label: string }[];
  channelOptions?: { value: string; label: string }[];
};

const DATE_PRESETS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "today", label: "Today" },
  { value: "custom", label: "Custom" },
];

const DEFAULT_CHANNELS = [
  { value: "all", label: "All channels" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "facebook", label: "Social (FB)" },
  { value: "instagram", label: "Social (IG)" },
  { value: "chat", label: "Chat" },
  { value: "website", label: "Website" },
];

const DEFAULT_STATUS = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "escalated", label: "Escalated" },
];

export function FilterBar({
  showChannel = true,
  showStatus = true,
  showSearch = true,
  statusOptions = DEFAULT_STATUS,
  channelOptions = DEFAULT_CHANNELS,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const values = useMemo(
    () => ({
      range: params.get("range") ?? "30",
      from: params.get("from") ?? "",
      to: params.get("to") ?? "",
      channel: params.get("channel") ?? "all",
      status: params.get("status") ?? "all",
      q: params.get("q") ?? "",
    }),
    [params],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      if (key === "range" && value !== "custom") {
        next.delete("from");
        next.delete("to");
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, router],
  );

  function clearAll() {
    router.push(pathname);
  }

  const hasFilters = [...params.keys()].length > 0;

  return (
    <div className="flex flex-wrap items-end gap-3 border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-3">
      <label className="text-xs">
        <span className="mb-1 block text-[var(--ink-muted)]">Date</span>
        <select
          className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
          value={values.range}
          onChange={(e) => setParam("range", e.target.value)}
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      {values.range === "custom" ? (
        <>
          <label className="text-xs">
            <span className="mb-1 block text-[var(--ink-muted)]">From</span>
            <input
              type="date"
              className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
              value={values.from}
              onChange={(e) => setParam("from", e.target.value)}
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-[var(--ink-muted)]">To</span>
            <input
              type="date"
              className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
              value={values.to}
              onChange={(e) => setParam("to", e.target.value)}
            />
          </label>
        </>
      ) : null}

      {showChannel ? (
        <label className="text-xs">
          <span className="mb-1 block text-[var(--ink-muted)]">Channel</span>
          <select
            className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
            value={values.channel}
            onChange={(e) => setParam("channel", e.target.value)}
          >
            {channelOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showStatus ? (
        <label className="text-xs">
          <span className="mb-1 block text-[var(--ink-muted)]">Status</span>
          <select
            className="border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
            value={values.status}
            onChange={(e) => setParam("status", e.target.value)}
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showSearch ? (
        <label className="min-w-[180px] flex-1 text-xs">
          <span className="mb-1 block text-[var(--ink-muted)]">Search</span>
          <input
            className="w-full border border-[var(--line)] bg-transparent px-2 py-1.5 text-sm"
            placeholder="Name, phone, email, ticket #"
            defaultValue={values.q}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setParam("q", (e.target as HTMLInputElement).value.trim());
              }
            }}
            onBlur={(e) => setParam("q", e.target.value.trim())}
          />
        </label>
      ) : null}

      {hasFilters ? (
        <button
          type="button"
          onClick={clearAll}
          className="border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
