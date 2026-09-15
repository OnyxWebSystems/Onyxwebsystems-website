import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { NotesForm } from "@/components/dashboard/partners/notes-form";
import { OutreachPanel } from "@/components/dashboard/partners/outreach-panel";
import { PartnerActions } from "@/components/dashboard/partners/partner-actions";
import { PartnerScoreBadge, PartnerStatusBadge } from "@/components/dashboard/partners/score-badge";
import { ScoreBreakdownCard } from "@/components/dashboard/partners/score-breakdown";
import { formatCurrency } from "@/lib/utils";
import { getDemoOrganization } from "@/server/demo/runner";
import { getPartner, withNextAction } from "@/server/partners/domain";
import type { ScoreBreakdown } from "@/server/partners/scoring";
import type { ResearchFindings } from "@/server/partners/research";

export default async function PartnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await getDemoOrganization();
  const record = await getPartner(org.id, id);
  if (!record) notFound();
  const partner = withNextAction(record);
  const breakdown = (partner.scoreBreakdown ?? null) as ScoreBreakdown | null;
  const research = partner.research[0] ?? null;
  const findings = (research?.findings ?? null) as ResearchFindings | null;

  return (
    <div className="space-y-6">
      <PageHeader
        label="Partner profile"
        title={partner.companyName}
        description={[partner.industry, partner.city, partner.country].filter(Boolean).join(" · ") || "Location unknown"}
        actions={
          <Link href="/dashboard/partners" className="ox-btn-ghost px-4 py-2.5 text-sm font-semibold">
            All partners
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <PartnerScoreBadge score={partner.partnerScore} />
        <PartnerStatusBadge status={partner.status} />
        {partner.website ? (
          <a href={partner.website} target="_blank" rel="noreferrer" className="text-sm underline-offset-2 hover:underline">
            {partner.website}
          </a>
        ) : (
          <span className="text-sm text-[var(--ink-muted)]">No website</span>
        )}
      </div>

      <p className="text-sm">
        <span className="cx-label mr-2">Recommended action</span>
        {partner.nextAction}
      </p>

      {partner.doNotContact ? (
        <p className="border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm">
          This partner is marked do not contact. Outreach cannot be generated or sent.
        </p>
      ) : null}

      <PartnerActions
        partnerId={partner.id}
        status={partner.status}
        contractStatus={partner.contractStatus}
        doNotContact={partner.doNotContact}
        hasWebsite={Boolean(partner.website)}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ScoreBreakdownCard breakdown={breakdown} total={partner.partnerScore} />
        <div className="cx-card space-y-3 p-5 lg:col-span-2">
          <div className="cx-label">About</div>
          <p className="text-sm">{partner.description || "Unknown"}</p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--ink-muted)]">Category</dt>
              <dd>{partner.category}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Company size</dt>
              <dd>{partner.companySize || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Partner type</dt>
              <dd>{partner.partnerType}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Agreement</dt>
              <dd>{partner.contractStatus.replace(/_/g, " ")}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="cx-card p-5">
          <div className="cx-label">Why this partner?</div>
          <p className="mt-3 text-sm">{partner.whyGoodFit || "Not found — run analysis after research."}</p>
        </div>
        <div className="cx-card p-5">
          <div className="cx-label">Client profile</div>
          <p className="mt-3 text-sm">{partner.potentialClientProfile || partner.targetClientDescription || "Unknown"}</p>
        </div>
        <div className="cx-card p-5">
          <div className="cx-label">Onyx opportunities</div>
          {partner.recommendedServices.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {partner.recommendedServices.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">Unknown</p>
          )}
          {partner.partnershipAngle ? <p className="mt-3 text-sm">{partner.partnershipAngle}</p> : null}
        </div>
        <div className="cx-card p-5">
          <div className="cx-label">Decision maker</div>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-[var(--ink-muted)]">Name</dt>
              <dd>{partner.primaryContactName || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Role</dt>
              <dd>{partner.primaryContactRole || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Email</dt>
              <dd>{partner.primaryContactEmail || "Not found"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Phone</dt>
              <dd>{partner.primaryContactPhone || "Not found"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">LinkedIn</dt>
              <dd>
                {partner.primaryContactLinkedin || partner.linkedinUrl ? (
                  <a
                    href={partner.primaryContactLinkedin || partner.linkedinUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    Open LinkedIn
                  </a>
                ) : (
                  "Not found"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Contact page</dt>
              <dd>
                {partner.contactPageUrl ? (
                  <a href={partner.contactPageUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                    Open website
                  </a>
                ) : (
                  "Not found"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {research ? (
        <div className="cx-card p-5">
          <div className="cx-label">Research findings</div>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Last researched {research.createdAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}. Facts not found stay
            Unknown.
          </p>
          {findings ? (
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              {Object.entries(findings).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-[var(--ink-muted)]">{key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <ul className="mt-4 space-y-1 text-xs text-[var(--ink-muted)]">
            {research.sources.map((source) => (
              <li key={source.id}>
                <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                  {source.sourceName}
                </a>
                {source.snippet ? ` — ${source.snippet}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="cx-card p-5">
        <div className="cx-label">Outreach</div>
        <div className="mt-4">
          <OutreachPanel
            outreach={partner.outreach ?? []}
            email={partner.primaryContactEmail}
            linkedinUrl={partner.primaryContactLinkedin || partner.linkedinUrl}
            contactPageUrl={partner.contactPageUrl}
            doNotContact={partner.doNotContact}
          />
        </div>
      </div>

      <div className="cx-card p-5">
        <div className="cx-label">Activity</div>
        <div className="mt-4 space-y-3">
          {partner.activity.map((event) => (
            <div key={event.id} className="border-l-2 border-[var(--accent)] pl-3">
              <div className="text-xs text-[var(--ink-muted)]">
                {event.createdAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}
              </div>
              <div className="text-sm font-medium">{event.title}</div>
              {event.detail ? <p className="text-xs text-[var(--ink-muted)]">{event.detail}</p> : null}
            </div>
          ))}
          {!partner.activity.length ? <p className="text-sm text-[var(--ink-muted)]">No activity yet.</p> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="cx-card p-5">
          <div className="cx-label">Referrals</div>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">Referral tracking is not enabled in this phase.</p>
        </div>
        <div className="cx-card p-5">
          <div className="cx-label">Revenue</div>
          <p className="mt-3 text-2xl font-semibold">{formatCurrency(0)}</p>
        </div>
        <div className="cx-card p-5">
          <div className="cx-label">Commission</div>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">Owed {formatCurrency(0)} · Paid {formatCurrency(0)}</p>
        </div>
      </div>

      <div className="cx-card p-5">
        <div className="cx-label">Notes</div>
        <div className="mt-4 space-y-3">
          {partner.notes.map((note) => (
            <div key={note.id} className="border border-[var(--line)] px-3 py-2 text-sm">
              <div className="text-xs text-[var(--ink-muted)]">
                {note.createdAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}
              </div>
              <p className="mt-1">{note.body}</p>
            </div>
          ))}
          <NotesForm partnerId={partner.id} />
        </div>
      </div>
    </div>
  );
}
