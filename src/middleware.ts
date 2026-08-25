import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_HOSTS = new Set(["dashboard.onyxwebsystems.co.za"]);
const MARKETING_HOSTS = new Set(["onyxwebsystems.co.za", "www.onyxwebsystems.co.za"]);

function dashboardOrigin() {
  return (process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.onyxwebsystems.co.za").replace(/\/$/, "");
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const { pathname, search } = req.nextUrl;

  if (DASHBOARD_HOSTS.has(host)) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    const allowed =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/brand");
    if (!allowed) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (MARKETING_HOSTS.has(host) && (pathname.startsWith("/dashboard") || pathname === "/login")) {
    return NextResponse.redirect(`${dashboardOrigin()}${pathname}${search}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
