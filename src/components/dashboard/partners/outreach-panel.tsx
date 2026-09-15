"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type OutreachRecord = {
  id: string;
  channel: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
  approvedAt: string | Date | null;
  sentAt: string | Date | null;
};

export function OutreachPanel({
  outreach,
  email,
  linkedinUrl,
  contactPageUrl,
  doNotContact,
}: {
  outreach: OutreachRecord[];
  email?: string | null;
  linkedinUrl?: string | null;
  contactPageUrl?: string | null;
  doNotContact: boolean;
}) {
  if (!outreach.length) {
    return <p className="text-sm text-[var(--ink-muted)]">No outreach drafts yet.</p>;
  }
  return (
    <div className="space-y-4">
      {outreach.map((item) => (
        <OutreachCard
          key={item.id}
          item={item}
          email={email}
          linkedinUrl={linkedinUrl}
          contactPageUrl={contactPageUrl}
          doNotContact={doNotContact}
        />
      ))}
    </div>
  );
}

function OutreachCard({
  item,
  email,
  linkedinUrl,
  contactPageUrl,
  doNotContact,
}: {
  item: OutreachRecord;
  email?: string | null;
  linkedinUrl?: string | null;
  contactPageUrl?: string | null;
  doNotContact: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(item.message);
  const [subject, setSubject] = useState(item.subject ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    : null;

  async function saveThen(action?: "approve" | "reject" | "mark_contacted") {
    setBusy(action ? action : "Saving…");
    setError(null);
    try {
      const patch = await fetch(`/api/partners/outreach/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      if (!patch.ok) {
        const data = (await patch.json()) as { error?: string };
        throw new Error(data.error || "Could not save message");
      }
      if (action) {
        const res = await fetch(`/api/partners/outreach/${item.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, message }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "Could not update outreach");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update outreach");
    } finally {
      setBusy(null);
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
  }

  const approved = item.status === "APPROVED" || item.status === "READY";

  return (
    <div className="space-y-3 border border-[var(--line)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
        <span>
          {item.channel} · {item.status.replace(/_/g, " ")}
        </span>
        <span>{new Date(item.createdAt).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}</span>
      </div>
      <input
        className="w-full border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={item.status === "SENT" || item.status === "CANCELLED"}
      />
      <textarea
        className="min-h-[180px] w-full border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={item.status === "SENT" || item.status === "CANCELLED"}
      />
      {item.status !== "SENT" && item.status !== "CANCELLED" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ox-btn-solid px-3 py-2 text-sm" disabled={Boolean(busy) || doNotContact} onClick={() => saveThen("approve")}>
            {busy === "approve" ? "Saving…" : "Approve"}
          </button>
          <button type="button" className="ox-btn-ghost px-3 py-2 text-sm" disabled={Boolean(busy)} onClick={() => saveThen()}>
            {busy === "Saving…" ? "Saving…" : "Save edit"}
          </button>
          <button type="button" className="ox-btn-ghost px-3 py-2 text-sm" disabled={Boolean(busy)} onClick={() => saveThen("reject")}>
            Reject
          </button>
          <button type="button" className="ox-btn-ghost px-3 py-2 text-sm" onClick={copyMessage}>
            Copy message
          </button>
          {mailto ? (
            <a href={mailto} className="ox-btn-ghost px-3 py-2 text-sm no-underline">
              Open email
            </a>
          ) : null}
          {linkedinUrl ? (
            <a href={linkedinUrl} target="_blank" rel="noreferrer" className="ox-btn-ghost px-3 py-2 text-sm no-underline">
              Open LinkedIn
            </a>
          ) : null}
          {contactPageUrl ? (
            <a href={contactPageUrl} target="_blank" rel="noreferrer" className="ox-btn-ghost px-3 py-2 text-sm no-underline">
              Open website
            </a>
          ) : null}
          <button
            type="button"
            className="ox-btn-ghost px-3 py-2 text-sm"
            disabled={Boolean(busy) || doNotContact || !approved}
            onClick={() => saveThen("mark_contacted")}
          >
            {busy === "mark_contacted" ? "Saving…" : "Mark contacted"}
          </button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
