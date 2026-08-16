import { z } from "zod";
import type { RouteIntent } from "@/server/rules/routing";
import { logger } from "@/server/logger";

export const NluSchema = z.object({
  intent: z.enum([
    "book_appointment",
    "reschedule",
    "cancel",
    "emergency",
    "complaint",
    "billing",
    "sales",
    "support",
    "faq",
    "greeting",
    "missed_call_recovery",
    "human_request",
    "unknown",
  ]),
  confidence: z.number().min(0).max(1),
  serviceHint: z.string().nullable(),
  urgencyHints: z.array(z.string()).default([]),
  customerName: z.string().nullable(),
  address: z.string().nullable(),
  postalCode: z.string().nullable(),
  hasVulnerableOccupant: z.boolean().nullable(),
  systemFullyDown: z.boolean().nullable(),
  outdoorTempF: z.number().nullable(),
  summary: z.string(),
});

export type NluResult = z.infer<typeof NluSchema>;

function emptySlots(overrides: Partial<NluResult> & Pick<NluResult, "intent" | "confidence" | "summary">): NluResult {
  return {
    serviceHint: null,
    urgencyHints: [],
    customerName: null,
    address: null,
    postalCode: null,
    hasVulnerableOccupant: null,
    systemFullyDown: null,
    outdoorTempF: null,
    ...overrides,
  };
}

function serviceHintFrom(text: string) {
  const lower = text.toLowerCase();
  if (/app development|mobile app|sec nightlife/.test(lower)) return "app-discovery";
  if (/web development|website|landing page/.test(lower)) return "web-kickoff";
  if (/bos|business operating|module/.test(lower)) return "consultation";
  return "consultation";
}

/** Deterministic fixture NLU for demos without OPENAI_API_KEY. */
export function fixtureNlu(text: string): NluResult {
  const lower = text.toLowerCase().trim();

  if (/gas|carbon monoxide|co alarm|spark|smoke|flood|pipe burst/.test(lower)) {
    return emptySlots({
      intent: "emergency",
      confidence: 0.95,
      serviceHint: "emergency-service",
      urgencyHints: ["safety"],
      systemFullyDown: true,
      summary: "Possible life-safety emergency",
    });
  }

  if (/angry|unacceptable|complaint|refund|lawsuit/.test(lower)) {
    return emptySlots({
      intent: "complaint",
      confidence: 0.9,
      urgencyHints: ["complaint"],
      summary: "Customer complaint requiring escalation",
    });
  }

  if (/speak to (a )?(person|human|someone)|real person|talk to (a )?human/.test(lower)) {
    return emptySlots({
      intent: "human_request",
      confidence: 0.92,
      summary: "Customer requested a human",
    });
  }

  if (/reschedule|move (my|the) appointment|change (my|the) appointment/.test(lower)) {
    return emptySlots({
      intent: "reschedule",
      confidence: 0.9,
      summary: "Customer wants to reschedule an appointment",
    });
  }

  if (/cancel (my|the) appointment/.test(lower)) {
    return emptySlots({
      intent: "cancel",
      confidence: 0.9,
      summary: "Customer wants to cancel an appointment",
    });
  }

  if (/^(hi|hello|hey|hiya|good (morning|afternoon|evening))[\s!.]*$/i.test(lower) || lower === "hi there") {
    return emptySlots({
      intent: "greeting",
      confidence: 0.95,
      summary: "Greeting",
    });
  }

  if (/price|pricing|prices|cost|how much|fee|fees/.test(lower)) {
    return emptySlots({
      intent: "faq",
      confidence: 0.9,
      serviceHint: serviceHintFrom(text),
      summary: "Pricing enquiry",
    });
  }

  if (/hours|warranty|portfolio|modules?|bos|sec nightlife|services?|what do you (do|offer)/.test(lower)) {
    return emptySlots({
      intent: "faq",
      confidence: 0.85,
      serviceHint: serviceHintFrom(text),
      summary: "FAQ / informational enquiry",
    });
  }

  if (/bill|invoice|payment|charge/.test(lower)) {
    return emptySlots({
      intent: "billing",
      confidence: 0.85,
      summary: "Billing enquiry",
    });
  }

  if (/consult|book|appointment|schedule|discovery call|kickoff/.test(lower)) {
    return emptySlots({
      intent: "book_appointment",
      confidence: 0.88,
      serviceHint: serviceHintFrom(text),
      urgencyHints: /urgent|asap|down|outage/.test(lower) ? ["urgent"] : [],
      postalCode: extractZip(text),
      systemFullyDown: /site down|production down|outage/.test(lower),
      summary: /app/.test(lower)
        ? "App development booking enquiry"
        : /web|website/.test(lower)
          ? "Web development booking enquiry"
          : "Consultation / BOS booking enquiry",
    });
  }

  return emptySlots({
    intent: "unknown" as RouteIntent,
    confidence: 0.4,
    postalCode: extractZip(text),
    summary: "Unclear intent",
  });
}

function extractZip(text: string) {
  const m = text.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

const ONYX_NLU_PROMPT = `You classify inbound messages for Onyx Web Systems, a technology partner for Business Operating Systems (BOS), App Development, and Web Development.

Return JSON with keys: intent, confidence, serviceHint, urgencyHints, customerName, address, postalCode, hasVulnerableOccupant, systemFullyDown, outdoorTempF, summary.

intent must be one of: book_appointment, reschedule, cancel, emergency, complaint, billing, sales, support, faq, greeting, missed_call_recovery, human_request, unknown.

Rules:
- "hi" / "hello" / "hey" alone → greeting
- pricing, prices, cost, fees, how much → faq (never book_appointment)
- quote alone is not an instant book
- book / consult / schedule / discovery call → book_appointment
- sales or support questions that are not an explicit booking request → sales or support (do not use book_appointment)
- speak to a person / human / manager → human_request
- Never invent prices or company policy facts
- serviceHint when relevant: consultation, app-discovery, web-kickoff, bos-workshop`;

export async function extractNlu(text: string): Promise<NluResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return fixtureNlu(text);
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
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: ONYX_NLU_PROMPT,
          },
          { role: "user", content: text },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      logger.warn("OpenAI NLU failed, using fixture", { status: res.status });
      return fixtureNlu(text);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = NluSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      logger.warn("NLU parse failed, using fixture");
      return fixtureNlu(text);
    }
    return parsed.data;
  } catch (error) {
    logger.warn("NLU circuit open, using fixture", { error: String(error) });
    return fixtureNlu(text);
  }
}
