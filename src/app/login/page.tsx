"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: err } = await authClient.signIn.email({ email, password });
    if (err) {
      setLoading(false);
      setError("Invalid email or password");
      return;
    }
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      const otp = await authClient.twoFactor.sendOtp();
      setLoading(false);
      if (otp.error) {
        setError("Could not send a verification code. Try again.");
        return;
      }
      setStep("otp");
      return;
    }
    setLoading(false);
    router.push("/dashboard");
  }

  async function onCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await authClient.twoFactor.verifyOtp({ code: code.trim() });
    setLoading(false);
    if (err) {
      setError("That code is invalid or expired. Try again.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="cx-card cx-animate-in w-full max-w-md p-8">
        <div className="cx-label">Onyx Web Systems</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {step === "credentials"
            ? "Sign in with your Onyx operator email. A verification code will be sent to that inbox."
            : `Enter the code we sent to ${email}.`}
        </p>
        {step === "credentials" ? (
          <form onSubmit={onPasswordSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--ink-muted)]">Email</span>
              <input
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 outline-none focus:border-[var(--accent)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="username"
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
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="ox-btn-solid w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Checking…" : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={onCodeSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--ink-muted)]">Verification code</span>
              <input
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2 tracking-[0.24em] outline-none focus:border-[var(--accent)]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </label>
            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="ox-btn-solid w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Sign in"}
            </button>
            <button
              type="button"
              className="w-full text-sm text-[var(--ink-muted)] underline"
              onClick={() => {
                setStep("credentials");
                setCode("");
                setError(null);
              }}
            >
              Use a different account
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
