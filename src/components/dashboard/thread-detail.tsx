"use client";

import Link from "next/link";
import { Download, ExternalLink, X } from "lucide-react";
import { customerFirstName, turnsFromMessages } from "@/lib/dialogue";
import { RETELL_CALL_HISTORY_URL, retellCallHistoryUrl } from "@/lib/retell-links";
import { formatPhone } from "@/lib/utils";
import type { ThreadDetail } from "@/server/activity/threads";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function channelLabel(channel: string) {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "sms") return "SMS";
  if (channel === "instagram") return "Instagram";
  if (channel === "facebook") return "Facebook";
  if (channel === "web") return "Website";
  return channel;
}

function CallDialogue({
  messages,
  customerName,
}: {
  messages: { senderType: string; body: string }[];
  customerName: string;
}) {
  const turns = turnsFromMessages(messages);
  const who = customerFirstName(customerName);
  if (!turns.length) return null;
  return (
    <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
      {turns.map((turn, index) => {
        const isCustomer = turn.role === "customer";
        return (
          <div key={`${turn.role}-${index}`} className={isCustomer ? "ml-6" : "mr-6"}>
            <div
              className={
                isCustomer
                  ? "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]"
                  : "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]"
              }
            >
              {isCustomer ? who : "Agent"}
            </div>
                          <div
                            className={
                              isCustomer
                                ? "mt-1 border border-[var(--ink)] px-3 py-2 text-sm leading-relaxed"
                                : "mt-1 border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-2 text-sm leading-relaxed"
                            }
                            style={
                              isCustomer
                                ? { background: "var(--ink)", color: "var(--bg-elevated)" }
                                : undefined
                            }
                          >
              {turn.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ThreadDetailPanel({
  thread,
  onClose,
}: {
  thread: ThreadDetail;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-xl flex-col border-l border-[var(--line)] bg-[var(--bg-elevated)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div>
            <div className="cx-label">{thread.intentLabel}</div>
            <h2 className="mt-1 text-2xl tracking-tight">{thread.name}</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {thread.identity}
              {thread.email && thread.identity !== thread.email ? ` · ${thread.email}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ox-btn-ghost inline-flex h-8 w-8 items-center justify-center"
            aria-label="Close thread"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {thread.conversations.map((c) => (
            <article key={c.id} className="border border-[var(--line)] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    {channelLabel(c.channel)} · {c.status}
                  </div>
                  <div className="mt-1 text-sm font-medium">{when(c.startedAt)}</div>
                  {c.durationSec ? (
                    <div className="mt-0.5 text-xs text-[var(--ink-muted)]">
                      {Math.round(c.durationSec / 60)}m {c.durationSec % 60}s
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {c.channel === "phone" ? (
                    <a
                      href={retellCallHistoryUrl(c.retellCallId)}
                      target="_blank"
                      rel="noreferrer"
                      className="ox-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                    >
                      <ExternalLink size={12} />
                      Retell call history
                    </a>
                  ) : null}
                  {c.recordingUrl ? (
                    <a
                      href={c.recordingUrl}
                      download
                      className="ox-btn-solid inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                    >
                      <Download size={12} />
                      Download audio
                    </a>
                  ) : null}
                </div>
              </div>

              {c.summary ? <p className="mt-3 text-sm leading-relaxed">{c.summary}</p> : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {c.appointment ? (
                  <Link
                    href="/dashboard/appointments"
                    className="border border-[var(--line)] px-2.5 py-1 text-xs hover:bg-[var(--accent-soft)]"
                  >
                    Booking · {c.appointment.serviceName}
                  </Link>
                ) : null}
                {c.ticket ? (
                  <Link
                    href="/dashboard/tickets"
                    className="border border-[var(--line)] px-2.5 py-1 text-xs hover:bg-[var(--accent-soft)]"
                  >
                    Ticket · {c.ticket.ticketNumber}
                  </Link>
                ) : null}
              </div>

              <CallDialogue messages={c.messages} customerName={thread.name} />
            </article>
          ))}

          {thread.appointments.length ? (
            <section>
              <div className="cx-label">Bookings</div>
              <div className="mt-2 space-y-2">
                {thread.appointments.map((a) => (
                  <Link
                    key={a.id}
                    href="/dashboard/appointments"
                    className="block border border-[var(--line)] px-3 py-2 text-sm hover:bg-[var(--accent-soft)]"
                  >
                    <div className="font-medium">{a.serviceName}</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      {when(a.startsAt)} · {a.status}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {thread.tickets.length ? (
            <section>
              <div className="cx-label">Tickets</div>
              <div className="mt-2 space-y-2">
                {thread.tickets.map((t) => (
                  <Link
                    key={t.id}
                    href="/dashboard/tickets"
                    className="block border border-[var(--line)] px-3 py-2 text-sm hover:bg-[var(--accent-soft)]"
                  >
                    <div className="font-medium">{t.ticketNumber}</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      {t.subject} · {t.status}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {thread.conversations.some((c) => c.channel === "phone") ? (
              <a
                href={RETELL_CALL_HISTORY_URL}
                target="_blank"
                rel="noreferrer"
                className="ox-btn-ghost inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium"
              >
                <ExternalLink size={14} />
                All Retell call history
              </a>
            ) : null}
            {thread.customerId ? (
              <Link href={`/dashboard/customers/${thread.customerId}`} className="text-sm underline underline-offset-4">
                Open full customer profile
              </Link>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function ThreadCard({
  name,
  identity,
  intentLabel,
  channel,
  lastAt,
  preview,
  onClick,
}: {
  name: string;
  identity: string;
  intentLabel: string;
  channel: string;
  lastAt: string;
  preview: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-left transition-colors hover:bg-[var(--accent-soft)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{name}</div>
          <div className="mt-0.5 text-xs text-[var(--ink-muted)]">{identity}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            {channelLabel(channel)} · {intentLabel}
          </div>
          <div className="mt-1 text-xs text-[var(--ink-muted)]">{when(lastAt)}</div>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-[var(--ink-muted)]">{preview}</p>
    </button>
  );
}

export function formatThreadPhone(phone?: string | null) {
  return formatPhone(phone);
}
