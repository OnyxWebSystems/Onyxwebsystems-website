import { prisma } from "@/server/db";
import { retellCallIdFromMetadata } from "@/lib/retell-links";
import { customerName, formatPhone } from "@/lib/utils";
import { backfillOrphanRetellThreads, isPlaceholderPhone, last10Digits, threadGroupKey } from "./resolve-caller";

export type ThreadListItem = {
  id: string;
  customerId: string | null;
  name: string;
  identity: string;
  intentLabel: string;
  channel: string;
  lastAt: string;
  preview: string;
  conversationCount: number;
  openItems: number;
};

export type ThreadConversation = {
  id: string;
  channel: string;
  status: string;
  intent: string | null;
  summary: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  recordingUrl: string | null;
  retellCallId: string | null;
  messages: { id: string; direction: string; senderType: string; body: string; createdAt: string }[];
  appointment: { id: string; serviceName: string; startsAt: string; status: string } | null;
  ticket: { id: string; ticketNumber: string; subject: string; status: string } | null;
};

export type ThreadDetail = {
  id: string;
  customerId: string | null;
  name: string;
  identity: string;
  email: string | null;
  phone: string | null;
  channel: string;
  intentLabel: string;
  conversations: ThreadConversation[];
  appointments: { id: string; serviceName: string; startsAt: string; status: string }[];
  tickets: { id: string; ticketNumber: string; subject: string; status: string }[];
};

function intentLabel(intent?: string | null, customerType?: string | null, serviceName?: string | null) {
  const raw = `${intent ?? ""} ${serviceName ?? ""} ${customerType ?? ""}`.toLowerCase();
  if (raw.includes("consult") || raw.includes("book")) return "consultation";
  if (raw.includes("lead") || raw.includes("sales") || raw.includes("quote")) return "lead";
  if (raw.includes("ticket") || raw.includes("support") || raw.includes("escalat")) return "support";
  if (customerType === "lead") return "lead";
  return intent || "enquiry";
}

function identityFor(customer: {
  phone?: string | null;
  email?: string | null;
  identities?: { channel: string; value: string }[];
} | null, channel: string) {
  if (!customer) return "Unknown";
  if (channel === "email" && customer.email) return customer.email;
  if ((channel === "instagram" || channel === "facebook") && customer.identities) {
    const social = customer.identities.find((i) => i.channel === channel);
    if (social) return social.value;
  }
  if (customer.phone) return formatPhone(customer.phone);
  if (customer.email) return customer.email;
  return "—";
}

export async function listActivityThreads(organizationId: string, take = 40): Promise<ThreadListItem[]> {
  await backfillOrphanRetellThreads(organizationId);

  const conversations = await prisma.conversation.findMany({
    where: { organizationId },
    orderBy: { startedAt: "desc" },
    take: 200,
    include: {
      customer: { include: { identities: true } },
      callSession: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const groups = new Map<string, typeof conversations>();
  for (const c of conversations) {
    const key = threadGroupKey({
      customerId: c.customerId,
      channel: c.channel,
      customerPhone: c.customer?.phone,
      fromNumber: c.callSession?.fromNumber,
    });
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const threads: ThreadListItem[] = [];
  for (const [key, items] of groups) {
    const latest = items[0]!;
    const customer = latest.customer;
    const name = customer ? customerName(customer) : "Unknown caller";
    const openItems = items.filter((i) => i.status === "open" || i.status === "escalated").length;
    threads.push({
      id: customer?.id ?? key,
      customerId: customer?.id ?? null,
      name,
      identity: identityFor(customer, latest.channel),
      intentLabel: intentLabel(latest.intent, customer?.customerType, latest.subject),
      channel: latest.channel,
      lastAt: latest.startedAt.toISOString(),
      preview: latest.summary || latest.messages[0]?.body || latest.subject || "Conversation",
      conversationCount: items.length,
      openItems,
    });
  }

  const seen = new Set(threads.map((t) => t.customerId).filter((id): id is string => Boolean(id)));
  const extras = await prisma.customer.findMany({
    where: {
      organizationId,
      ...(seen.size ? { id: { notIn: [...seen] } } : {}),
      OR: [{ leads: { some: {} } }, { appointments: { some: {} } }],
    },
    include: {
      leads: { orderBy: { createdAt: "desc" }, take: 1 },
      appointments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    take: take + 20,
  });
  for (const customer of extras) {
    const latestLead = customer.leads[0];
    const latestAppt = customer.appointments[0];
    const lastAt = latestLead?.createdAt ?? latestAppt?.createdAt ?? customer.createdAt;
    threads.push({
      id: customer.id,
      customerId: customer.id,
      name: customerName(customer),
      identity: identityFor(customer, "web"),
      intentLabel: latestAppt ? "consultation" : "lead",
      channel: "web",
      lastAt: lastAt.toISOString(),
      preview: latestLead?.summary || latestAppt?.notes || "Website enquiry",
      conversationCount: 0,
      openItems: 1,
    });
  }

  return threads
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
    .slice(0, take);
}

async function conversationsForThread(organizationId: string, threadId: string) {
  if (threadId === "anon:phone") {
    const orphans = await prisma.conversation.findMany({
      where: { organizationId, customerId: null, channel: "phone" },
      orderBy: { startedAt: "desc" },
      include: {
        customer: { include: { identities: true } },
        callSession: true,
        messages: { orderBy: { createdAt: "asc" }, take: 40 },
      },
    });
    return orphans.filter((c) => isPlaceholderPhone(c.callSession?.fromNumber));
  }

  if (threadId.startsWith("phone:")) {
    const digits = threadId.slice(6);
    const matches = await prisma.conversation.findMany({
      where: { organizationId, customerId: null },
      orderBy: { startedAt: "desc" },
      include: {
        customer: { include: { identities: true } },
        callSession: true,
        messages: { orderBy: { createdAt: "asc" }, take: 40 },
      },
    });
    return matches.filter((c) => last10Digits(c.callSession?.fromNumber) === digits);
  }

  if (threadId.startsWith("anon:") && threadId !== "anon:phone") {
    const rest = threadId.slice(5);
    const byId = await prisma.conversation.findMany({
      where: { organizationId, id: rest },
      orderBy: { startedAt: "desc" },
      include: {
        customer: { include: { identities: true } },
        callSession: true,
        messages: { orderBy: { createdAt: "asc" }, take: 40 },
      },
    });
    if (byId.length) return byId;
    return prisma.conversation.findMany({
      where: { organizationId, customerId: null, channel: rest },
      orderBy: { startedAt: "desc" },
      include: {
        customer: { include: { identities: true } },
        callSession: true,
        messages: { orderBy: { createdAt: "asc" }, take: 40 },
      },
    });
  }

  return null;
}

export async function getActivityThread(
  organizationId: string,
  threadId: string,
): Promise<ThreadDetail | null> {
  await backfillOrphanRetellThreads(organizationId);

  const customer = await prisma.customer.findFirst({
    where: { organizationId, id: threadId },
    include: { identities: true },
  });

  const grouped = customer ? null : await conversationsForThread(organizationId, threadId);

  const conversations = grouped
    ?? (await prisma.conversation.findMany({
      where: customer
        ? { organizationId, customerId: customer.id }
        : { organizationId, id: threadId },
      orderBy: { startedAt: "desc" },
      include: {
        customer: { include: { identities: true } },
        callSession: true,
        messages: { orderBy: { createdAt: "asc" }, take: 40 },
      },
    }));

  if (!conversations.length && !customer) return null;

  const customerId = customer?.id ?? conversations[0]?.customerId ?? null;
  const resolvedCustomer = customer ?? conversations[0]?.customer ?? null;

  const [appointments, tickets] = await Promise.all([
    customerId
      ? prisma.appointment.findMany({
          where: { organizationId, customerId },
          orderBy: { startsAt: "desc" },
          take: 20,
          include: { service: true },
        })
      : Promise.resolve([]),
    customerId
      ? prisma.ticket.findMany({
          where: { organizationId, customerId },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const latest = conversations[0];
  const channel = latest?.channel ?? (appointments.length || tickets.length ? "web" : "phone");

  return {
    id: customerId ?? threadId,
    customerId,
    name: resolvedCustomer ? customerName(resolvedCustomer) : "Unknown caller",
    identity: identityFor(resolvedCustomer, channel),
    email: resolvedCustomer?.email ?? null,
    phone: resolvedCustomer?.phone ?? null,
    channel,
    intentLabel: intentLabel(latest?.intent, resolvedCustomer?.customerType, latest?.subject),
    conversations: conversations.map((c) => {
      const relatedAppt = appointments.find(
        (a) =>
          Math.abs(a.createdAt.getTime() - c.startedAt.getTime()) < 6 * 60 * 60 * 1000 ||
          (c.endedAt && Math.abs(a.createdAt.getTime() - c.endedAt.getTime()) < 6 * 60 * 60 * 1000),
      );
      const relatedTicket = tickets.find(
        (t) => Math.abs(t.createdAt.getTime() - c.startedAt.getTime()) < 6 * 60 * 60 * 1000,
      );
      return {
        id: c.id,
        channel: c.channel,
        status: c.status,
        intent: c.intent,
        summary: c.summary,
        startedAt: c.startedAt.toISOString(),
        endedAt: c.endedAt?.toISOString() ?? null,
        durationSec: c.callSession?.durationSec ?? null,
        recordingUrl: c.callSession?.recordingUrl ?? null,
        retellCallId:
          c.messages.map((m) => retellCallIdFromMetadata(m.metadata)).find((id): id is string => Boolean(id)) ?? null,
        messages: c.messages.map((m) => ({
          id: m.id,
          direction: m.direction,
          senderType: m.senderType,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        })),
        appointment: relatedAppt
          ? {
              id: relatedAppt.id,
              serviceName: relatedAppt.service.name,
              startsAt: relatedAppt.startsAt.toISOString(),
              status: relatedAppt.status,
            }
          : null,
        ticket: relatedTicket
          ? {
              id: relatedTicket.id,
              ticketNumber: relatedTicket.ticketNumber,
              subject: relatedTicket.subject,
              status: relatedTicket.status,
            }
          : null,
      };
    }),
    appointments: appointments.map((a) => ({
      id: a.id,
      serviceName: a.service.name,
      startsAt: a.startsAt.toISOString(),
      status: a.status,
    })),
    tickets: tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      status: t.status,
    })),
  };
}
