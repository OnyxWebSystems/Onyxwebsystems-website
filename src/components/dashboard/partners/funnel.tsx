import Link from "next/link";
import { FUNNEL_LABELS, FUNNEL_STATUSES } from "@/server/partners/constants";
import { cn } from "@/lib/utils";

export function PartnerFunnel({
  counts,
  active,
}: {
  counts: Record<string, number>;
  active?: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-stretch gap-2">
        {FUNNEL_STATUSES.map((status, index) => {
          const selected = active === status;
          return (
            <div key={status} className="flex items-center gap-2">
              <Link
                href={selected ? "/dashboard/partners" : `/dashboard/partners?status=${status}`}
                className={cn(
                  "cx-card min-w-[118px] px-3 py-3 no-underline transition-colors",
                  selected ? "ring-1 ring-[var(--ink)]" : "hover:bg-[var(--accent-soft)]",
                )}
              >
                <div className="cx-label">{FUNNEL_LABELS[status]}</div>
                <div className="cx-num mt-1 text-xl">{counts[status] ?? 0}</div>
              </Link>
              {index < FUNNEL_STATUSES.length - 1 ? (
                <span className="text-[var(--ink-muted)]" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
