"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Scenario = { key: string; name: string; description: string };

export function DemoPanel({ scenarios }: { scenarios: Scenario[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callPhone, setCallPhone] = useState("");

  async function run(scenarioKey: string) {
    setLoading(scenarioKey);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/demo/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scenario failed");
      const first = data.results?.[0];
      setResult(
        first
          ? `${first.intent} · ${first.urgency} · ${first.actions?.join(", ")}\n\n${first.reply}`
          : "Scenario completed",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function reset() {
    setLoading("reset");
    setError(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) throw new Error("Reset failed");
      setResult("Demo data reset and reseeded.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(null);
    }
  }

  async function callMe() {
    setLoading("call-me");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/demo/call-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: callPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Outbound call failed");
      setResult(`Outbound Retell call started to ${callPhone}. Answer your phone.`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Call failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="cx-card space-y-3 p-5">
        <div className="cx-label">Live outbound (Retell)</div>
        <p className="text-sm text-[var(--ink-muted)]">
          Prefer dialing the inbound number for Loom. Use this if you only have one phone and Retell is
          CONNECTED.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[220px] flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
            placeholder="+16025551212"
            value={callPhone}
            onChange={(e) => setCallPhone(e.target.value)}
          />
          <button
            onClick={callMe}
            disabled={!!loading || callPhone.length < 8}
            className="ox-btn-solid px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {loading === "call-me" ? "Calling…" : "Call me"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={reset}
          disabled={!!loading}
          className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--bg)] disabled:opacity-50"
        >
          {loading === "reset" ? "Resetting…" : "Reset demo data"}
        </button>
      </div>

      <div>
        <div className="cx-label mb-2">Offline scenario backup</div>
        <div className="grid gap-3 md:grid-cols-2">
          {scenarios.map((s) => (
            <button
              key={s.key}
              onClick={() => run(s.key)}
              disabled={!!loading}
              className="cx-card p-4 text-left transition hover:border-[var(--accent)] disabled:opacity-50"
            >
              <div className="text-sm font-semibold">{s.name}</div>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">{s.description}</p>
              <div className="mt-3 text-xs font-semibold text-[var(--accent-strong)]">
                {loading === s.key ? "Running…" : "Trigger scenario"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {result ? (
        <pre className="cx-card whitespace-pre-wrap p-4 text-sm text-[var(--ink-muted)]">{result}</pre>
      ) : null}
    </div>
  );
}
