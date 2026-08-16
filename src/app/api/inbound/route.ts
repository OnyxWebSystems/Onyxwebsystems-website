import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { processInbound } from "@/server/orchestration/process";
import { getDemoOrganization } from "@/server/demo/runner";

const schema = z.object({
  channel: z.enum(["phone", "whatsapp", "email", "sms", "facebook", "instagram", "chat"]),
  text: z.string().min(1).max(5000),
  from: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  isMissedCall: z.boolean().optional(),
  outdoorTempF: z.number().optional().nullable(),
  simulateAfterHours: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await req.json());
  const org = await getDemoOrganization();
  const result = await processInbound({ organizationId: org.id, ...body });
  return NextResponse.json(result);
}
