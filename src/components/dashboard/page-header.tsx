import type { ReactNode } from "react";

export function PageHeader({
  label,
  title,
  description,
  actions,
}: {
  label: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="cx-label">{label}</div>
        <h1 className="cx-page-title mt-1 text-3xl font-bold">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
