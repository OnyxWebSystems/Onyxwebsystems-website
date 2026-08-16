export type DialogueTurn = {
  role: "agent" | "customer";
  text: string;
};

const SYSTEM_NOISE = /^(call started|call ended|call in progress)$/i;

function speakerRe() {
  return /(?:^|\n)\s*(agent|user|customer|front desk|assistant)\s*:\s*/gi;
}

function roleFromLabel(label: string): DialogueTurn["role"] {
  const key = label.toLowerCase().trim();
  if (key === "user" || key === "customer") return "customer";
  return "agent";
}

export function parseDialogue(body: string): DialogueTurn[] {
  const text = body.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const matches = [...text.matchAll(speakerRe())];
  if (!matches.length) {
    return SYSTEM_NOISE.test(text) ? [] : [{ role: "customer", text }];
  }

  const turns: DialogueTurn[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!;
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? text.length;
    const chunk = text.slice(start, end).trim();
    if (!chunk || SYSTEM_NOISE.test(chunk)) continue;
    turns.push({
      role: roleFromLabel(match[1] ?? "agent"),
      text: chunk,
    });
  }
  return turns;
}

export function turnsFromMessages(
  messages: { senderType: string; body: string }[],
): DialogueTurn[] {
  const turns: DialogueTurn[] = [];
  for (const message of messages) {
    if (SYSTEM_NOISE.test(message.body.trim())) continue;
    const parsed = parseDialogue(message.body);
    if (parsed.length > 1 || speakerRe().test(message.body)) {
      turns.push(...parsed);
      continue;
    }
    if (parsed.length === 1) {
      turns.push({
        role: message.senderType === "customer" ? "customer" : parsed[0]!.role,
        text: parsed[0]!.text,
      });
      continue;
    }
    turns.push({
      role: message.senderType === "customer" ? "customer" : "agent",
      text: message.body.trim(),
    });
  }
  return turns;
}

export function customerFirstName(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0] ?? "Customer";
  if (!first || first.toLowerCase() === "unknown") return "Customer";
  return first;
}
