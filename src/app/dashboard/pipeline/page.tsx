import { Suspense } from "react";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageHeader } from "@/components/dashboard/page-header";
import { parseListFilters, resolveDateRange } from "@/lib/filters";
import { customerName } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "quoted", label: "Quoted" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseListFilters(sp);
  const range = resolveDateRange(filters);
  const org = await getDemoOrganization();

  const where: Prisma.LeadWhereInput = {
    organizationId: org.id,
    ...(range.gte || range.lte
      ? { createdAt: { ...(range.gte ? { gte: range.gte } : {}), ...(range.lte ? { lte: range.lte } : {}) } }
      : {}),
    ...(filters.channel && filters.channel !== "all" ? { source: filters.channel } : {}),
    ...(filters.q
      ? {
          OR: [
            { summary: { contains: filters.q, mode: "insensitive" } },
            { customer: { firstName: { contains: filters.q, mode: "insensitive" } } },
            { customer: { lastName: { contains: filters.q, mode: "insensitive" } } },
            { customer: { email: { contains: filters.q, mode: "insensitive" } } },
            { customer: { phone: { contains: filters.q } } },
          ],
        }
      : {}),
  };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { customer: true, service: true },
    take: 200,
  });

  const byStage = Object.fromEntries(
    STAGES.map((s) => [s.key, leads.filter((l) => l.stage === s.key)]),
  ) as Record<string, typeof leads>;

  return (
    <div className="space-y-6">
      <PageHeader
        label="Sales"
        title="Pipeline"
        description="Leads from website, phone, WhatsApp, and other channels — New through Won / Lost."
      />

      <Suspense fallback={null}>
        <FilterBar
          showStatus={false}
          channelOptions={[
            { value: "all", label: "All sources" },
            { value: "website", label: "Website" },
            { value: "phone", label: "Phone" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "sms", label: "SMS" },
            { value: "email", label: "Email" },
            { value: "facebook", label: "Social" },
          ]}
        />
      </Suspense>

      <div className="grid gap-3 xl:grid-cols-6 lg:grid-cols-3 sm:grid-cols-2">
        {STAGES.map((stage) => (
          <section key={stage.key} className="min-h-[280px] border border-[var(--line)] bg-[var(--bg-elevated)]">
            <header className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em]">{stage.label}</h2>
              <span className="text-xs text-[var(--ink-muted)]">{byStage[stage.key]?.length ?? 0}</span>
            </header>
            <div className="space-y-2 p-2">
              {(byStage[stage.key] ?? []).map((lead) => (
                <article key={lead.id} className="border border-[var(--line)] px-3 py-2">
                  <div className="text-sm font-medium">
                    {lead.customer ? customerName(lead.customer) : "Unknown"}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
                    {lead.source}
                    {lead.service ? ` · ${lead.service.name}` : ""}
                  </div>
                  {lead.summary ? (
                    <p className="mt-2 line-clamp-3 text-xs text-[var(--ink-muted)]">{lead.summary}</p>
                  ) : null}
                </article>
              ))}
              {(byStage[stage.key] ?? []).length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-[var(--ink-muted)]">Empty</p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
