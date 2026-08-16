import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { UrgencyBadge } from "@/components/ui/badge";
import { customerName } from "@/lib/utils";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageHeader } from "@/components/dashboard/page-header";
import { parseListFilters, resolveDateRange } from "@/lib/filters";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseListFilters(sp);
  const range = resolveDateRange(filters);
  const org = await getDemoOrganization();

  const where: Prisma.TicketWhereInput = {
    organizationId: org.id,
    ...(range.gte || range.lte
      ? {
          createdAt: {
            ...(range.gte ? { gte: range.gte } : {}),
            ...(range.lte ? { lte: range.lte } : {}),
          },
        }
      : {}),
    ...(filters.status && filters.status !== "all"
      ? filters.status === "open"
        ? { status: { notIn: ["Resolved", "Closed"] } }
        : filters.status === "resolved"
          ? { status: { in: ["Resolved", "Closed"] } }
          : filters.status === "escalated"
            ? { status: "Escalated" }
            : { status: filters.status }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { ticketNumber: { contains: filters.q, mode: "insensitive" } },
            { subject: { contains: filters.q, mode: "insensitive" } },
            { customer: { firstName: { contains: filters.q, mode: "insensitive" } } },
            { customer: { lastName: { contains: filters.q, mode: "insensitive" } } },
            { customer: { email: { contains: filters.q, mode: "insensitive" } } },
            { customer: { phone: { contains: filters.q } } },
          ],
        }
      : {}),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: true, department: true, assignedTo: true },
  });

  const escalations = await prisma.escalation.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { customer: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader label="Support queue" title="Tickets & escalations" />

      <Suspense fallback={null}>
        <FilterBar showChannel={false} />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="overflow-hidden border border-[var(--line)] lg:col-span-2">
          <table className="cx-table">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold">Ticket</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Department</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.ticketNumber}</div>
                    <div className="text-xs text-[var(--ink-muted)]">{t.subject}</div>
                  </td>
                  <td className="px-4 py-3">{customerName(t.customer)}</td>
                  <td className="px-4 py-3">
                    <UrgencyBadge level={t.priority} />
                  </td>
                  <td className="px-4 py-3">{t.status}</td>
                  <td className="px-4 py-3 text-[var(--ink-muted)]">{t.department?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <div className="cx-label">Escalation handoffs</div>
          <div className="mt-4 space-y-3">
            {escalations.map((e) => (
              <div key={e.id} className="border border-[var(--line)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">
                    {e.customer ? customerName(e.customer) : "Customer"}
                  </div>
                  <UrgencyBadge level={e.urgency} />
                </div>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{e.summary}</p>
                {e.recommendedAction ? (
                  <p className="mt-2 text-xs">
                    <span className="font-semibold">Next:</span> {e.recommendedAction}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
