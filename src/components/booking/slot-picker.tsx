"use client";

import { useEffect, useMemo, useState } from "react";
import { COMMON_TIMEZONES, BUSINESS_TIMEZONE, timezoneLabel } from "@/lib/timezones";

type Slot = {
  startsAt: string;
  endsAt: string;
  label: string;
  dayLabel: string;
  localLabel: string;
  sastLabel: string;
  dateKey: string;
};

type Day = {
  dateKey: string;
  dayLabel: string;
  slots: Slot[];
};

function startOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1));
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function SlotPicker({
  value,
  timeZone,
  onChange,
  onTimeZoneChange,
}: {
  value: string;
  timeZone: string;
  onChange: (startsAt: string, slot: Slot | null) => void;
  onTimeZoneChange: (timeZone: string) => void;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [zones, setZones] = useState<string[]>([...COMMON_TIMEZONES]);

  useEffect(() => {
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setZones((prev) => (prev.includes(browser) ? prev : [browser, ...prev]));
    if (!timeZone) onTimeZoneChange(browser || BUSINESS_TIMEZONE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/public/consultation-slots?days=42&timeZone=${encodeURIComponent(timeZone || BUSINESS_TIMEZONE)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        setDays(data.days ?? []);
        if (data.error) setError(data.error);
        else setError(null);
        const first = (data.days as Day[] | undefined)?.[0]?.dateKey;
        setSelectedDate((current) => current ?? first ?? null);
      } catch {
        if (!cancelled) setError("Could not load availability.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [timeZone]);

  const available = useMemo(() => new Set(days.map((d) => d.dateKey)), [days]);
  const selectedDay = days.find((d) => d.dateKey === selectedDate);
  const monthLabel = new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const cells = useMemo(() => {
    const first = startOfMonth(cursor.y, cursor.m);
    const pad = first.getUTCDay();
    const count = daysInMonth(cursor.y, cursor.m);
    const items: { key: string; dateKey: string | null; day: number | null; open: boolean }[] = [];
    for (let i = 0; i < pad; i++) items.push({ key: `pad-${i}`, dateKey: null, day: null, open: false });
    for (let d = 1; d <= count; d++) {
      const dateKey = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      items.push({ key: dateKey, dateKey, day: d, open: available.has(dateKey) });
    }
    return items;
  }, [cursor, available]);

  return (
    <div className="border border-black/15">
      <div className="flex flex-col gap-4 border-b border-black/10 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#5c5c5c]">Choose a time</p>
          <p className="mt-1 text-sm text-[#5c5c5c]">Only open Onyx hours are shown. Times convert to South Africa time for our team.</p>
        </div>
        <label className="w-full text-sm sm:w-auto">
          <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-[#5c5c5c]">Timezone</span>
          <select
            className="w-full border border-black/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-black sm:w-auto"
            value={timeZone}
            onChange={(e) => {
              onChange("", null);
              onTimeZoneChange(e.target.value);
            }}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {timezoneLabel(zone)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              className="min-h-11 border border-black/15 px-3 text-sm"
              onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
            >
              Previous
            </button>
            <p className="text-center text-sm font-medium">{monthLabel}</p>
            <button
              type="button"
              className="min-h-11 border border-black/15 px-3 text-sm"
              onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
            >
              Next
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.12em] text-[#7a7a76]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) =>
              cell.day == null ? (
                <div key={cell.key} className="aspect-square" />
              ) : (
                <button
                  key={cell.key}
                  type="button"
                  disabled={!cell.open}
                  onClick={() => {
                    if (!cell.dateKey) return;
                    setSelectedDate(cell.dateKey);
                    onChange("", null);
                  }}
                  className={`min-h-11 text-sm transition-colors sm:aspect-square sm:min-h-0 ${
                    cell.open
                      ? selectedDate === cell.dateKey
                        ? "bg-black text-white"
                        : "bg-[#f4f3f0] text-black hover:bg-black hover:text-white"
                      : "cursor-not-allowed text-[#c5c5c1]"
                  }`}
                >
                  {cell.day}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="border-t border-black/10 p-4 lg:border-l lg:border-t-0">
          {loading ? (
            <p className="text-sm text-[#5c5c5c]">Loading open times…</p>
          ) : error ? (
            <p className="text-sm text-[#8b1538]">{error}</p>
          ) : !selectedDay ? (
            <p className="text-sm text-[#5c5c5c]">Select a highlighted day to see times.</p>
          ) : (
            <>
              <p className="text-sm font-medium">{selectedDay.dayLabel}</p>
              <p className="mt-1 text-xs text-[#7a7a76]">Times shown in {timezoneLabel(timeZone)}</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedDay.slots.map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() => onChange(slot.startsAt, slot)}
                    className={`min-h-12 border px-3 py-2 text-left text-sm ${
                      value === slot.startsAt ? "ox-btn-solid border-black" : "border-black/20 hover:border-black"
                    }`}
                  >
                    <div>{slot.localLabel}</div>
                    <div className="mt-0.5 text-[11px] opacity-70">
                      {slot.sastLabel} SAST · 30 min
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
