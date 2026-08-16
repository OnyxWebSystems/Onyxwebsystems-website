"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageHeader } from "@/components/dashboard/page-header";
import { RETELL_ANALYTICS_URL } from "@/lib/retell-links";

type Metrics = {
  totals: {
    conversations: number;
    appointments: number;
    tickets: number;
    escalations: number;
    leads: number;
    bookingConversionRate: number;
    escalationRate: number;
    topIntents: { intent: string; count: number }[];
    byChannel: Record<string, number>;
  };
  phone: {
    received: number;
    answered: number;
    missed: number;
    avgDurationSec: number;
    bookingsFromCalls: number;
    ticketsFromCalls: number;
    escalations: number;
    routingBreakdown: Record<string, number>;
    peakHours: { hour: number; count: number }[];
    afterHours: number;
    businessHours: number;
    liveCalls: number;
    simulatedCalls: number;
  };
  messaging: {
    whatsappInbound: number;
    smsInbound: number;
    avgFirstResponseSec: number;
    conversationsResolved: number;
    bookingsAttributed: number;
    tickets: number;
    escalations: number;
  };
  email: {
    confirmationsSent: number;
    inboundEnquiries: number;
    bookingsAttributed: number;
    simulated: boolean;
  };
  social: {
    enquiriesHandled: number;
    channelSwitches: number;
    simulated: boolean;
  };
};

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3">
      <div className="cx-label">{label}</div>
      <div className="cx-num mt-2 text-2xl tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</div> : null}
    </div>
  );
}

function formatHour(hour: number) {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function PeakChart({ hours }: { hours: { hour: number; count: number }[] }) {
  const peak = Math.max(0, ...hours.map((h) => h.count));
  const max = Math.max(1, peak);
  const peakHour = hours.find((h) => h.count === peak && peak > 0)?.hour;
  return (
    <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="cx-label">Peak call times</div>
          <h3 className="mt-1 text-lg">Calls by hour of day</h3>
        </div>
        <div className="text-right">
          <div className="cx-num text-3xl">{peak}</div>
          <div className="text-xs text-[var(--ink-muted)]">
            {peakHour == null ? "No calls in range" : `Busiest at ${formatHour(peakHour)}`}
          </div>
        </div>
      </div>
      <div className="mt-6 flex h-56 items-stretch gap-1">
        {hours.map((h) => {
          const isPeak = peak > 0 && h.count === peak;
          const height = h.count ? Math.max(12, (h.count / max) * 100) : 0;
          return (
            <div key={h.hour} className="flex min-w-0 flex-1 flex-col items-center" title={`${formatHour(h.hour)} — ${h.count} calls`}>
              <div className="flex h-4 items-end">
                {h.count > 0 ? <span className="cx-num text-[10px] leading-none">{h.count}</span> : null}
              </div>
              <div className="mt-1 flex w-full flex-1 items-end rounded-sm bg-[var(--accent-soft)]">
                <div
                  className={`w-full rounded-t-sm ${isPeak ? "bg-[var(--ink)]" : "bg-[var(--ink)]/45"}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="mt-2 h-4 text-[10px] font-semibold text-[var(--ink-muted)]">
                {h.hour % 3 === 0 ? formatHour(h.hour) : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsInner() {
  const params = useSearchParams();
  const channel = params.get("channel") ?? "all";
  const showPhone = channel === "all" || channel === "phone";
  const showWhatsApp = channel === "all" || channel === "whatsapp";
  const showSms = channel === "all" || channel === "sms";
  const showMessaging = showWhatsApp || showSms;
  const showEmail = channel === "all" || channel === "email";
  const showSocial = channel === "all" || channel === "facebook" || channel === "instagram";
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/metrics?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load metrics");
        const json = (await res.json()) as Metrics;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <div className="space-y-6">
      <PageHeader
        label="Operations"
        title="Analytics"
        description="Channel performance, peak times, and conversion — capacity metrics only (no ROI calculator)."
        actions={
          <a
            href={RETELL_ANALYTICS_URL}
            target="_blank"
            rel="noreferrer"
            className="ox-btn-solid inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
          >
            <ExternalLink size={14} />
            Retell AI analytics
          </a>
        }
      />

      <FilterBar showStatus={false} showSearch={false} />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {!data ? <p className="text-sm text-[var(--ink-muted)]">Loading metrics…</p> : null}

      {data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Conversations" value={data.totals.conversations} />
            <Metric label="Appointments" value={data.totals.appointments} />
            <Metric label="Booking conversion" value={`${data.totals.bookingConversionRate}%`} />
            <Metric label="Escalation rate" value={`${data.totals.escalationRate}%`} />
          </section>

          {showPhone ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg">Phone</h2>
                <a
                  href={RETELL_ANALYTICS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="ox-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                >
                  <ExternalLink size={12} />
                  View call analytics in Retell
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Calls received" value={data.phone.received} />
                <Metric label="Answered" value={data.phone.answered} />
                <Metric label="Missed" value={data.phone.missed} />
                <Metric label="Avg duration" value={`${data.phone.avgDurationSec}s`} />
                <Metric label="Business hours" value={data.phone.businessHours} />
                <Metric label="After hours" value={data.phone.afterHours} />
                <Metric label="Live calls" value={data.phone.liveCalls} />
                <Metric label="Simulated calls" value={data.phone.simulatedCalls} />
              </div>
              <PeakChart hours={data.phone.peakHours} />
              <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
                <div className="cx-label">Routing by department (tickets)</div>
                <ul className="mt-3 space-y-1 text-sm">
                  {Object.entries(data.phone.routingBreakdown).map(([name, count]) => (
                    <li key={name} className="flex justify-between border-b border-[var(--line)] py-1">
                      <span>{name}</span>
                      <span className="cx-num text-[var(--ink-muted)]">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {showMessaging ? (
            <section className="space-y-3">
              <h2 className="text-lg">
                {channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "WhatsApp / SMS"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {showWhatsApp ? <Metric label="WhatsApp inbound" value={data.messaging.whatsappInbound} /> : null}
                {showSms ? <Metric label="SMS inbound" value={data.messaging.smsInbound} /> : null}
                <Metric label="Avg first response" value={`${data.messaging.avgFirstResponseSec}s`} />
                <Metric label="Resolved" value={data.messaging.conversationsResolved} />
              </div>
            </section>
          ) : null}

          {showEmail ? (
            <section className="space-y-3">
              <h2 className="text-lg">Email</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label="Confirmations sent" value={data.email.confirmationsSent} />
                <Metric
                  label="Inbound enquiries"
                  value={data.email.inboundEnquiries}
                  hint={data.email.simulated ? "Simulated until live inbox connected" : undefined}
                />
                <Metric label="Bookings attributed" value={data.email.bookingsAttributed} />
              </div>
            </section>
          ) : null}

          {showSocial ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg">Social DM</h2>
                <span className="cx-badge cx-badge-simulated">SIMULATED</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label="Enquiries handled" value={data.social.enquiriesHandled} />
                <Metric label="Channel switches" value={data.social.channelSwitches} />
              </div>
            </section>
          ) : null}

          <section className="border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
            <div className="cx-label">Top intents</div>
            <ul className="mt-3 space-y-1 text-sm">
              {data.totals.topIntents.map((i) => (
                <li key={i.intent} className="flex justify-between border-b border-[var(--line)] py-1">
                  <span>{i.intent}</span>
                  <span className="cx-num text-[var(--ink-muted)]">{i.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--ink-muted)]">Loading…</p>}>
      <AnalyticsInner />
    </Suspense>
  );
}
