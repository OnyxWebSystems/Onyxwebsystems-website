"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ThreadCard, ThreadDetailPanel } from "./thread-detail";
import type { ThreadDetail, ThreadListItem } from "@/server/activity/threads";

export function LiveActivity({
  limit,
  viewAllHref,
}: {
  limit?: number;
  viewAllHref?: string;
}) {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);

  const refresh = useCallback(async () => {
    const qs = limit ? `?limit=${limit}` : "";
    const res = await fetch(`/api/activity/threads${qs}`);
    if (!res.ok) return;
    const data = (await res.json()) as { threads: ThreadListItem[] };
    setThreads(data.threads ?? []);
  }, [limit]);

  useEffect(() => {
    void refresh();
    const es = new EventSource("/api/events/stream");
    es.onmessage = () => {
      void refresh();
    };
    return () => es.close();
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
    <div className="flex h-full flex-col border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="cx-label">Live activity</div>
          <h2 className="mt-1 text-lg font-semibold">Customer threads</h2>
        </div>
        <span className="cx-live-dot" />
      </div>
      <div className="mt-4 flex-1 space-y-2 overflow-auto pr-1">
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
          <p className="text-sm text-[var(--ink-muted)]">
            No customer threads yet. A website booking, call, or enquiry will appear here as one thread per person.
          </p>
        ) : null}
      </div>
      {viewAllHref ? (
        <div className="mt-4 border-t border-[var(--line)] pt-4">
          <Link href={viewAllHref} className="ox-btn-ghost inline-flex px-4 py-2 text-sm font-semibold">
            View all activity
          </Link>
        </div>
      ) : null}
      {detail ? <ThreadDetailPanel thread={detail} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
