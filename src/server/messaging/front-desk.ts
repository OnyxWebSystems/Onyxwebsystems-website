import { formatPhone } from "@/lib/utils";

export const MENU = `How can I help?
1) Services
2) Pricing
3) Book a consultation
4) Call the front desk
5) Speak to a person`;

export function frontDeskNumber() {
  return process.env.RETELL_PHONE_NUMBER || process.env.TWILIO_SMS_FROM || null;
}

export function frontDeskLine() {
  const number = frontDeskNumber();
  if (!number) return "You can also ask to speak with a person and I'll escalate this to the team.";
  return `You can also call the front desk on ${formatPhone(number)}.`;
}

export function greetingText(firstName?: string | null) {
  const hi = firstName && !isPlaceholderName(firstName, "") ? `Hi ${firstName}` : "Hi";
  return `${hi}, you've reached Onyx Web Systems — Business Operating Systems, App Development, and Web Development.\n\n${MENU}`;
}

export function isPlaceholderName(firstName?: string | null, lastName?: string | null) {
  const first = (firstName ?? "").trim().toLowerCase();
  const last = (lastName ?? "").trim().toLowerCase();
  return !first || first === "new" || last === "customer" || `${first} ${last}` === "new customer";
}

export function parsePersonName(text: string): { firstName: string; lastName: string } | null {
  const cleaned = text
    .replace(/^(my name is|i am|i'm|this is|it's|im)\s+/i, "")
    .replace(/[?.!]/g, "")
    .trim();
  if (!cleaned || cleaned.length > 60) return null;
  if (/^(hi|hello|hey|yes|no|ok|okay|thanks|1|2|3|4|5)$/i.test(cleaned)) return null;
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return null;
  if (parts.some((p) => p.length < 2 || /[^a-zA-Z'’-]/u.test(p))) return null;
  return { firstName: capitalize(parts[0]!), lastName: parts.slice(1).map(capitalize).join(" ") };
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function isConfirm(text: string) {
  return /^(yes|y|yeah|yep|ok|okay|sure|book( it)?|confirm|1)$/i.test(text.trim());
}

export function menuChoice(text: string): 1 | 2 | 3 | 4 | 5 | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^([1-5])([).:]|$)/);
  if (match) return Number(match[1]) as 1 | 2 | 3 | 4 | 5;
  if (/^services?$/i.test(trimmed)) return 1;
  if (/^pric(e|ing|es)$/i.test(trimmed)) return 2;
  if (/^book/i.test(trimmed) && trimmed.length < 24) return 3;
  if (/^call/i.test(trimmed) && trimmed.length < 24) return 4;
  if (/human|person|someone|manager/i.test(trimmed) && trimmed.length < 40) return 5;
  return null;
}

export function isMessagingChannel(channel: string) {
  return channel === "whatsapp" || channel === "sms";
}

export const PENDING_PREFIX = "pending_book|";

export type PendingSlot = {
  serviceId: string;
  serviceName: string;
  startsAt: string;
  employeeId: string;
  employeeName: string;
};

export function encodePendingBook(slots: PendingSlot[]) {
  return `${PENDING_PREFIX}${JSON.stringify(slots)}`;
}

export function decodePendingBook(summary?: string | null): PendingSlot[] | null {
  if (!summary?.startsWith(PENDING_PREFIX)) return null;
  const raw = summary.slice(PENDING_PREFIX.length);
  try {
    const parsed = JSON.parse(raw) as PendingSlot[];
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.serviceId) return parsed;
  } catch {
    const parts = summary.split("|");
    if (parts.length >= 6) {
      return [
        {
          serviceId: parts[1]!,
          serviceName: parts[2]!,
          startsAt: parts[3]!,
          employeeId: parts[4]!,
          employeeName: parts[5]!,
        },
      ];
    }
  }
  return null;
}

export function nameFromProfile(profile?: string | null): { firstName: string; lastName: string } | null {
  if (!profile?.trim()) return null;
  const parsed = parsePersonName(profile);
  if (parsed) return parsed;
  const parts = profile.trim().split(/\s+/).filter(Boolean);
  if (!parts[0] || /[^a-zA-Z'’-]/u.test(parts[0])) return null;
  return {
    firstName: capitalize(parts[0]),
    lastName: parts.slice(1).map(capitalize).join(" "),
  };
}
