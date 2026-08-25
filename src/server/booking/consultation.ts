import { addMinutes } from "date-fns";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { createCustomer, findCustomerByPhoneOrEmail, addTimelineEvent } from "@/server/domain/customers";
import { notifyConsultationBooked } from "@/server/email/notifications";
import { CONSULTATION_MINUTES, consultationSlotIsBookable } from "@/server/calendar/slots";
import { canRescheduleMeeting, resolveDisplayTimeZone } from "@/server/calendar/timezone";
import { publishActivity } from "@/server/events";
import { logger } from "@/server/logger";

export const INTEREST_LABEL: Record<string, string> = {
  bos: "Business Operating Systems",
  app: "App Development",
  web: "Web Development",
};

export type WebsiteBookingInput = {
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  serviceInterest: "bos" | "app" | "web";
  modules: string[];
  goals?: string | null;
  startsAt: Date;
  timeZone?: string | null;
};

async function consultationEmployee(organizationId: string) {
  return prisma.employee.findFirst({
    where: {
      organizationId,
      isActive: true,
      role: { in: ["consultant", "sales", "scheduler", "manager", "owner"] },
    },
  });
}

export async function bookWebsiteConsultation(input: WebsiteBookingInput) {
  const org = await getDemoOrganization();
  const guestTimeZone = resolveDisplayTimeZone(input.timeZone);
  const bookable = await consultationSlotIsBookable(org.id, input.startsAt);
  if (!bookable) {
    throw Object.assign(new Error("That time is no longer available. Please choose another slot."), { status: 409 });
  }

  const parts = input.name.trim().split(/\s+/);
  const firstName = parts[0] ?? input.name;
  const lastName = parts.slice(1).join(" ") || "Prospect";
  const interest = INTEREST_LABEL[input.serviceInterest];
  const moduleLine =
    input.serviceInterest === "bos" && input.modules.length ? `Modules: ${input.modules.join(", ")}` : null;
  const summary = [
    `Website consultation — ${interest}`,
    input.company ? `Company: ${input.company}` : null,
    moduleLine,
    input.goals ? `Goals: ${input.goals}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const service =
    (await prisma.service.findFirst({
      where: { organizationId: org.id, slug: "consultation" },
    })) ?? (await prisma.service.findFirst({ where: { organizationId: org.id } }));
  if (!service) throw new Error("Consultation service is not configured.");

  let customer = await findCustomerByPhoneOrEmail(org.id, input.phone, input.email);
  if (!customer) {
    customer = await createCustomer({
      organizationId: org.id,
      firstName,
      lastName,
      email: input.email,
      phone: input.phone,
      customerType: "lead",
    });
    if (input.company) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { notes: `Company: ${input.company}` },
      });
    }
  }

  const lead = await prisma.lead.create({
    data: {
      organizationId: org.id,
      customerId: customer.id,
      serviceId: service.id,
      source: "website",
      stage: "contacted",
      summary,
    },
  });

  const employee = await consultationEmployee(org.id);
  const endsAt = addMinutes(input.startsAt, CONSULTATION_MINUTES);
  const appointment = await prisma.appointment.create({
    data: {
      organizationId: org.id,
      customerId: customer.id,
      serviceId: service.id,
      employeeId: employee?.id,
      startsAt: input.startsAt,
      endsAt,
      status: "confirmed",
      notes: summary,
      confirmationSent: true,
      guestTimeZone,
      remindersSent: {},
    },
  });

  await addTimelineEvent({
    customerId: customer.id,
    type: "appointment_booked",
    title: "Consultation booked via website",
    detail: summary,
    channel: "web",
    refType: "appointment",
    refId: appointment.id,
  });

  await publishActivity({
    organizationId: org.id,
    type: "appointment",
    title: "Consultation booked",
    detail: `${firstName} ${lastName} · ${interest}`,
    metadata: { customerId: customer.id, leadId: lead.id, appointmentId: appointment.id, channel: "website" },
  });

  try {
    await notifyConsultationBooked({
      customerName: `${firstName} ${lastName}`.trim(),
      customerEmail: input.email,
      customerPhone: input.phone,
      company: input.company,
      serviceName: "Consultation",
      startsAt: input.startsAt,
      endsAt,
      details: summary,
      appointmentId: appointment.id,
      organizationId: org.id,
      guestTimeZone,
      technicianName: employee?.name,
    });
  } catch (err) {
    logger.warn("Consultation confirmation email failed", { err });
    throw Object.assign(
      new Error("Your time was reserved, but email could not be sent. Write to onyxwebsystems@gmail.com."),
      { status: 502 },
    );
  }

  return {
    leadId: lead.id,
    appointmentId: appointment.id,
    startsAt: input.startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    guestTimeZone,
  };
}

export async function rescheduleWebsiteConsultation(input: {
  appointmentId: string;
  email: string;
  startsAt: Date;
  timeZone?: string | null;
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { customer: true, service: true, employee: true },
  });
  if (!appointment || appointment.customer.email?.toLowerCase() !== input.email.toLowerCase()) {
    throw Object.assign(new Error("This reschedule link is invalid."), { status: 400 });
  }
  if (!["scheduled", "confirmed", "rescheduled"].includes(appointment.status)) {
    throw Object.assign(new Error("This meeting can no longer be changed."), { status: 400 });
  }
  if (!canRescheduleMeeting(appointment.startsAt)) {
    throw Object.assign(
      new Error("This meeting can no longer be rescheduled on the day it takes place."),
      { status: 400 },
    );
  }

  const guestTimeZone = resolveDisplayTimeZone(input.timeZone ?? appointment.guestTimeZone);
  const bookable = await consultationSlotIsBookable(appointment.organizationId, input.startsAt);
  if (!bookable) {
    throw Object.assign(new Error("That time is no longer available. Please choose another slot."), { status: 409 });
  }

  const endsAt = addMinutes(input.startsAt, CONSULTATION_MINUTES);
  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      startsAt: input.startsAt,
      endsAt,
      status: "confirmed",
      guestTimeZone,
      remindersSent: {},
      confirmationSent: true,
    },
    include: { customer: true, employee: true },
  });

  await addTimelineEvent({
    customerId: appointment.customerId,
    type: "appointment_rescheduled",
    title: "Consultation rescheduled via website",
    channel: "web",
    refType: "appointment",
    refId: appointment.id,
  });

  await notifyConsultationBooked({
    customerName: `${updated.customer.firstName} ${updated.customer.lastName}`.trim(),
    customerEmail: input.email,
    customerPhone: updated.customer.phone,
    serviceName: "Consultation",
    startsAt: input.startsAt,
    endsAt,
    appointmentId: updated.id,
    organizationId: updated.organizationId,
    guestTimeZone,
    technicianName: updated.employee?.name,
  });

  return {
    appointmentId: updated.id,
    startsAt: input.startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    guestTimeZone,
  };
}
