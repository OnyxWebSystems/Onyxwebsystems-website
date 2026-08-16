import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * @deprecated Vapi has been replaced by Retell AI.
 * Use POST /api/webhooks/retell and docs/retell-assistant.md.
 */
export async function POST() {
  return NextResponse.json(
    {
      deprecated: true,
      status: 410,
      message:
        "Vapi webhooks are deprecated. Configure Retell at /api/webhooks/retell — see docs/retell-assistant.md.",
      migrateTo: "/api/webhooks/retell",
    },
    { status: 410 },
  );
}

export async function GET() {
  return POST();
}
