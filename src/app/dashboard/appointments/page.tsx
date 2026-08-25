import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { UrgencyBadge } from "@/components/ui/badge";
import { customerName } from "@/lib/utils";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageHeader } from "@/components/dashboard/page-header";
import { parseListFilters, resolveDateRange } from "@/lib/filters";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseListFilters(sp);
  const range = resolveDateRange(filters);
  const org = await getDemoOrganization();

  const where: Prisma.AppointmentWhereInput = {
    organizationId: org.id,
    ...(range.gte || range.lte
      ? {
          startsAt: {
            ...(range.gte ? { gte: range.gte } : {}),
            ...(range.lte ? { lte: range.lte } : {}),
          },
        }
      : {}),
    ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { notes: { contains: filters.q, mode: "insensitive" } },
            { customer: { firstName: { contains: filters.q, mode: "insensitive" } } },
            { customer: { lastName: { contains: filters.q, mode: "insensitive" } } },
            { customer: { email: { contains: filters.q, mode: "insensitive" } } },
            { customer: { phone: { contains: filters.q } } },
            { service: { name: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: { customer: true, service: true, employee: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Calendar"
        title="Appointments"
        description="Consultations and delivery sessions from the internal availability engine."
      />

      <Suspense fallback={null}>
        <FilterBar
          showChannel={false}
          statusOptions={[
            { value: "all", label: "All statuses" },
            { value: "confirmed", label: "Confirmed" },
            { value: "scheduled", label: "Scheduled" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </Suspense>

      <div className="overflow-hidden border border-[var(--line)]">
        <table className="cx-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Urgency</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3">
                  {a.startsAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}
                </td>
                <td className="px-4 py-3 font-medium">{customerName(a.customer)}</td>
                <td className="px-4 py-3">{a.service.name}</td>
                <td className="px-4 py-3 text-[var(--ink-muted)]">{a.employee?.name ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{a.status}</td>
                <td className="px-4 py-3">
                  <UrgencyBadge level={a.urgency} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
