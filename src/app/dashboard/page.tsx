import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { LiveActivity } from "@/components/dashboard/live-activity";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatPhone } from "@/lib/utils";
import { getLiveIntegrationStatuses } from "@/server/channels/dispatch";
import { subDays } from "date-fns";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { CalendarDays, MessagesSquare, Ticket, Users } from "lucide-react";

const DESTINATIONS = [
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

  const [calls, liveCalls, appointments, tickets, conversations, escalations] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        label="Overview"
        title="Watch the front desk work live"
        description="Call, WhatsApp, or SMS Onyx Web Systems. Bookings, tickets, and escalations land here in real time."
        actions={
          <>
            <Link href="/dashboard/settings" className="ox-btn-ghost px-4 py-2.5 text-sm font-semibold">
              Channel setup
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Calls (30d)" value={calls} hint={`${liveCalls} live (non-simulated)`} />
        <MetricCard label="Conversations" value={conversations} />
        <MetricCard label="Appointments booked" value={appointments} />
        <MetricCard label="Tickets created" value={tickets} />
        <MetricCard label="Escalations" value={escalations} hint="Human handoff is a feature" />
      </div>

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
