import { z } from "zod";
import { logger } from "@/server/logger";

export async function completeJson<T>(params: {
  schema: z.ZodType<T>;
  system: string;
  user: string;
  fallback: T;
  timeoutMs?: number;
}): Promise<{ data: T; usedFallback: boolean }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { data: params.fallback, usedFallback: true };
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
      }),
      signal: AbortSignal.timeout(params.timeoutMs ?? 20_000),
    });

    if (!res.ok) {
      logger.warn("AI JSON completion failed", { status: res.status });
      return { data: params.fallback, usedFallback: true };
    }

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content ?? "{}";
    const parsed = params.schema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      logger.warn("AI JSON parse failed");
      return { data: params.fallback, usedFallback: true };
    }
    return { data: parsed.data, usedFallback: false };
  } catch (error) {
    logger.warn("AI JSON circuit open", { error: String(error) });
    return { data: params.fallback, usedFallback: true };
  }
}
