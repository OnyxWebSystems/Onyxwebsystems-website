import { addHours } from "date-fns";
import { prisma } from "@/server/db";

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 1,
  HIGH: 4,
  NORMAL: 24,
  LOW: 48,
};

export async function nextTicketNumber(organizationId: string) {
  const count = await prisma.ticket.count({ where: { organizationId } });
  return `ACS-${String(count + 1).padStart(5, "0")}`;
}

export async function createTicket(input: {
  organizationId: string;
  customerId: string;
  departmentId?: string | null;
  assignedToId?: string | null;
  category: string;
  priority: string;
  subject: string;
  description: string;
  conversationId?: string | null;
  status?: string;
  internalNotes?: string;
}) {
  const ticketNumber = await nextTicketNumber(input.organizationId);
  const slaHours = SLA_HOURS[input.priority] ?? 24;

  return prisma.ticket.create({
    data: {
      organizationId: input.organizationId,
      ticketNumber,
      customerId: input.customerId,
      departmentId: input.departmentId ?? undefined,
      assignedToId: input.assignedToId ?? undefined,
      category: input.category,
      priority: input.priority,
      status: input.status ?? (input.assignedToId ? "Assigned" : "New"),
      subject: input.subject,
      description: input.description,
      conversationId: input.conversationId ?? undefined,
      slaTargetAt: addHours(new Date(), slaHours),
      internalNotes: input.internalNotes,
    },
    include: { customer: true, department: true, assignedTo: true },
  });
}
