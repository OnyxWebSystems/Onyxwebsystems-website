import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHmac } from "crypto";
import { auth } from "@/lib/auth";
import { googleAuthorizeUrl, googleClientReady } from "@/server/calendar/google";

function signState() {
  const secret = process.env.BETTER_AUTH_SECRET || "onyx-google-oauth";
  const payload = Buffer.from(JSON.stringify({ t: Date.now() }), "utf8").toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.onyxwebsystems.co.za"));
  if (!googleClientReady()) {
    return NextResponse.redirect(new URL("/dashboard/settings?google=missing-client", process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.onyxwebsystems.co.za"));
  }
  const url = googleAuthorizeUrl(signState());
  if (!url) return NextResponse.redirect(new URL("/dashboard/settings?google=missing-client", process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.onyxwebsystems.co.za"));
  return NextResponse.redirect(url);
}
