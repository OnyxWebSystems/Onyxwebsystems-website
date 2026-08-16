import { addDays, addHours, subDays, subHours } from "date-fns";
import { prisma } from "@/server/db";

/** Rebuild appointments, tickets, conversations, timeline for a lively dashboard after reset. */
export async function reseedRuntimeDemoData(organizationId: string) {
  const customers = await prisma.customer.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
  const services = await prisma.service.findMany({ where: { organizationId } });
  const techs = await prisma.employee.findMany({
    where: {
      organizationId,
      role: { in: ["technician", "lead_technician", "consultant", "sales", "scheduler", "manager"] },
    },
  });
  const support = await prisma.department.findFirst({
    where: { organizationId, slug: "support" },
  });

  if (!customers.length || !services.length || !techs.length) return;

  const now = new Date();
  const acRepair = services.find((s) => s.slug === "consultation") ?? services[0];
  const maintenance = services.find((s) => s.slug === "bos-workshop") ?? services[0];

  // Upcoming + historical appointments
  for (let i = 0; i < 12; i++) {
    const customer = customers[i % customers.length];
    const tech = techs[i % techs.length];
    const startsAt = i < 6 ? addDays(addHours(now, 10 + i), i) : subDays(addHours(now, 9), i - 5);
    await prisma.appointment.create({
      data: {
        organizationId,
        customerId: customer.id,
        serviceId: i % 2 === 0 ? acRepair.id : maintenance.id,
        employeeId: tech.id,
        startsAt,
        endsAt: addHours(startsAt, 1.5),
        status: i < 6 ? "confirmed" : "completed",
        addressLine1: customer.addressLine1,
        city: customer.city,
        postalCode: customer.postalCode,
        confirmationSent: true,
      },
    });
  }

  // Tickets
  const priorities = ["CRITICAL", "HIGH", "NORMAL", "LOW"] as const;
  const statuses = ["New", "Assigned", "In Progress", "Waiting for Customer", "Escalated", "Resolved"] as const;
  for (let i = 0; i < 10; i++) {
    const customer = customers[i % customers.length];
    await prisma.ticket.create({
      data: {
        organizationId,
        ticketNumber: `ACS-${String(1000 + i).padStart(5, "0")}`,
        customerId: customer.id,
        departmentId: support?.id,
        category: i % 3 === 0 ? "complaint" : "service",
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
        subject: `Demo ticket ${i + 1}`,
        description: "Seeded demo ticket for dashboard realism.",
        slaTargetAt: addHours(now, 24),
      },
    });
  }

  // Conversations + timeline
  const channels = ["phone", "whatsapp", "email", "sms", "instagram"] as const;
  for (let i = 0; i < 50; i++) {
    const customer = customers[i % customers.length];
    const channel = channels[i % channels.length];
    const startedAt = subHours(now, 50 - i);
    const conversation = await prisma.conversation.create({
      data: {
        organizationId,
        customerId: customer.id,
        channel,
        status: i % 7 === 0 ? "escalated" : "resolved",
        subject: `Seeded ${channel} conversation`,
        summary: "Historical demo conversation",
        intent: i % 5 === 0 ? "book_appointment" : "faq",
        urgency: i % 11 === 0 ? "HIGH" : "NORMAL",
        startedAt,
        endedAt: addHours(startedAt, 0.25),
        messages: {
          create: [
            {
              direction: "inbound",
              senderType: "customer",
              body: "Hi, I need help with my AC.",
              createdAt: startedAt,
            },
            {
              direction: "outbound",
              senderType: "system",
              body: "Happy to help — I've noted your request.",
              createdAt: addHours(startedAt, 0.05),
            },
          ],
        },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        customerId: customer.id,
        type: "conversation_started",
        title: `${channel} conversation`,
        detail: conversation.summary,
        channel,
        refType: "conversation",
        refId: conversation.id,
        occurredAt: startedAt,
      },
    });
  }

  // Leads
  for (let i = 0; i < 8; i++) {
    await prisma.lead.create({
      data: {
        organizationId,
        customerId: customers[i % customers.length].id,
        serviceId: acRepair.id,
        source: i % 2 === 0 ? "phone" : "whatsapp",
        stage: ["new", "contacted", "qualified", "quoted"][i % 4],
        urgency: i % 3 === 0 ? "HIGH" : "NORMAL",
        summary: "Seeded demo lead",
        estimatedValueCents: 45000 + i * 5000,
      },
    });
  }

  await prisma.activityEvent.createMany({
    data: [
      {
        organizationId,
        type: "system",
        title: "Demo data refreshed",
        detail: "Runtime demo dataset reseeded",
        severity: "info",
      },
      {
        organizationId,
        type: "appointment",
        title: "Appointment booked",
        detail: "Maya Patel — AC Repair",
        severity: "info",
      },
      {
        organizationId,
        type: "inbound",
        title: "Incoming WhatsApp",
        detail: "+1 (602) 555-1002",
        severity: "info",
      },
    ],
  });
}
