import { NextResponse } from "next/server";
import { rateLimit } from "@/server/security/rate-limit";
import { verifyRetellWebhook } from "@/server/channels/retell";
import { executeVoiceTool } from "@/server/voice/tools";
import { logger } from "@/server/logger";

type RetellToolBody = {
  name?: string;
  args?: Record<string, unknown>;
  call?: { call_id?: string; from_number?: string; to_number?: string };
  [key: string]: unknown;
};

/**
 * Shared handler for Retell custom-function HTTP endpoints.
 * Accepts either wrapped `{ name, args, call }` or flat args-only payloads.
 */
export async function handleRetellToolPost(req: Request, toolName: string) {
  const limited = rateLimit(`voice-tool:${toolName}`, 120, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const raw = await req.text();
  if (!verifyRetellWebhook(req, raw)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: RetellToolBody = {};
  try {
    body = raw ? (JSON.parse(raw) as RetellToolBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const args =
    body.args && typeof body.args === "object"
      ? body.args
      : (Object.fromEntries(
          Object.entries(body).filter(([k]) => !["name", "call", "args"].includes(k)),
        ) as Record<string, unknown>);

  // Prefer caller number from Retell call context when tool args omit phone
  if (!args.phone && body.call?.from_number) {
    args.phone = body.call.from_number;
  }

  try {
    const result = await executeVoiceTool({
      name: toolName,
      parameters: args,
    });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Retell tool failed", { toolName, error: String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tool failed" },
      { status: 500 },
    );
  }
}
