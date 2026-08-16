import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { logger } from "@/server/logger";

export async function findCustomerByIdentity(
  organizationId: string,
  channel: string,
  value: string,
) {
  const normalized = value.trim().toLowerCase();
  const identity = await prisma.customerIdentity.findFirst({
    where: {
      channel,
      value: { equals: normalized, mode: "insensitive" },
      customer: { organizationId },
    },
    include: { customer: { include: { identities: true } } },
  });
  return identity?.customer ?? null;
}

export async function findCustomerByPhoneOrEmail(
  organizationId: string,
  phone?: string | null,
  email?: string | null,
) {
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    const byPhone = await prisma.customer.findFirst({
      where: {
        organizationId,
        OR: [
          { phone: { contains: digits.slice(-10) } },
          { identities: { some: { channel: { in: ["phone", "whatsapp", "sms"] }, value: { contains: digits.slice(-10) } } } },
        ],
      },
      include: { identities: true },
    });
    if (byPhone) return byPhone;
  }
  if (email) {
    const byEmail = await prisma.customer.findFirst({
      where: {
        organizationId,
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { identities: { some: { channel: "email", value: { equals: email, mode: "insensitive" } } } },
        ],
      },
      include: { identities: true },
    });
    if (byEmail) return byEmail;
  }
  return null;
}

export async function createCustomer(input: {
  organizationId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  customerType?: string;
  channel?: string;
}) {
  const customer = await prisma.customer.create({
    data: {
      organizationId: input.organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ?? undefined,
      phone: input.phone ?? undefined,
      addressLine1: input.addressLine1 ?? undefined,
      city: input.city ?? undefined,
      state: input.state ?? "AZ",
      postalCode: input.postalCode ?? undefined,
      customerType: input.customerType ?? "lead",
      identities: {
        create: [
          ...(input.phone
            ? [{ channel: input.channel === "whatsapp" ? "whatsapp" : "phone", value: input.phone.replace(/\D/g, ""), isPrimary: true }]
            : []),
          ...(input.email
            ? [{ channel: "email", value: input.email.toLowerCase(), isPrimary: !input.phone }]
            : []),
        ],
      },
    },
    include: { identities: true },
  });
  logger.info("Customer created", { customerId: customer.id });
  return customer;
}

export async function updateCustomerName(customerId: string, firstName: string, lastName: string) {
  return prisma.customer.update({
    where: { id: customerId },
    data: { firstName, lastName },
    include: { identities: true },
  });
}

export async function getCustomerProfile(customerId: string) {
  return prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      identities: true,
      appointments: { orderBy: { startsAt: "desc" }, take: 20, include: { service: true, employee: true } },
      tickets: { orderBy: { createdAt: "desc" }, take: 20 },
      leads: { orderBy: { createdAt: "desc" }, take: 10 },
      conversations: { orderBy: { startedAt: "desc" }, take: 20, include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } } },
      timeline: { orderBy: { occurredAt: "desc" }, take: 50 },
      followUps: { orderBy: { scheduledFor: "desc" }, take: 10 },
    },
  });
}

export async function addTimelineEvent(input: {
  customerId: string;
  type: string;
  title: string;
  detail?: string;
  channel?: string;
  refType?: string;
  refId?: string;
  metadata?: Prisma.InputJsonValue;
  occurredAt?: Date;
}) {
  return prisma.timelineEvent.create({
    data: {
      customerId: input.customerId,
      type: input.type,
      title: input.title,
      detail: input.detail,
      channel: input.channel,
      refType: input.refType,
      refId: input.refId,
      metadata: input.metadata,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}
