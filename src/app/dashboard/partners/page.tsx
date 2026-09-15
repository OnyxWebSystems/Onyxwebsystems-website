import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { PartnerFilterBar } from "@/components/dashboard/partners/filter-bar";
import { PartnerFunnel } from "@/components/dashboard/partners/funnel";
import { PartnerTable } from "@/components/dashboard/partners/partner-table";
import { PartnerScoreBadge, PartnerStatusBadge } from "@/components/dashboard/partners/score-badge";
import { formatCurrency } from "@/lib/utils";
import { listPartners, partnerOverviewStats, withNextAction } from "@/server/partners/domain";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const org = await getDemoOrganization();
  const minScoreRaw = get("minScore");
  const [stats, partners, highPriority] = await Promise.all([
    partnerOverviewStats(org.id),
    listPartners(org.id, {
      status: get("status"),
      q: get("q"),
      category: get("category"),
      minScore: minScoreRaw ? Number(minScoreRaw) : null,
    }),
    prisma.partner.findMany({
      where: { organizationId: org.id, status: { not: "ARCHIVED" }, partnerScore: { gte: 80 } },
      orderBy: { partnerScore: "desc" },
      take: 6,
      include: { outreach: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);

  const today = stats.today;

  return (
    <div className="space-y-6">
      <PageHeader
        label="Partner Engine"
        title="Find high-value partners"
        description="Research, score, and approve partnership outreach. The measure that matters is partner-sourced revenue."
        actions={
          <>
            <Link href="/dashboard/partners/discover" className="ox-btn-ghost px-4 py-2.5 text-sm font-semibold">
              Find partners
            </Link>
            <Link href="/dashboard/partners/settings" className="ox-btn-ghost px-4 py-2.5 text-sm font-semibold">
              Settings
            </Link>
            <Link href="/dashboard/partners/discover" className="ox-btn-solid px-4 py-2.5 text-sm font-semibold">
              Add partner
            </Link>
          </>
        }
      />

      <section className="cx-card p-5">
        <div className="cx-label">Today</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <TodayStat href="/dashboard/partners?status=AWAITING_APPROVAL" label="Partners requiring review" value={today.review} />
          <TodayStat href="/dashboard/partners" label="Follow-ups due" value={today.followUpsDue} />
          <TodayStat href="/dashboard/partners?minScore=80" label="New high-priority partners" value={today.highPriorityNew} />
          <TodayStat href="/dashboard/partners?status=RESPONDED" label="Responses received" value={today.responses} />
          <TodayStat href="/dashboard/partners?status=MEETING_BOOKED" label="Meetings" value={today.meetings} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/partners?status=AWAITING_APPROVAL" className="ox-btn-ghost px-3 py-2 text-sm">
            Review partners
          </Link>
          <Link href="/dashboard/partners?status=FOLLOW_UP" className="ox-btn-ghost px-3 py-2 text-sm">
            Review follow-ups
          </Link>
          <Link href="/dashboard/partners?status=RESPONDED" className="ox-btn-ghost px-3 py-2 text-sm">
            View responses
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard label="Potential partners" value={stats.potential} />
        <MetricCard label="Qualified partners" value={stats.qualified} />
        <MetricCard label="High priority" value={stats.highPriority} />
        <MetricCard label="Contacted" value={stats.contacted} />
        <MetricCard label="Interested" value={stats.interested} />
        <MetricCard label="Meetings" value={stats.meetings} />
        <MetricCard label="Active partners" value={stats.activePartners} />
        <MetricCard label="Referrals" value={stats.referrals} hint="Tracking comes in a later phase" />
        <MetricCard label="Closed deals" value={stats.closedDeals} hint="Tracking comes in a later phase" />
        <MetricCard label="Revenue generated" value={formatCurrency(stats.revenueGeneratedCents)} hint="Partner-sourced revenue" />
        <MetricCard label="Commission owed" value={formatCurrency(stats.commissionOwedCents)} />
        <MetricCard label="Commission paid" value={formatCurrency(stats.commissionPaidCents)} />
      </div>

      <section className="space-y-3">
        <div className="cx-label">Partner funnel</div>
        <PartnerFunnel counts={stats.funnel} active={get("status")} />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="cx-label">High priority partners</div>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Highest scoring prospects currently in the database.</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {highPriority.map((partner) => {
            const next = withNextAction(partner);
            return (
              <Link key={partner.id} href={`/dashboard/partners/${partner.id}`} className="cx-card p-4 no-underline">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{partner.companyName}</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      {[partner.industry, partner.city, partner.country].filter(Boolean).join(" · ") || "Location unknown"}
                    </div>
                  </div>
                  <PartnerScoreBadge score={partner.partnerScore} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>Client value {partner.clientValueScore}</div>
                  <div>Onyx fit {partner.fitScore}</div>
                  <div>Network {partner.networkScore}</div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <PartnerStatusBadge status={partner.status} />
                  <span className="text-xs text-[var(--ink-muted)]">{partner.primaryContactName || "Decision maker unknown"}</span>
                </div>
                <p className="mt-2 text-sm">{next.nextAction}</p>
              </Link>
            );
          })}
          {!highPriority.length ? (
            <p className="text-sm text-[var(--ink-muted)]">No high-priority partners yet. Add a company and score it.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="cx-label">Partner database</div>
        <Suspense fallback={<p className="text-sm text-[var(--ink-muted)]">Loading partners…</p>}>
          <PartnerFilterBar />
        </Suspense>
        <PartnerTable partners={partners} />
      </section>
    </div>
  );
}

function TodayStat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="border border-[var(--line)] px-3 py-3 no-underline">
      <div className="cx-label">{label}</div>
      <div className="cx-num mt-1 text-2xl">{value}</div>
    </Link>
  );
}
