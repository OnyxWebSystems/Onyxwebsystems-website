"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  CalendarDays,
  Ticket,
  BookOpen,
  Settings,
  Activity,
  LogOut,
  Kanban,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { OnyxLogo } from "@/components/brand/onyx-logo";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/activity", label: "Live Activity", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="sticky top-0 flex h-svh min-h-svh w-72 shrink-0 flex-col self-stretch bg-[#0a0a0a] text-[#f5f5f3]">
      <div className="flex flex-col items-center border-b border-white/10 px-6 py-8">
        <OnyxLogo size={120} className="bg-white ring-1 ring-white/15" />
        <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-white/50">Customer Experience</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/10 font-medium text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/55 hover:bg-white/5 hover:text-white"
          onClick={async () => {
            await authClient.signOut();
            router.push("/login");
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
