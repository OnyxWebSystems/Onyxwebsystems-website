import { prisma } from "@/server/db";
import { addTimelineEvent } from "@/server/domain/customers";

const TEST_WINDOW_START = new Date("2026-08-12T00:00:00.000Z");
const TEST_WINDOW_END = new Date("2026-08-14T23:59:59.999Z");

export function last10Digits(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "").slice(-10);
  return digits || null;
}

export function isPlaceholderPhone(phone?: string | null): boolean {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  if (!last10) return true;
  if (/^0+$/.test(digits)) return true;
  if (last10.startsWith("555555")) return true;
  if (last10 === "0000000000" || last10 === "1000000000") return true;
  return false;
}

export function parseSpokenName(text?: string | null): { firstName: string; lastName: string } | null {
  if (!text) return null;
  const patterns = [
    /(?:my name is|this is|i(?:['’]m| am)|it(?:['’]s| is)|name['’]?s)\s+([A-Za-z][A-Za-z'’-]+(?:\s+[A-Za-z][A-Za-z'’-]+)?)/i,
    /(?:caller|customer|client)(?:'s)? name is\s+([A-Za-z][A-Za-z'’-]+(?:\s+[A-Za-z][A-Za-z'’-]+)?)/i,
  ];
  const skip = /^(hi|hello|yes|no|okay|ok|thanks|please|calling|onyx|web|systems)$/i;
  for (const re of patterns) {
    const match = text.match(re);
    const raw = match?.[1]?.trim();
    if (!raw) continue;
    const parts = raw.split(/\s+/);
    const firstName = parts[0] ?? "";
    if (firstName.length < 2 || skip.test(firstName)) continue;
    return {
      firstName,
      lastName: parts.slice(1).join(" "),
    };
  }
  return null;
}

export async function findRecentConsultationBooker(organizationId: string, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const appointment = await prisma.appointment.findFirst({
    where: {
      organizationId,
      createdAt: { gte: since },
      OR: [
        { notes: { contains: "consult", mode: "insensitive" } },
        { service: { name: { contains: "consult", mode: "insensitive" } } },
        { service: { slug: { contains: "consult", mode: "insensitive" } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { customerId: true },
  });
  return appointment?.customerId ?? undefined;
}

export async function findOrCreateSihle(organizationId: string) {
  const existing = await prisma.customer.findFirst({
    where: {
      organizationId,
      firstName: { equals: "Sihle", mode: "insensitive" },
      lastName: { equals: "Simelane", mode: "insensitive" },
    },
  });
  if (existing) return existing;
  return prisma.customer.create({
    data: {
      organizationId,
      firstName: "Sihle",
      lastName: "Simelane",
      customerType: "lead",
      notes: "Consultation booker — Retell test calls attach here",
    },
  });
}

export async function resolveCallerCustomerId(input: {
  organizationId: string;
  phone?: string | null;
  transcript?: string | null;
  summary?: string | null;
}): Promise<string | undefined> {
  const { organizationId, phone, transcript, summary } = input;

  if (phone && !isPlaceholderPhone(phone)) {
    const digits = last10Digits(phone);
    if (digits) {
      const byPhone = await prisma.customer.findFirst({
        where: { organizationId, phone: { contains: digits } },
      });
      if (byPhone) return byPhone.id;
    }
  }

  const spoken = parseSpokenName(`${summary ?? ""}\n${transcript ?? ""}`);
  if (spoken) {
    const byName = await prisma.customer.findFirst({
      where: {
        organizationId,
        firstName: { equals: spoken.firstName, mode: "insensitive" },
        ...(spoken.lastName
          ? { lastName: { equals: spoken.lastName, mode: "insensitive" } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    if (byName) return byName.id;
  }

  return findRecentConsultationBooker(organizationId);
}

function isAttachableOrphan(startedAt: Date, fromNumber?: string | null) {
  const testNumber = Boolean(fromNumber && isPlaceholderPhone(fromNumber));
  const missingOrPlaceholder = !fromNumber || isPlaceholderPhone(fromNumber);
  const inTestWindow = startedAt >= TEST_WINDOW_START && startedAt <= TEST_WINDOW_END;
  return testNumber || (inTestWindow && missingOrPlaceholder);
}

export async function backfillOrphanRetellThreads(organizationId: string) {
  const orphans = await prisma.conversation.findMany({
    where: { organizationId, customerId: null, channel: "phone" },
    include: { callSession: true },
  });
  const attachable = orphans.filter((c) => isAttachableOrphan(c.startedAt, c.callSession?.fromNumber));
  if (!attachable.length) return;

  const sihle = await findOrCreateSihle(organizationId);
  await prisma.conversation.updateMany({
    where: { id: { in: attachable.map((c) => c.id) } },
    data: { customerId: sihle.id },
  });

  for (const conversation of attachable) {
    const existing = await prisma.timelineEvent.findFirst({
      where: { customerId: sihle.id, refId: conversation.id },
    });
    if (existing) continue;
    await addTimelineEvent({
      customerId: sihle.id,
      type: "conversation_started",
      title: "Live phone call",
      detail: conversation.summary ?? undefined,
      channel: "phone",
      refType: "conversation",
      refId: conversation.id,
      occurredAt: conversation.startedAt,
    });
  }
}

export function threadGroupKey(input: {
  customerId: string | null;
  channel: string;
  customerPhone?: string | null;
  fromNumber?: string | null;
}) {
  if (input.customerId) return input.customerId;
  const digits = last10Digits(input.customerPhone) ?? last10Digits(input.fromNumber);
  if (digits && !isPlaceholderPhone(digits)) return `phone:${digits}`;
  if (input.channel === "phone") return "anon:phone";
  return `anon:${input.channel}`;
}
