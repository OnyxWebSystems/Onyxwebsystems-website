import { getDemoOrganization } from "@/server/demo/runner";
import { StatusBadge } from "@/components/ui/badge";
import { getLiveIntegrationStatuses } from "@/server/channels/dispatch";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatPhone } from "@/lib/utils";
import { googleOAuthRedirectUri } from "@/server/calendar/google";
import Link from "next/link";

const LABELS: Record<string, string> = {
  voice_retell: "Phone (Retell AI)",
  voice_simulator: "Phone (Simulator / Demo Mode)",
  whatsapp: "WhatsApp (Twilio)",
  sms: "SMS (Twilio)",
  email: "Email confirmations (Resend)",
  calendar: "Internal calendar",
  google_calendar: "Google Calendar (Onyx Web Systems)",
  crm: "Internal CRM",
  llm: "Language understanding",
  social: "Social inbox",
};

const GOOGLE_MESSAGES: Record<string, string> = {
  connected: "Google Calendar is connected. New bookings will appear automatically.",
  "connected-testing":
    "Connected, but Google still has this app in Testing, so the token will expire in 7 days. Publish the app in Google Cloud, then click Connect again.",
  denied: "Google access was cancelled.",
  invalid: "That Google connection link was invalid. Try Connect again.",
  failed: "Google Calendar could not be connected. Check the redirect URI on the OAuth client.",
  "missing-client": "Google client ID and secret are missing in Vercel.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const org = await getDemoOrganization();
  const live = getLiveIntegrationStatuses();
  const phone = process.env.RETELL_PHONE_NUMBER || org.phone;
  const waFrom = process.env.TWILIO_WHATSAPP_FROM;
  const smsFrom = process.env.TWILIO_SMS_FROM;
  const sp = await searchParams;
  const google = typeof sp.google === "string" ? sp.google : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        label="Live channels"
        title="Settings & integrations"
        description="Status is derived from environment credentials. SIMULATED never pretends to be live. Setup: docs/onyx-live-setup.md · Voice: docs/retell-assistant.md"
      />

      <div className="cx-card p-5">
        <div className="cx-label">Google Calendar</div>
        <h2 className="mt-1 text-xl font-semibold">Connect once, keep it connected</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
          Publish the OAuth app in Google Cloud (Audience → In production), add this redirect URI to the Web
          client, then connect with onyxwebsystems@gmail.com. You should not need the Playground again.
        </p>
        <code className="mt-3 block break-all text-xs text-[var(--ink-muted)]">{googleOAuthRedirectUri()}</code>
        {google && GOOGLE_MESSAGES[google] ? (
          <p className="mt-3 text-sm">{GOOGLE_MESSAGES[google]}</p>
        ) : null}
        <a href="/api/dashboard/google-calendar/connect" className="ox-btn-solid mt-4 inline-block px-4 py-2.5 text-sm font-semibold">
          Connect Google Calendar
        </a>
      </div>

      <div className="cx-card p-5">
        <div className="cx-label">How to test (Loom)</div>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--ink-muted)]">
          <li>
            <span className="font-medium text-[var(--ink)]">Call</span>{" "}
            {formatPhone(phone)} — book an appointment on the call
          </li>
          <li>
            <span className="font-medium text-[var(--ink)]">WhatsApp</span> — join Twilio sandbox, then
            message {waFrom ? formatPhone(waFrom) : "(set TWILIO_WHATSAPP_FROM)"}
          </li>
          <li>
            <span className="font-medium text-[var(--ink)]">SMS</span> — text{" "}
            {smsFrom ? formatPhone(smsFrom) : "(set TWILIO_SMS_FROM)"}
          </li>
          <li>
            Confirm the appointment appears under{" "}
            <Link href="/dashboard/appointments" className="text-[var(--accent-strong)] underline">
              Appointments
            </Link>{" "}
            and a confirmation email is sent when Resend is CONNECTED
          </li>
        </ol>
        <p className="mt-4 text-xs text-[var(--ink-muted)]">
          Public webhook base URL must match{" "}
          <code>{process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "(not set)"}</code>
        </p>
      </div>

      <div className="cx-card p-5">
        <div className="cx-label">Organization</div>
        <h2 className="mt-1 text-xl font-semibold">{org.name}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--ink-muted)]">Live dial-in</dt>
            <dd className="font-medium">{formatPhone(phone)}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Demo org phone</dt>
            <dd>{formatPhone(org.phone)}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Email</dt>
            <dd>{org.email}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Timezone</dt>
            <dd>{org.timezone}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3">
        {Object.entries(live).map(([key, value]) => (
          <div key={key} className="cx-card flex items-start justify-between gap-4 p-4">
            <div>
              <div className="font-semibold">{LABELS[key] ?? key}</div>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{value.detail}</p>
            </div>
            <StatusBadge status={value.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
