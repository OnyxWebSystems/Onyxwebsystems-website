import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { auth } from "@/lib/auth";
import { getDemoOrganization } from "@/server/demo/runner";
import { dashboardSiteUrl } from "@/server/email/brand";
import { exchangeGoogleAuthCode, saveGoogleRefreshToken } from "@/server/calendar/google";
import { logger } from "@/server/logger";

function dash(path: string) {
  return new URL(path, `${dashboardSiteUrl()}/`);
}

function verifyState(state: string) {
  const secret = process.env.BETTER_AUTH_SECRET || "onyx-google-oauth";
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { t?: number };
    return Boolean(data.t && Date.now() - data.t < 20 * 60 * 1000);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.redirect(dash("/login"));

  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) return NextResponse.redirect(dash("/dashboard/settings?google=denied"));

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  if (!code || !verifyState(state)) {
    return NextResponse.redirect(dash("/dashboard/settings?google=invalid"));
  }

  try {
    const tokens = await exchangeGoogleAuthCode(code);
    const org = await getDemoOrganization();
    await saveGoogleRefreshToken({ organizationId: org.id, refreshToken: tokens.refresh_token! });
    const lasting = !tokens.refresh_token_expires_in;
    return NextResponse.redirect(dash(lasting ? "/dashboard/settings?google=connected" : "/dashboard/settings?google=connected-testing"));
  } catch (err) {
    logger.error("Google Calendar connect failed", { error: String(err) });
    return NextResponse.redirect(dash("/dashboard/settings?google=failed"));
  }
}
