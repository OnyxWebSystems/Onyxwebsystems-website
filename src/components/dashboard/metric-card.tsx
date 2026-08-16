export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="cx-card cx-animate-in p-4">
      <div className="cx-label">{label}</div>
      <div className="cx-num mt-2 text-3xl tracking-tight">{value}</div>
      {hint ? <p className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</p> : null}
    </div>
  );
}
