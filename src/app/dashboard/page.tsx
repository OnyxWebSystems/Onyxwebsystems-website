import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { LiveActivity } from "@/components/dashboard/live-activity";
import { PageHeader } from "@/components/dashboard/page-header";
import { customerName, formatPhone } from "@/lib/utils";
import { getLiveIntegrationStatuses } from "@/server/channels/dispatch";
import { BUSINESS_TIMEZONE, formatInTimeZone } from "@/lib/timezones";
import { subDays } from "date-fns";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { CalendarDays, MessagesSquare, Ticket, Users } from "lucide-react";

const DESTINATIONS = [
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    detail: "Set available days and times for website bookings.",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/appointments",
    label: "Appointments",
    detail: "See the booking that landed from the call or form.",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/conversations",
    label: "Conversations",
    detail: "Open the customer thread and transcript.",
    icon: MessagesSquare,
  },
  {
    href: "/dashboard/tickets",
    label: "Tickets",
    detail: "Escalations and follow-ups in one queue.",
    icon: Ticket,
  },
  {
    href: "/dashboard/customers",
    label: "Customers",
    detail: "Unified profile and history.",
    icon: Users,
  },
];

export default async function DashboardPage() {
  const org = await getDemoOrganization();
  const since = subDays(new Date(), 30);
  const live = getLiveIntegrationStatuses();
  const dialNumber = process.env.RETELL_PHONE_NUMBER || org.phone;

  const [calls, liveCalls, appointments, tickets, conversations, escalations, websiteLeads, leadCount] =
    await Promise.all([
      prisma.callSession.count({
        where: { conversation: { organizationId: org.id }, startedAt: { gte: since } },
      }),
      prisma.callSession.count({
        where: {
          conversation: { organizationId: org.id },
          isSimulated: false,
          startedAt: { gte: since },
        },
      }),
      prisma.appointment.count({
        where: { organizationId: org.id, createdAt: { gte: since }, status: { not: "cancelled" } },
      }),
      prisma.ticket.count({ where: { organizationId: org.id, createdAt: { gte: since } } }),
      prisma.conversation.count({ where: { organizationId: org.id, createdAt: { gte: since } } }),
      prisma.escalation.count({ where: { createdAt: { gte: since } } }),
      prisma.lead.findMany({
        where: { organizationId: org.id, source: "website" },
        orderBy: { createdAt: "desc" },
        include: { customer: true, service: true },
        take: 8,
      }),
      prisma.lead.count({ where: { organizationId: org.id, source: "website" } }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        label="Overview"
        title="Watch the front desk work live"
        description="Call, WhatsApp, or SMS Onyx Web Systems. Bookings, tickets, and website leads land here in real time."
        actions={
          <>
            <Link href="/dashboard/calendar" className="ox-btn-ghost px-4 py-2.5 text-sm font-semibold">
              Calendar
            </Link>
            <Link href="/dashboard/activity" className="ox-btn-solid px-4 py-2.5 text-sm font-semibold">
              Live Activity
            </Link>
          </>
        }
      />

      <div className="grid gap-4 border border-[var(--line)] bg-[var(--bg-elevated)] p-5 md:grid-cols-3">
        <div>
          <div className="cx-label">Call this number</div>
          <div className="cx-num mt-1 text-2xl tracking-tight">{formatPhone(dialNumber)}</div>
          <div className="mt-2">
            <StatusBadge status={live.voice_retell.status} />
          </div>
        </div>
        <div>
          <div className="cx-label">WhatsApp</div>
          <div className="mt-1 text-lg font-semibold">
            {process.env.TWILIO_WHATSAPP_FROM
              ? formatPhone(process.env.TWILIO_WHATSAPP_FROM)
              : "Not configured"}
          </div>
          <div className="mt-2">
            <StatusBadge status={live.whatsapp.status} />
          </div>
        </div>
        <div>
          <div className="cx-label">SMS</div>
          <div className="mt-1 text-lg font-semibold">
            {process.env.TWILIO_SMS_FROM ? formatPhone(process.env.TWILIO_SMS_FROM) : "Not configured"}
          </div>
          <div className="mt-2">
            <StatusBadge status={live.sms.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Calls (30d)" value={calls} hint={`${liveCalls} live (non-simulated)`} />
        <MetricCard label="Conversations" value={conversations} />
        <MetricCard label="Appointments booked" value={appointments} />
        <MetricCard label="Tickets created" value={tickets} />
        <MetricCard label="Escalations" value={escalations} hint="Human handoff is a feature" />
        <MetricCard label="Website leads" value={leadCount} hint="From book and project request" />
      </div>

      <section className="border border-[var(--line)] bg-[var(--bg-elevated)]">
        <header className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div>
            <div className="cx-label">Website leads</div>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Consultations and project requests from onyxwebsystems.co.za
            </p>
          </div>
          <Link href="/dashboard/customers" className="text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            View customers
          </Link>
        </header>
        <div className="divide-y divide-[var(--line)]">
          {websiteLeads.map((lead) => (
            <div key={lead.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{lead.customer ? customerName(lead.customer) : "Unknown"}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {formatInTimeZone(lead.createdAt, BUSINESS_TIMEZONE, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                {lead.source} · {lead.stage}
                {lead.service ? ` · ${lead.service.name}` : ""}
              </p>
              {lead.summary ? <p className="mt-2 line-clamp-2 text-sm text-[var(--ink-muted)]">{lead.summary}</p> : null}
            </div>
          ))}
          {websiteLeads.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[var(--ink-muted)]">No website leads yet.</p>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="cx-label">After a live interaction</div>
          {DESTINATIONS.map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 transition-colors hover:bg-[var(--accent-soft)]"
            >
              <Icon size={16} className="mt-0.5" />
              <div>
                <div className="text-sm font-semibold">{label}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">{detail}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="lg:col-span-2">
          <LiveActivity limit={5} viewAllHref="/dashboard/activity" />
        </div>
      </div>
    </div>
  );
}
