import { handleRetellToolPost } from "@/server/voice/retell-tool-route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleRetellToolPost(req, "book_appointment");
}
