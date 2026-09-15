"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NotesForm({ partnerId }: { partnerId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/partners/${partnerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save note");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        className="w-full border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Internal note"
        required
      />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button type="submit" disabled={busy} className="ox-btn-ghost px-3 py-2 text-sm">
        {busy ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
