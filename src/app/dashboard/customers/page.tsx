import Link from "next/link";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { customerName, formatPhone } from "@/lib/utils";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageHeader } from "@/components/dashboard/page-header";
import { parseListFilters, resolveDateRange } from "@/lib/filters";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseListFilters(sp);
  const range = resolveDateRange(filters);
  const org = await getDemoOrganization();

  const where: Prisma.CustomerWhereInput = {
    organizationId: org.id,
    ...(range.gte || range.lte
      ? {
          updatedAt: {
            ...(range.gte ? { gte: range.gte } : {}),
            ...(range.lte ? { lte: range.lte } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { firstName: { contains: filters.q, mode: "insensitive" } },
            { lastName: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { phone: { contains: filters.q } },
            { notes: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { appointments: true, tickets: true, conversations: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="CRM"
        title="Customers"
        description="Profiles, preferences, and history — available during every conversation."
      />

      <Suspense fallback={null}>
        <FilterBar showChannel={false} showStatus={false} />
      </Suspense>

      <div className="overflow-hidden border border-[var(--line)]">
        <table className="cx-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Activity</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--accent-soft)]">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {customerName(c)}
                  </Link>
                  <div className="text-xs text-[var(--ink-muted)]">
                    {[c.city, c.state, c.postalCode].filter(Boolean).join(" ") || "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--ink-muted)]">
                  <div>{formatPhone(c.phone)}</div>
                  <div className="text-xs">{c.email}</div>
                </td>
                <td className="px-4 py-3 capitalize">{c.customerType}</td>
                <td className="px-4 py-3 text-[var(--ink-muted)]">
                  {c._count.conversations} conv · {c._count.appointments} appt · {c._count.tickets} tickets
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
