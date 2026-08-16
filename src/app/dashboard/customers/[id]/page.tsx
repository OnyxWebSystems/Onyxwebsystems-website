import { notFound } from "next/navigation";
import { getCustomerProfile } from "@/server/domain/customers";
import { UrgencyBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { customerName, formatPhone } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerProfile(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        label="Customer profile"
        title={customerName(customer)}
        description={`${formatPhone(customer.phone)} · ${customer.email ?? "—"}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="cx-card p-5 lg:col-span-1">
          <div className="cx-label">Details</div>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-[var(--ink-muted)]">Type</dt><dd className="capitalize font-medium">{customer.customerType}</dd></div>
            <div><dt className="text-[var(--ink-muted)]">Preferences</dt><dd>{JSON.stringify(customer.preferences ?? {})}</dd></div>
            <div><dt className="text-[var(--ink-muted)]">Notes</dt><dd>{customer.notes || "—"}</dd></div>
          </dl>
        </div>

        <div className="cx-card p-5 lg:col-span-2">
          <div className="cx-label">Unified timeline</div>
          <div className="mt-4 space-y-3">
            {customer.timeline.map((t) => (
              <div key={t.id} className="border-l-2 border-[var(--accent)] pl-3">
                <div className="text-xs text-[var(--ink-muted)]">
                  {t.occurredAt.toLocaleString("en-US", { timeZone: "America/Phoenix" })}
                  {t.channel ? ` · ${t.channel}` : ""}
                </div>
                <div className="text-sm font-medium">{t.title}</div>
                {t.detail ? <p className="text-xs text-[var(--ink-muted)]">{t.detail}</p> : null}
              </div>
            ))}
            {!customer.timeline.length ? <p className="text-sm text-[var(--ink-muted)]">No timeline events yet.</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="cx-card p-5">
          <div className="cx-label">Appointments</div>
          <div className="mt-3 space-y-2">
            {customer.appointments.map((a) => (
              <div key={a.id} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                <div className="font-medium">{a.service.name}</div>
                <div className="text-xs text-[var(--ink-muted)]">
                  {a.startsAt.toLocaleString("en-US", { timeZone: "America/Phoenix" })} · {a.status}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="cx-card p-5">
          <div className="cx-label">Tickets</div>
          <div className="mt-3 space-y-2">
            {customer.tickets.map((t) => (
              <div key={t.id} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{t.ticketNumber}</div>
                  <UrgencyBadge level={t.priority} />
                </div>
                <div className="text-xs text-[var(--ink-muted)]">{t.subject} · {t.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
