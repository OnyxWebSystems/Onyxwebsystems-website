import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { runDemoScenario } from "@/server/demo/runner";
import { DEMO_SCENARIOS } from "@/server/demo/scenarios";
import { writeAuditLog } from "@/server/security/audit";
import { rateLimit } from "@/server/security/rate-limit";

export async function GET() {
  return NextResponse.json({ scenarios: DEMO_SCENARIOS.map(({ key, name, description }) => ({ key, name, description })) });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(`demo:${session.user.id}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = z.object({ scenarioKey: z.string() }).parse(await req.json());
  const result = await runDemoScenario(body.scenarioKey);
  await writeAuditLog({
    actorId: session.user.id,
    action: "demo.scenario.run",
    entity: "DemoScenario",
    entityId: body.scenarioKey,
    detail: { runId: result.runId },
  });
  return NextResponse.json(result);
}
