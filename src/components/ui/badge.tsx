import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
}: {
  status: "SIMULATED" | "CONNECTED" | "READY_FOR_INTEGRATION" | string;
}) {
  const cls =
    status === "CONNECTED"
      ? "cx-badge-connected"
      : status === "READY_FOR_INTEGRATION"
        ? "cx-badge-ready"
        : "cx-badge-simulated";
  const label =
    status === "READY_FOR_INTEGRATION" ? "READY FOR INTEGRATION" : status;
  return <span className={cn("cx-badge", cls)}>{label}</span>;
}

export function UrgencyBadge({ level }: { level: string }) {
  const cls =
    level === "CRITICAL"
      ? "cx-badge-critical"
      : level === "HIGH"
        ? "cx-badge-high"
        : level === "LOW"
          ? "cx-badge-low"
          : "cx-badge-normal";
  return <span className={cn("cx-badge", cls)}>{level}</span>;
}
