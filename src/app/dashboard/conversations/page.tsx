"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PageHeader } from "@/components/dashboard/page-header";
import { ThreadCard, ThreadDetailPanel } from "@/components/dashboard/thread-detail";
import type { ThreadDetail, ThreadListItem } from "@/server/activity/threads";

function ConversationsInner() {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/activity/threads");
    if (!res.ok) return;
    const data = (await res.json()) as { threads: ThreadListItem[] };
    setThreads(data.threads ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/activity/threads/${openId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { thread: ThreadDetail };
      if (!cancelled) setDetail(data.thread);
    })();
    return () => {
      cancelled = true;
    };
  }, [openId]);

  return (
    <div className="space-y-6">
      <PageHeader
        label="Unified inbox"
        title="Conversations"
        description="One thread per customer — named by who they are and how they reached you."
      />
      <FilterBar />
      <div className="grid gap-2">
        {threads.map((t) => (
          <ThreadCard
            key={t.id}
            name={t.name}
            identity={t.identity}
            intentLabel={t.intentLabel}
            channel={t.channel}
            lastAt={t.lastAt}
            preview={t.preview}
            onClick={() => setOpenId(t.id)}
          />
        ))}
        {!threads.length ? (
          <p className="border border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
            No conversations match filters.
          </p>
        ) : null}
      </div>
      {detail ? <ThreadDetailPanel thread={detail} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--ink-muted)]">Loading…</p>}>
      <ConversationsInner />
    </Suspense>
  );
}
