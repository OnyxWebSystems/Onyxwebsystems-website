import type { ScoreBreakdown } from "@/server/partners/scoring";

export function ScoreBreakdownCard({ breakdown, total }: { breakdown: ScoreBreakdown | null; total: number }) {
  if (!breakdown?.criteria?.length) {
    return (
      <div className="cx-card p-5">
        <div className="cx-label">Partner score</div>
        <div className="cx-num mt-2 text-3xl">{total}/100</div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Generate a score to see the breakdown.</p>
      </div>
    );
  }
  return (
    <div className="cx-card p-5">
      <div className="cx-label">Partner score</div>
      <div className="cx-num mt-2 text-3xl">{breakdown.total}/100</div>
      <dl className="mt-4 space-y-3">
        {breakdown.criteria.map((item) => (
          <div key={item.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="font-medium">{item.label}</dt>
              <dd className="tabular-nums">
                {item.points}/{item.max}
              </dd>
            </div>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{item.reason}</p>
          </div>
        ))}
        <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-3 text-sm font-semibold">
          <dt>Total</dt>
          <dd>
            {breakdown.total}/100
          </dd>
        </div>
      </dl>
    </div>
  );
}
