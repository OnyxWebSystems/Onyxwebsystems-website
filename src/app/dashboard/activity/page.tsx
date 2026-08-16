import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { LiveActivity } from "@/components/dashboard/live-activity";
import { PageHeader } from "@/components/dashboard/page-header";
import { RETELL_CALL_HISTORY_URL } from "@/lib/retell-links";

export const metadata: Metadata = {
  title: "Live Activity",
};

export default function ActivityPage() {
  return (
    <div className="flex min-h-[calc(100svh-8rem)] flex-col space-y-6">
      <PageHeader
        label="Inbox"
        title="Live Activity"
        description="Every customer as one thread — calls, bookings, and follow-ups in the order they happened."
        actions={
          <a
            href={RETELL_CALL_HISTORY_URL}
            target="_blank"
            rel="noreferrer"
            className="ox-btn-solid inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
          >
            <ExternalLink size={14} />
            Retell call history
          </a>
        }
      />
      <div className="min-h-[32rem] flex-1">
        <LiveActivity />
      </div>
    </div>
  );
}
