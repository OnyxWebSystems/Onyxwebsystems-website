"use client";

import { useEffect, useMemo, useState } from "react";
import { BUSINESS_TIMEZONE, formatInTimeZone } from "@/lib/timezones";

type Hours = { open: string; close: string } | null;
type BusinessHours = Record<"sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat", Hours>;

const DAYS: { key: keyof BusinessHours; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_HOURS: BusinessHours = {
  mon: { open: "09:00", close: "17:00" },
  tue: { open: "09:00", close: "17:00" },
  wed: { open: "09:00", close: "17:00" },
  thu: { open: "09:00", close: "17:00" },
  fri: { open: "09:00", close: "17:00" },
  sat: null,
  sun: null,
};

type Override = {
  id: string;
  date: string;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
};

type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  customer: string;
};

function dateKeyFromIsoDate(value: string) {
  return value.slice(0, 10);
}

export function AvailabilityCalendar() {
  const now = new Date();
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState("09:00");
  const [customClose, setCustomClose] = useState("17:00");

  async function load() {
    const res = await fetch("/api/dashboard/availability");
    const data = await res.json();
    if (data.businessHours) setHours({ ...DEFAULT_HOURS, ...data.businessHours });
    setOverrides(data.overrides ?? []);
    setAppointments(data.appointments ?? []);
  }

  useEffect(() => {
    load().catch(() => setMessage("Could not load calendar."));
  }, []);

  const overrideByDate = useMemo(() => {
    const map = new Map<string, Override>();
    for (const row of overrides) map.set(dateKeyFromIsoDate(row.date), row);
    return map;
  }, [overrides]);

  const bookedByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const key = new Date(appt.startsAt).toLocaleDateString("en-CA", { timeZone: BUSINESS_TIMEZONE });
      const list = map.get(key) ?? [];
      list.push(appt);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
    const pad = first.getUTCDay();
    const count = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
    const items: { key: string; dateKey: string | null; day: number | null }[] = [];
    for (let i = 0; i < pad; i++) items.push({ key: `pad-${i}`, dateKey: null, day: null });
    for (let d = 1; d <= count; d++) {
      const dateKey = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      items.push({ key: dateKey, dateKey, day: d });
    }
    return items;
  }, [cursor]);

  function weekdayKey(dateKey: string): keyof BusinessHours {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dow] as keyof BusinessHours;
  }

  function dayState(dateKey: string) {
    const override = overrideByDate.get(dateKey);
    if (override?.isClosed) return "blocked";
    if (override?.startTime) return "custom";
    if (hours[weekdayKey(dateKey)]) return "open";
    return "closed";
  }

  async function saveHours() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessHours: hours }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Weekly hours saved. Website visitors will only see these times.");
    } catch {
      setMessage("Could not save weekly hours.");
    } finally {
      setSaving(false);
    }
  }

  async function saveOverride(payload: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      await load();
      setMessage("Date availability updated.");
    } catch {
      setMessage("Could not update that date.");
    } finally {
      setSaving(false);
    }
  }

  const selectedOverride = selected ? overrideByDate.get(selected) : null;
  const selectedBookings = selected ? bookedByDate.get(selected) ?? [] : [];
  const monthLabel = new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
      <section className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
        <h2 className="text-sm font-semibold">Weekly hours (South Africa)</h2>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          These hours are the default open times visitors can book. Closed days stay empty on the public calendar.
        </p>
        <div className="mt-4 space-y-3">
          {DAYS.map(({ key, label }) => {
            const value = hours[key];
            return (
              <div key={key} className="grid grid-cols-[110px_1fr] items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        [key]: e.target.checked ? { open: "09:00", close: "17:00" } : null,
                      }))
                    }
                  />
                  {label}
                </label>
                {value ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      className="border border-[var(--line)] bg-transparent px-2 py-1"
                      value={value.open}
                      onChange={(e) => setHours((prev) => ({ ...prev, [key]: { open: e.target.value, close: value.close } }))}
                    />
                    <span className="text-[var(--ink-muted)]">to</span>
                    <input
                      type="time"
                      className="border border-[var(--line)] bg-transparent px-2 py-1"
                      value={value.close}
                      onChange={(e) => setHours((prev) => ({ ...prev, [key]: { open: value.open, close: e.target.value } }))}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-[var(--ink-muted)]">Closed</span>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={saveHours}
          disabled={saving}
          className="ox-btn-solid mt-5 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save weekly hours"}
        </button>
      </section>

      <section className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">{monthLabel}</h2>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Click a day to block it, open custom hours, or review bookings.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="ox-btn-ghost px-3 py-1 text-sm"
              onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
            >
              Previous
            </button>
            <button
              type="button"
              className="ox-btn-ghost px-3 py-1 text-sm"
              onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            if (!cell.dateKey || cell.day == null) return <div key={cell.key} className="min-h-20" />;
            const state = dayState(cell.dateKey);
            const booked = bookedByDate.get(cell.dateKey)?.length ?? 0;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelected(cell.dateKey)}
                className={`min-h-20 border p-2 text-left text-sm ${
                  selected === cell.dateKey ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{cell.day}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      state === "open" || state === "custom" ? "bg-emerald-500" : "bg-neutral-400"
                    }`}
                  />
                </div>
                <div className="mt-2 text-[11px] text-[var(--ink-muted)]">
                  {state === "blocked" ? "Blocked" : state === "closed" ? "Closed" : state === "custom" ? "Custom" : "Open"}
                  {booked ? ` · ${booked} booked` : ""}
                </div>
              </button>
            );
          })}
        </div>

        {selected ? (
          <div className="mt-5 border border-[var(--line)] p-4">
            <p className="text-sm font-semibold">{selected}</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {selectedOverride?.isClosed
                ? "Blocked for bookings."
                : selectedOverride?.startTime
                  ? `Custom hours ${selectedOverride.startTime}–${selectedOverride.endTime} SAST`
                  : hours[weekdayKey(selected)]
                    ? `Weekly hours ${hours[weekdayKey(selected)]?.open}–${hours[weekdayKey(selected)]?.close} SAST`
                    : "Closed by weekly hours."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="ox-btn-ghost px-3 py-2 text-sm"
                onClick={() => saveOverride({ date: selected, isClosed: true })}
              >
                Block this day
              </button>
              <button
                type="button"
                className="ox-btn-ghost px-3 py-2 text-sm"
                onClick={() => saveOverride({ date: selected, remove: true })}
              >
                Use weekly hours
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-xs">
                Open
                <input
                  type="time"
                  className="mt-1 block border border-[var(--line)] bg-transparent px-2 py-1"
                  value={customOpen}
                  onChange={(e) => setCustomOpen(e.target.value)}
                />
              </label>
              <label className="text-xs">
                Close
                <input
                  type="time"
                  className="mt-1 block border border-[var(--line)] bg-transparent px-2 py-1"
                  value={customClose}
                  onChange={(e) => setCustomClose(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="ox-btn-solid px-3 py-2 text-sm"
                onClick={() =>
                  saveOverride({
                    date: selected,
                    isClosed: false,
                    startTime: customOpen,
                    endTime: customClose,
                  })
                }
              >
                Set custom hours
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {selectedBookings.length === 0 ? (
                <p className="text-xs text-[var(--ink-muted)]">No consultations booked on this day.</p>
              ) : (
                selectedBookings.map((appt) => (
                  <div key={appt.id} className="border border-[var(--line)] px-3 py-2 text-sm">
                    <div className="font-medium">{appt.customer}</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      {formatInTimeZone(new Date(appt.startsAt), BUSINESS_TIMEZONE)} · {appt.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {message ? <p className="mt-4 text-sm text-[var(--ink-muted)]">{message}</p> : null}
      </section>
    </div>
  );
}
