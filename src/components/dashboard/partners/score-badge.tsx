import { cn } from "@/lib/utils";
import { scoreBand } from "@/server/partners/constants";

export function PartnerScoreBadge({ score }: { score: number }) {
  const band = scoreBand(score);
  const cls =
    band.key === "excellent" || band.key === "high"
      ? "cx-badge-connected"
      : band.key === "good"
        ? "cx-badge-normal"
        : band.key === "potential"
          ? "cx-badge-simulated"
          : "cx-badge-low";
  return (
    <span className={cn("cx-badge", cls)}>
      {score}/100 · {band.label}
    </span>
  );
}

export function PartnerStatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ").toLowerCase();
  return <span className="cx-badge cx-badge-simulated capitalize">{label}</span>;
}
