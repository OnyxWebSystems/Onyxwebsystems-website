import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isDashboardOperator } from "@/server/auth/operators";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { OnyxLogo } from "@/components/brand/onyx-logo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isDashboardOperator(session.user.email)) redirect("/login");

  return (
    <div className="flex min-h-screen items-stretch">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg-elevated)]/90 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <OnyxLogo size={48} />
            <div>
              <div className="text-sm font-medium">Onyx Web Systems</div>
              <div className="text-xs text-[var(--ink-muted)]">Operator dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="cx-live-dot" />
              Live activity
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
