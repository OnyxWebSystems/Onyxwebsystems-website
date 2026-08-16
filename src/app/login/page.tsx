"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@onyxwebsystems.com");
  const [password, setPassword] = useState("DemoOnyx2026!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message ?? "Sign in failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="cx-card cx-animate-in w-full max-w-md p-8">
        <div className="cx-label">Onyx Web Systems</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Customer Experience</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Sign in to the Onyx Web Systems Customer Experience demonstration dashboard.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--ink-muted)]">Email</span>
            <input
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 outline-none focus:border-[var(--accent)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--ink-muted)]">Password</span>
            <input
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 outline-none focus:border-[var(--accent)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="ox-btn-solid w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Enter dashboard"}
          </button>
        </form>
        <p className="mt-4 text-xs text-[var(--ink-muted)]">
          Demo credentials are prefilled. This is a sales demonstration environment.
        </p>
      </div>
    </main>
  );
}
