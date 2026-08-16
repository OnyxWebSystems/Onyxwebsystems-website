import { logger } from "@/server/logger";
import { frontDeskLine, MENU } from "@/server/messaging/front-desk";

export async function composeMessagingReply(input: {
  draft: string;
  customerName?: string | null;
  userText: string;
  kbSnippets: string[];
  history: { direction: string; body: string }[];
}): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return withMenu(input.draft);

  try {
    const historyText = input.history
      .slice(-8)
      .map((m) => `${m.direction === "inbound" ? "Customer" : "Onyx"}: ${m.body}`)
      .join("\n");
    const kb = input.kbSnippets.filter(Boolean).join("\n\n") || "No extra articles.";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are the Onyx Web Systems digital front desk on WhatsApp/SMS.
Company: Onyx Web Systems. Tagline: CREATE. CONNECT. CONVERT.
Services: Business Operating Systems, App Development, Web Development.
Never invent prices or fees. Pricing is custom after a scoped conversation.
Never call yourself an AI receptionist or AI agent. You are the front desk.
Keep replies under 700 characters, warm, professional, and specific.
Use the knowledge snippets as source of truth. If they don't cover the question, say you'll connect a person.
You may mention the front desk phone using this line: ${frontDeskLine()}
If helpful, end with this menu:\n${MENU}`,
          },
          {
            role: "user",
            content: `Customer name: ${input.customerName ?? "unknown"}
Latest message: ${input.userText}
Draft answer to refine (keep the facts):\n${input.draft}
Knowledge:\n${kb}
Recent thread:\n${historyText || "(start of thread)"}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return withMenu(input.draft);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || withMenu(input.draft);
  } catch (error) {
    logger.warn("composeMessagingReply failed", { error: String(error) });
    return withMenu(input.draft);
  }
}

function withMenu(draft: string) {
  if (draft.includes("1)")) return draft;
  return `${draft}\n\n${MENU}`;
}
