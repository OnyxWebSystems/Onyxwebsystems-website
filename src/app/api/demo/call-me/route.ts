import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createOutboundRetellCall, getRetellStatus } from "@/server/channels/retell";
import { writeAuditLog } from "@/server/security/audit";
import { rateLimit } from "@/server/security/rate-limit";
import { getDemoOrganization } from "@/server/demo/runner";
import { publishActivity } from "@/server/events";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(`callme:${session.user.id}`, 10, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  if (getRetellStatus() !== "CONNECTED") {
    return NextResponse.json(
      { error: "Retell is not CONNECTED. Complete docs/retell-assistant.md first." },
      { status: 503 },
    );
  }

  if (!process.env.RETELL_PHONE_NUMBER) {
    return NextResponse.json(
      { error: "RETELL_PHONE_NUMBER is required for outbound calls." },
      { status: 503 },
    );
  }

  const body = z
    .object({ phoneNumber: z.string().min(8).max(20) })
    .parse(await req.json());

  const call = await createOutboundRetellCall(body.phoneNumber);
  const org = await getDemoOrganization();

  await publishActivity({
    organizationId: org.id,
    type: "phone",
    title: "Outbound call started",
    detail: body.phoneNumber,
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "demo.call_me",
    entity: "RetellCall",
    detail: { phoneNumber: body.phoneNumber },
  });

  return NextResponse.json({ ok: true, call });
}
