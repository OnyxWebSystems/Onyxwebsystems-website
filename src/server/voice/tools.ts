import { z } from "zod";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import {
  addTimelineEvent,
  createCustomer,
  findCustomerByPhoneOrEmail,
} from "@/server/domain/customers";
import { createTicket } from "@/server/domain/tickets";
import { ESCALATE_UNKNOWN, formatKbAnswer, searchKnowledge } from "@/server/domain/knowledge";
import { bookAppointment, listAvailableSlots } from "@/server/booking/engine";
import { sendAppointmentConfirmationEmail } from "@/server/channels/dispatch";
import { publishActivity } from "@/server/events";
import { classifyUrgency } from "@/server/rules/urgency";
import { logger } from "@/server/logger";

export type VoiceToolCall = {
  id?: string;
  name: string;
  parameters?: Record<string, unknown>;
  arguments?: Record<string, unknown> | string;
};

/** @deprecated Use VoiceToolCall */
export type VapiToolCall = VoiceToolCall;

const DEFAULT_SERVICE_SLUG = "consultation";

function paramsOf(call: VoiceToolCall): Record<string, unknown> {
  if (call.parameters && typeof call.parameters === "object") return call.parameters;
  if (typeof call.arguments === "string") {
    try {
      return JSON.parse(call.arguments) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (call.arguments && typeof call.arguments === "object") return call.arguments;
  return {};
}

export async function executeVoiceTool(call: VoiceToolCall): Promise<unknown> {
  const name = call.name;
  const raw = paramsOf(call);
  const org = await getDemoOrganization();

  logger.info("Voice tool call", { name, raw });

  switch (name) {
    case "lookup_customer": {
      const phone = String(raw.phone ?? "");
      const email = raw.email ? String(raw.email) : null;
      const customer = await findCustomerByPhoneOrEmail(org.id, phone, email);
      if (!customer) return { found: false };
      return {
        found: true,
        customerId: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        email: customer.email,
        address: [customer.addressLine1, customer.city, customer.postalCode].filter(Boolean).join(", "),
        customerType: customer.customerType,
      };
    }

    case "check_availability": {
      const serviceSlug = String(raw.serviceSlug ?? DEFAULT_SERVICE_SLUG);
      const days = Number(raw.days ?? 5);
      const service =
        (await prisma.service.findFirst({ where: { organizationId: org.id, slug: serviceSlug } })) ??
        (await prisma.service.findFirst({
          where: { organizationId: org.id, slug: DEFAULT_SERVICE_SLUG },
        }));
      if (!service) return { error: "No services configured" };

      const slots = await listAvailableSlots({
        organizationId: org.id,
        serviceId: service.id,
        from: new Date(),
        days,
      });

      return {
        service: service.name,
        serviceSlug: service.slug,
        slots: slots.slice(0, 6).map((s) => ({
          startsAt: s.startsAt.toISOString(),
          label: s.startsAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" }),
          employeeName: s.employeeName,
          employeeId: s.employeeId,
        })),
      };
    }

    case "book_appointment": {
      const schema = z.object({
        phone: z.string().min(7),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        serviceSlug: z.string().default(DEFAULT_SERVICE_SLUG),
        startsAt: z.string().min(1),
        email: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        employeeId: z.string().optional().nullable(),
      });
      const p = schema.parse(raw);
      let customer = await findCustomerByPhoneOrEmail(org.id, p.phone, p.email);
      if (!customer) {
        customer = await createCustomer({
          organizationId: org.id,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          email: p.email,
          addressLine1: p.address,
          postalCode: p.postalCode,
          city: "Phoenix",
          customerType: "lead",
          channel: "phone",
        });
      }

      const service =
        (await prisma.service.findFirst({ where: { organizationId: org.id, slug: p.serviceSlug } })) ??
        (await prisma.service.findFirst({
          where: { organizationId: org.id, slug: DEFAULT_SERVICE_SLUG },
        }));
      if (!service) return { error: "Service not found" };

      let employeeId = p.employeeId ?? undefined;
      if (!employeeId) {
        const slots = await listAvailableSlots({
          organizationId: org.id,
          serviceId: service.id,
          from: new Date(p.startsAt),
          days: 1,
        });
        const match =
          slots.find((s) => Math.abs(s.startsAt.getTime() - new Date(p.startsAt).getTime()) < 60_000) ??
          slots[0];
        if (!match) return { error: "Selected slot unavailable" };
        employeeId = match.employeeId;
      }

      const appointment = await bookAppointment({
        organizationId: org.id,
        customerId: customer.id,
        serviceId: service.id,
        employeeId,
        startsAt: new Date(p.startsAt),
        notes: "Booked via live phone",
        addressLine1: p.address ?? customer.addressLine1 ?? undefined,
        city: customer.city ?? "Phoenix",
        postalCode: p.postalCode ?? customer.postalCode ?? undefined,
      });

      await addTimelineEvent({
        customerId: customer.id,
        type: "appointment_booked",
        title: "Appointment booked (phone)",
        detail: `${service.name} @ ${appointment.startsAt.toISOString()}`,
        channel: "phone",
        refType: "appointment",
        refId: appointment.id,
      });

      await publishActivity({
        organizationId: org.id,
        type: "appointment",
        title: "Appointment booked",
        detail: `${customer.firstName} ${customer.lastName} — ${service.name}`,
        metadata: { customerId: customer.id, appointmentId: appointment.id, channel: "phone" },
      });

      if (customer.email || p.email) {
        try {
          await sendAppointmentConfirmationEmail({
            toEmail: (p.email || customer.email)!,
            customerName: `${customer.firstName} ${customer.lastName}`,
            customerPhone: customer.phone,
            serviceName: service.name,
            startsAt: appointment.startsAt,
            endsAt: appointment.endsAt,
            technicianName: appointment.employee?.name,
            appointmentId: appointment.id,
            organizationId: org.id,
          });
        } catch (error) {
          logger.warn("Voice booking confirmation email failed", { error: String(error) });
        }
      }

      return {
        ok: true,
        appointmentId: appointment.id,
        service: service.name,
        startsAt: appointment.startsAt.toISOString(),
        label: appointment.startsAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" }),
        technician: appointment.employee?.name,
      };
    }

    case "create_ticket": {
      const phone = String(raw.phone ?? "");
      const subject = String(raw.subject ?? "Phone enquiry");
      const description = String(raw.description ?? subject);
      const priority = String(raw.priority ?? "NORMAL");
      let customer = await findCustomerByPhoneOrEmail(org.id, phone, null);
      if (!customer) {
        customer = await createCustomer({
          organizationId: org.id,
          firstName: "Phone",
          lastName: "Caller",
          phone,
          channel: "phone",
        });
      }
      const ticket = await createTicket({
        organizationId: org.id,
        customerId: customer.id,
        category: "phone",
        priority,
        subject,
        description,
      });
      await publishActivity({
        organizationId: org.id,
        type: "ticket",
        title: "Ticket created",
        detail: ticket.ticketNumber,
        metadata: { customerId: customer.id, ticketId: ticket.id, channel: "phone" },
      });
      return { ok: true, ticketNumber: ticket.ticketNumber, ticketId: ticket.id };
    }

    case "escalate": {
      const phone = String(raw.phone ?? "");
      const reason = String(raw.reason ?? "human_request");
      const summary = String(raw.summary ?? "Escalation from phone");
      const urgencyInput = classifyUrgency({ text: `${reason} ${summary}` });
      const urgency = String(raw.urgency ?? urgencyInput.level);

      let customer = await findCustomerByPhoneOrEmail(org.id, phone, null);
      if (!customer) {
        customer = await createCustomer({
          organizationId: org.id,
          firstName: "Phone",
          lastName: "Caller",
          phone,
          channel: "phone",
        });
      }

      const dept = await prisma.department.findFirst({
        where: {
          organizationId: org.id,
          slug: urgency === "CRITICAL" ? "emergency" : "management",
        },
      });

      const ticket = await createTicket({
        organizationId: org.id,
        customerId: customer.id,
        departmentId: dept?.id,
        category: "escalation",
        priority: urgency,
        subject: summary,
        description: reason,
        status: "Escalated",
      });

      const escalation = await prisma.escalation.create({
        data: {
          customerId: customer.id,
          ticketId: ticket.id,
          reason,
          urgency,
          summary,
          recommendedAction:
            urgency === "CRITICAL"
              ? "Contact customer immediately. Preserve security evidence; do not request passwords over chat."
              : "Review and contact customer within SLA.",
          method: "dashboard",
          status: "open",
        },
      });

      await publishActivity({
        organizationId: org.id,
        type: "escalation",
        title: "Human escalation",
        detail: `${customer.firstName} ${customer.lastName} — ${urgency}`,
        severity: "critical",
        metadata: { customerId: customer.id, ticketId: ticket.id, channel: "phone" },
      });

      return {
        ok: true,
        escalationId: escalation.id,
        ticketNumber: ticket.ticketNumber,
        safetyScript: urgencyInput.safetyScript,
        message:
          urgencyInput.safetyScript ??
          "I've escalated this with full context so your team can help without asking you to repeat yourself.",
      };
    }

    case "search_knowledge": {
      const query = String(raw.query ?? "");
      const matches = await searchKnowledge(org.id, query);
      const answer = formatKbAnswer(matches[0]);
      if (!answer) {
        return { found: false, message: ESCALATE_UNKNOWN };
      }
      return { found: true, title: matches[0]?.title, answer };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function executeVoiceTools(calls: VoiceToolCall[]) {
  const results = [];
  for (const call of calls) {
    const result = await executeVoiceTool(call);
    results.push({
      toolCallId: call.id,
      name: call.name,
      result,
    });
  }
  return results;
}

/** @deprecated Use executeVoiceTool */
export const executeVapiTool = executeVoiceTool;
/** @deprecated Use executeVoiceTools */
export const executeVapiToolCalls = executeVoiceTools;
