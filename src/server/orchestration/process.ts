import { prisma } from "@/server/db";
import { publishActivity } from "@/server/events";
import { logger } from "@/server/logger";
import {
  addTimelineEvent,
  createCustomer,
  findCustomerByPhoneOrEmail,
  updateCustomerName,
} from "@/server/domain/customers";
import { createTicket } from "@/server/domain/tickets";
import { ESCALATE_UNKNOWN, formatKbAnswer, searchKnowledge } from "@/server/domain/knowledge";
import { bookAppointment, listAvailableSlots, rescheduleAppointment } from "@/server/booking/engine";
import { extractNlu, type NluResult } from "@/server/llm/nlu";
import { composeMessagingReply } from "@/server/llm/compose-reply";
import { classifyUrgency } from "@/server/rules/urgency";
import { routeRequest } from "@/server/rules/routing";
import { isBusinessOpen } from "@/server/domain/hours";
import { sendAppointmentConfirmationEmail, sendChannelReply } from "@/server/channels/dispatch";
import {
  decodePendingBook,
  encodePendingBook,
  frontDeskLine,
  greetingText,
  isConfirm,
  isMessagingChannel,
  isPlaceholderName,
  MENU,
  menuChoice,
  nameFromProfile,
  parsePersonName,
  type PendingSlot,
} from "@/server/messaging/front-desk";

export type InboundMessage = {
  organizationId: string;
  channel: "phone" | "whatsapp" | "email" | "sms" | "facebook" | "instagram" | "chat";
  text: string;
  from?: string | null;
  email?: string | null;
  customerName?: string | null;
  subject?: string | null;
  isMissedCall?: boolean;
  outdoorTempF?: number | null;
  simulateAfterHours?: boolean;
  /** When true, CallSession is marked live (Vapi). */
  isLiveChannel?: boolean;
  /**
   * When true, also REST-send SMS/WhatsApp reply via Twilio.
   * Leave false for Twilio inbound webhooks that reply with TwiML.
   */
  dispatchLiveOutbound?: boolean;
};

export type ProcessResult = {
  conversationId: string;
  customerId: string;
  reply: string;
  urgency: string;
  intent: string;
  departmentSlug: string;
  appointmentId?: string;
  ticketId?: string;
  escalationId?: string;
  leadId?: string;
  afterHours: boolean;
  actions: string[];
};

async function getOrg(organizationId: string) {
  return prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    include: { departments: true, services: true },
  });
}

type Org = Awaited<ReturnType<typeof getOrg>>;
type CustomerRow = Awaited<ReturnType<typeof createCustomer>>;

export async function processInbound(input: InboundMessage): Promise<ProcessResult> {
  const actions: string[] = [];
  const org = await getOrg(input.organizationId);
  const afterHours = input.simulateAfterHours ?? !isBusinessOpen(org.businessHours as never);
  const messaging = isMessagingChannel(input.channel);

  await publishActivity({
    organizationId: input.organizationId,
    type: input.isMissedCall ? "missed_call" : "inbound",
    title: input.isMissedCall ? "Missed call detected" : `Incoming ${input.channel}`,
    detail: input.from ?? input.email ?? undefined,
    severity: input.isMissedCall ? "warning" : "info",
    metadata: { channel: input.channel },
  });
  actions.push(input.isMissedCall ? "missed_call_detected" : "inbound_received");

  let customer = await findCustomerByPhoneOrEmail(input.organizationId, input.from, input.email);
  const isExisting = Boolean(customer);
  const profileName = nameFromProfile(input.customerName);

  if (!customer) {
    customer = await createCustomer({
      organizationId: input.organizationId,
      firstName: profileName?.firstName || "New",
      lastName: profileName?.lastName || (profileName ? "" : "Customer"),
      phone: input.from,
      email: input.email,
      customerType: "lead",
      channel: input.channel,
    });
    actions.push("customer_created");
  } else {
    actions.push("customer_identified");
    if (profileName && isPlaceholderName(customer.firstName, customer.lastName)) {
      customer = await updateCustomerName(customer.id, profileName.firstName, profileName.lastName);
      actions.push("customer_name_from_profile");
    }
    await publishActivity({
      organizationId: input.organizationId,
      type: "customer_identified",
      title: "Customer identified",
      detail: `${customer.firstName} ${customer.lastName}`.trim(),
    });
  }

  const { conversation, reused } = await getOrCreateConversation(input, customer, org);
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  if (!reused) {
    await addTimelineEvent({
      customerId: customer.id,
      type: input.isMissedCall ? "missed_call" : "conversation_started",
      title: input.isMissedCall ? "Missed call" : `${input.channel} conversation started`,
      detail: input.text.slice(0, 240),
      channel: input.channel,
      refType: "conversation",
      refId: conversation.id,
    });
  }

  if (input.isMissedCall) {
    return handleMissedCall({
      org,
      customer,
      conversationId: conversation.id,
      input,
      afterHours,
      actions,
      isExisting,
    });
  }

  const ctx: FlowCtx = {
    org,
    customer,
    conversationId: conversation.id,
    input,
    afterHours,
    actions,
    isExisting,
    messaging,
    history,
    departmentSlug: "support",
    intent: "unknown",
    urgency: "NORMAL",
  };

  if (messaging) {
    const named = await maybeCaptureName(ctx);
    if (named) return named;

    const pending = await maybeConfirmBooking(ctx);
    if (pending) return pending;

    const menu = await maybeHandleMenu(ctx);
    if (menu) return menu;
  }

  const nlu = await extractNlu(input.text);
  const lowerText = input.text.toLowerCase();
  if (messaging && /^(hi|hello|hey|hiya|good (morning|afternoon|evening))[\s!.]*$/i.test(input.text.trim())) {
    nlu.intent = "greeting";
    nlu.confidence = Math.max(nlu.confidence, 0.9);
  } else if (
    messaging &&
    /price|pricing|prices|cost|how much|fee|fees/.test(lowerText) &&
    !/book|consult|schedule|appointment|discovery/.test(lowerText)
  ) {
    nlu.intent = "faq";
    nlu.confidence = Math.max(nlu.confidence, 0.9);
    nlu.summary = nlu.summary || "Pricing enquiry";
  }
  actions.push("intent_extracted");
  ctx.intent = nlu.intent;

  const urgency = classifyUrgency({
    text: `${input.text} ${nlu.urgencyHints.join(" ")} ${nlu.summary}`,
    outdoorTempF: input.outdoorTempF ?? nlu.outdoorTempF,
    hasVulnerableOccupant: nlu.hasVulnerableOccupant,
    systemFullyDown: nlu.systemFullyDown,
  });
  ctx.urgency = urgency.level;

  const routing = routeRequest({
    intent: nlu.intent,
    urgency: urgency.level,
    customerType: customer.customerType,
    serviceCategory: nlu.serviceHint?.includes("install") ? "install" : "repair",
    isExistingCustomer: isExisting && customer.customerType !== "lead",
  });
  ctx.departmentSlug = routing.departmentSlug;
  const department = org.departments.find((d) => d.slug === routing.departmentSlug);

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      intent: nlu.intent,
      urgency: urgency.level,
      summary: decodePendingBook(conversation.summary) ? conversation.summary : nlu.summary,
    },
  });

  await publishActivity({
    organizationId: input.organizationId,
    type: "intent",
    title: `Intent: ${nlu.intent}`,
    detail: `Urgency ${urgency.level} → ${routing.departmentSlug}`,
    severity: urgency.level === "CRITICAL" ? "critical" : urgency.level === "HIGH" ? "warning" : "info",
  });

  const forceEscalate =
    urgency.requiresEscalation &&
    (urgency.level === "CRITICAL" || nlu.intent === "complaint" || nlu.intent === "human_request" || nlu.intent === "emergency");

  if (forceEscalate) {
    return escalateToHuman(ctx, {
      nlu,
      departmentId: department?.id,
      reason: urgency.matchedRule ?? nlu.intent,
      safetyScript: urgency.safetyScript,
      internalNotes: urgency.reasons.join("; "),
    });
  }

  if (nlu.intent === "greeting") {
    return finishReply(ctx, withNamePrompt(greetingText(customer.firstName), customer, history.length), "greeting");
  }

  if (nlu.intent === "faq" || nlu.intent === "sales" || nlu.intent === "support") {
    return answerFromKnowledge(ctx, nlu);
  }

  if (nlu.intent === "reschedule") {
    return handleReschedule(ctx, nlu);
  }

  if (nlu.intent === "book_appointment") {
    if (messaging) {
      return offerBooking(ctx, nlu);
    }
    return bookImmediately(ctx, nlu);
  }

  if (messaging && (nlu.intent === "unknown" || nlu.confidence < 0.55)) {
    const matches = await searchKnowledge(input.organizationId, input.text);
    if (formatKbAnswer(matches[0])) {
      return answerFromKnowledge(ctx, { ...nlu, intent: "faq" });
    }
    return finishReply(ctx, withNamePrompt(greetingText(customer.firstName), customer, history.length), "greeting");
  }

  const ticket = await createTicket({
    organizationId: input.organizationId,
    customerId: customer.id,
    departmentId: department?.id,
    category: nlu.intent,
    priority: urgency.level,
    subject: nlu.summary || "Customer enquiry",
    description: input.text,
    conversationId: conversation.id,
  });

  const reply =
    nlu.confidence < 0.55
      ? ESCALATE_UNKNOWN
      : `I've logged this for our ${routing.departmentSlug} team (ticket ${ticket.ticketNumber}). They have your conversation details and will follow up.`;

  await prisma.message.create({
    data: { conversationId: conversation.id, direction: "outbound", senderType: "system", body: reply },
  });
  await addTimelineEvent({
    customerId: customer.id,
    type: "ticket_created",
    title: `Ticket ${ticket.ticketNumber} created`,
    detail: ticket.subject,
    channel: input.channel,
    refType: "ticket",
    refId: ticket.id,
  });
  await publishActivity({
    organizationId: input.organizationId,
    type: "ticket",
    title: "Ticket created",
    detail: ticket.ticketNumber,
  });
  actions.push("ticket_created");

  logger.info("Inbound processed", { conversationId: conversation.id, actions });

  return {
    conversationId: conversation.id,
    customerId: customer.id,
    reply,
    urgency: urgency.level,
    intent: nlu.intent,
    departmentSlug: routing.departmentSlug,
    ticketId: ticket.id,
    afterHours,
    actions,
  };
}

type FlowCtx = {
  org: Org;
  customer: CustomerRow;
  conversationId: string;
  input: InboundMessage;
  afterHours: boolean;
  actions: string[];
  isExisting: boolean;
  messaging: boolean;
  history: { direction: string; body: string }[];
  departmentSlug: string;
  intent: string;
  urgency: string;
};

async function getOrCreateConversation(input: InboundMessage, customer: CustomerRow, org: Org) {
  if (isMessagingChannel(input.channel)) {
    const existing = await prisma.conversation.findFirst({
      where: {
        organizationId: input.organizationId,
        customerId: customer.id,
        channel: input.channel,
        status: { in: ["open", "waiting"] },
      },
      orderBy: { startedAt: "desc" },
    });
    if (existing) {
      await prisma.message.create({
        data: {
          conversationId: existing.id,
          direction: "inbound",
          senderType: "customer",
          body: input.text,
        },
      });
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { endedAt: null, status: existing.status === "waiting" ? "waiting" : "open" },
      });
      return { conversation: existing, reused: true };
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      organizationId: input.organizationId,
      customerId: customer.id,
      channel: input.channel,
      subject: input.subject ?? undefined,
      status: "open",
      messages: {
        create: {
          direction: "inbound",
          senderType: "customer",
          body: input.text,
        },
      },
      ...(input.channel === "phone"
        ? {
            callSession: {
              create: {
                fromNumber: input.from ?? undefined,
                toNumber: org.phone ?? undefined,
                direction: "inbound",
                outcome: input.isMissedCall ? "missed" : "answered",
                isSimulated: !input.isLiveChannel,
              },
            },
          }
        : {}),
    },
  });
  return { conversation, reused: false };
}

function withNamePrompt(reply: string, customer: CustomerRow, messageCount: number) {
  if (!isPlaceholderName(customer.firstName, customer.lastName)) return reply;
  if (messageCount > 6) return reply;
  if (/name and surname/i.test(reply)) return reply;
  return `${reply}\n\nMay I have your name and surname so I can put it on the thread?`;
}

async function maybeCaptureName(ctx: FlowCtx): Promise<ProcessResult | null> {
  if (!isPlaceholderName(ctx.customer.firstName, ctx.customer.lastName)) return null;
  const parsed = parsePersonName(ctx.input.text);
  if (!parsed) return null;
  ctx.customer = await updateCustomerName(ctx.customer.id, parsed.firstName, parsed.lastName);
  ctx.actions.push("customer_name_captured");
  const reply = `Thanks ${parsed.firstName}. I've added your name to the thread.\n\n${MENU}`;
  return finishReply(ctx, reply, "greeting");
}

async function maybeConfirmBooking(ctx: FlowCtx): Promise<ProcessResult | null> {
  const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: ctx.conversationId } });
  const slots = decodePendingBook(conversation.summary);
  if (!slots?.length) return null;

  const text = ctx.input.text.trim();
  if (/^(no|nope|not now|cancel|nevermind|never mind)$/i.test(text)) {
    await prisma.conversation.update({
      where: { id: ctx.conversationId },
      data: { summary: null, status: "open" },
    });
    return finishReply(ctx, `No problem — I won't book anything yet.\n\n${MENU}`, "faq");
  }

  let chosen: PendingSlot | undefined;
  if (/^2([).:]|$)/.test(text) && slots[1]) chosen = slots[1];
  else if (isConfirm(text) || /^1([).:]|$)/.test(text)) chosen = slots[0];

  if (!chosen) return null;
  return completePendingBooking(ctx, chosen);
}

async function maybeHandleMenu(ctx: FlowCtx): Promise<ProcessResult | null> {
  const choice = menuChoice(ctx.input.text);
  if (!choice) return null;
  ctx.intent = "faq";
  if (choice === 1) return answerFromKnowledge(ctx, { intent: "faq", summary: "Services", serviceHint: "consultation" } as NluResult);
  if (choice === 2) return answerFromKnowledge(ctx, { intent: "faq", summary: "Pricing", serviceHint: "consultation" } as NluResult);
  if (choice === 3) return offerBooking(ctx, { intent: "book_appointment", summary: "Book consultation", serviceHint: "consultation" } as NluResult);
  if (choice === 4) {
    return finishReply(ctx, `${frontDeskLine()}\n\n${MENU}`, "faq");
  }
  return escalateToHuman(ctx, {
    nlu: { intent: "human_request", summary: "Customer asked to speak to a person" } as NluResult,
    reason: "human_request",
  });
}

async function answerFromKnowledge(ctx: FlowCtx, nlu: Pick<NluResult, "intent" | "summary" | "serviceHint">) {
  const query = /pric|cost|fee|quote/i.test(ctx.input.text)
    ? `pricing prices ${ctx.input.text}`
    : /service/i.test(ctx.input.text) || nlu.summary === "Services"
      ? `services app development web development bos ${ctx.input.text}`
      : ctx.input.text;
  const matches = await searchKnowledge(ctx.input.organizationId, query);
  const kb = formatKbAnswer(matches[0]);
  const department = ctx.org.departments.find((d) => d.slug === ctx.departmentSlug);

  if (!kb) {
    if (ctx.messaging) {
      const draft = `I want to make sure I give you the right answer. ${frontDeskLine()}`;
      const reply = await refine(ctx, draft, matches.map((m) => m.content));
      return escalateToHuman(ctx, {
        nlu: { intent: "unknown", summary: nlu.summary } as NluResult,
        departmentId: department?.id,
        reason: "kb_miss",
        safetyScript: reply,
      });
    }
    const ticket = await createTicket({
      organizationId: ctx.input.organizationId,
      customerId: ctx.customer.id,
      departmentId: department?.id,
      category: "faq_unknown",
      priority: "NORMAL",
      subject: "Knowledge gap — escalation",
      description: ctx.input.text,
      conversationId: ctx.conversationId,
      status: "Escalated",
    });
    ctx.actions.push("kb_miss_escalated");
    await publishActivity({
      organizationId: ctx.input.organizationId,
      type: "escalation",
      title: "Escalated — missing knowledge",
      detail: ctx.input.text.slice(0, 120),
      severity: "warning",
    });
    await prisma.message.create({
      data: { conversationId: ctx.conversationId, direction: "outbound", senderType: "system", body: ESCALATE_UNKNOWN },
    });
    return {
      conversationId: ctx.conversationId,
      customerId: ctx.customer.id,
      reply: ESCALATE_UNKNOWN,
      urgency: ctx.urgency,
      intent: nlu.intent,
      departmentSlug: ctx.departmentSlug,
      ticketId: ticket.id,
      afterHours: ctx.afterHours,
      actions: ctx.actions,
    };
  }

  const draft = `${kb}\n\nIf you'd like, I can book a consultation (reply 3) or ${frontDeskLine().replace(/^You can also /, "")}`;
  const reply = ctx.messaging
    ? withNamePrompt(await refine(ctx, draft, matches.map((m) => m.content)), ctx.customer, ctx.history.length)
    : kb;

  await prisma.message.create({
    data: { conversationId: ctx.conversationId, direction: "outbound", senderType: "system", body: reply },
  });
  await addTimelineEvent({
    customerId: ctx.customer.id,
    type: "faq_answered",
    title: "FAQ answered from knowledge base",
    detail: matches[0]?.title,
    channel: ctx.input.channel,
  });
  ctx.actions.push("faq_answered");
  await publishActivity({
    organizationId: ctx.input.organizationId,
    type: "faq",
    title: "FAQ answered",
    detail: matches[0]?.title,
  });

  return {
    conversationId: ctx.conversationId,
    customerId: ctx.customer.id,
    reply,
    urgency: ctx.urgency,
    intent: nlu.intent,
    departmentSlug: ctx.departmentSlug,
    afterHours: ctx.afterHours,
    actions: ctx.actions,
  };
}

async function refine(ctx: FlowCtx, draft: string, kbSnippets: string[]) {
  if (!ctx.messaging) return draft;
  return composeMessagingReply({
    draft,
    customerName: isPlaceholderName(ctx.customer.firstName, ctx.customer.lastName)
      ? null
      : ctx.customer.firstName,
    userText: ctx.input.text,
    kbSnippets,
    history: ctx.history,
  });
}

function pickService(org: Org, hint?: string | null) {
  return (
    org.services.find((s) => s.slug === hint) ??
    org.services.find((s) => s.slug === "consultation") ??
    org.services.find((s) => s.slug === "ac-repair") ??
    org.services[0]
  );
}

async function offerBooking(ctx: FlowCtx, nlu: Pick<NluResult, "serviceHint" | "summary">) {
  const service = pickService(ctx.org, nlu.serviceHint);
  if (!service) throw new Error("No services configured");

  const slots = (
    await listAvailableSlots({
      organizationId: ctx.input.organizationId,
      serviceId: service.id,
      from: new Date(),
      days: ctx.urgency === "HIGH" ? 2 : 5,
      emergency: ctx.urgency === "HIGH",
    })
  ).slice(0, 2);

  if (!slots.length) {
    return escalateToHuman(ctx, {
      nlu: { intent: "book_appointment", summary: "No availability" } as NluResult,
      reason: "no_slots",
      safetyScript:
        "I don't have an open slot that fits right now. I've asked the team to place you manually. " + frontDeskLine(),
    });
  }

  const pending: PendingSlot[] = slots.map((slot) => ({
    serviceId: service.id,
    serviceName: service.name,
    startsAt: slot.startsAt.toISOString(),
    employeeId: slot.employeeId,
    employeeName: slot.employeeName,
  }));

  await prisma.conversation.update({
    where: { id: ctx.conversationId },
    data: { summary: encodePendingBook(pending), status: "waiting", intent: "book_appointment" },
  });

  const lines = pending
    .map(
      (slot, i) =>
        `${i + 1}) ${new Date(slot.startsAt).toLocaleString("en-US", { timeZone: "America/Phoenix" })} with ${slot.employeeName}`,
    )
    .join("\n");
  const draft = `I can book a ${service.name}. Reply yes or 1 to take the first time, or 2 for the second:\n${lines}\n\n${frontDeskLine()}`;
  const reply = withNamePrompt(await refine(ctx, draft, []), ctx.customer, ctx.history.length);
  ctx.actions.push("booking_offered");
  return finishReply(ctx, reply, "book_appointment");
}

async function completePendingBooking(ctx: FlowCtx, slot: PendingSlot): Promise<ProcessResult> {
  const appointment = await bookAppointment({
    organizationId: ctx.input.organizationId,
    customerId: ctx.customer.id,
    serviceId: slot.serviceId,
    employeeId: slot.employeeId,
    startsAt: new Date(slot.startsAt),
    urgency: ctx.urgency,
    notes: `Confirmed on ${ctx.input.channel}`,
    addressLine1: ctx.customer.addressLine1 ?? undefined,
    city: ctx.customer.city ?? undefined,
    postalCode: ctx.customer.postalCode ?? undefined,
  });

  const lead = !ctx.isExisting
    ? await prisma.lead.create({
        data: {
          organizationId: ctx.input.organizationId,
          customerId: ctx.customer.id,
          serviceId: slot.serviceId,
          source: ctx.input.channel,
          stage: "qualified",
          urgency: ctx.urgency,
          summary: `Booked ${slot.serviceName}`,
        },
      })
    : null;

  const hoursNote = ctx.afterHours
    ? " Our office is closed right now, but I've booked this for you and notified the team."
    : "";
  const reply = `Thanks${isPlaceholderName(ctx.customer.firstName, ctx.customer.lastName) ? "" : ` ${ctx.customer.firstName}`}. I've booked ${slot.serviceName} for ${new Date(slot.startsAt).toLocaleString("en-US", { timeZone: "America/Phoenix" })} with ${slot.employeeName}. A confirmation has been sent.${hoursNote}`;

  await prisma.conversation.update({
    where: { id: ctx.conversationId },
    data: { status: "resolved", endedAt: new Date(), summary: `Booked ${slot.serviceName}` },
  });
  await prisma.message.create({
    data: { conversationId: ctx.conversationId, direction: "outbound", senderType: "system", body: reply },
  });
  await addTimelineEvent({
    customerId: ctx.customer.id,
    type: "appointment_booked",
    title: "Appointment booked",
    detail: `${slot.serviceName} @ ${slot.startsAt}`,
    channel: ctx.input.channel,
    refType: "appointment",
    refId: appointment.id,
  });
  await publishActivity({
    organizationId: ctx.input.organizationId,
    type: "appointment",
    title: "Appointment booked",
    detail: `${ctx.customer.firstName} ${ctx.customer.lastName} — ${slot.serviceName}`,
  });
  ctx.actions.push("appointment_booked", "confirmation_sent", "crm_updated");
  if (lead) ctx.actions.push("lead_captured");

  await maybeSendConfirmationEmail({
    customer: ctx.customer,
    serviceName: slot.serviceName,
    startsAt: appointment.startsAt,
    technicianName: appointment.employee?.name,
    address: [appointment.addressLine1, appointment.city, appointment.postalCode].filter(Boolean).join(", "),
    actions: ctx.actions,
  });
  await maybeDispatchChannelReply(ctx.input, reply, ctx.actions);

  return {
    conversationId: ctx.conversationId,
    customerId: ctx.customer.id,
    reply,
    urgency: ctx.urgency,
    intent: "book_appointment",
    departmentSlug: "scheduling",
    appointmentId: appointment.id,
    leadId: lead?.id,
    afterHours: ctx.afterHours,
    actions: ctx.actions,
  };
}

async function bookImmediately(ctx: FlowCtx, nlu: NluResult): Promise<ProcessResult> {
  const service = pickService(ctx.org, nlu.serviceHint);
  if (!service) throw new Error("No services configured");

  const slots = await listAvailableSlots({
    organizationId: ctx.input.organizationId,
    serviceId: service.id,
    from: new Date(),
    days: ctx.urgency === "HIGH" ? 2 : 5,
    emergency: ctx.urgency === "HIGH",
  });
  const slot = slots[0];
  if (!slot) {
    const department = ctx.org.departments.find((d) => d.slug === ctx.departmentSlug);
    const ticket = await createTicket({
      organizationId: ctx.input.organizationId,
      customerId: ctx.customer.id,
      departmentId: department?.id,
      category: "scheduling",
      priority: ctx.urgency,
      subject: "No availability — needs scheduler",
      description: ctx.input.text,
      conversationId: ctx.conversationId,
      status: "Escalated",
    });
    const reply =
      "I don't have an open slot that fits right now. I've created a priority scheduling ticket so the team can place you manually.";
    await prisma.message.create({
      data: { conversationId: ctx.conversationId, direction: "outbound", senderType: "system", body: reply },
    });
    return {
      conversationId: ctx.conversationId,
      customerId: ctx.customer.id,
      reply,
      urgency: ctx.urgency,
      intent: nlu.intent,
      departmentSlug: ctx.departmentSlug,
      ticketId: ticket.id,
      afterHours: ctx.afterHours,
      actions: [...ctx.actions, "no_slots_escalated"],
    };
  }

  return completePendingBooking(ctx, {
    serviceId: service.id,
    serviceName: service.name,
    startsAt: slot.startsAt.toISOString(),
    employeeId: slot.employeeId,
    employeeName: slot.employeeName,
  });
}

async function handleReschedule(ctx: FlowCtx, nlu: NluResult): Promise<ProcessResult> {
  const upcoming = await prisma.appointment.findFirst({
    where: {
      customerId: ctx.customer.id,
      status: { in: ["scheduled", "confirmed"] },
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    include: { service: true },
  });

  if (!upcoming) {
    const reply = "I couldn't find an upcoming appointment on file. Let me connect you with scheduling.";
    return finishReply({ ...ctx, departmentSlug: "scheduling" }, reply, nlu.intent);
  }

  const slots = await listAvailableSlots({
    organizationId: ctx.input.organizationId,
    serviceId: upcoming.serviceId,
    from: new Date(),
    days: 5,
  });
  const slot = slots.find((s) => s.startsAt.getTime() !== upcoming.startsAt.getTime()) ?? slots[0];
  if (!slot) {
    return finishReply({ ...ctx, departmentSlug: "scheduling" }, ESCALATE_UNKNOWN, nlu.intent);
  }

  const updated = await rescheduleAppointment(upcoming.id, slot.startsAt, slot.employeeId);
  const reply = `I've moved your ${upcoming.service.name} appointment to ${slot.startsAt.toLocaleString("en-US", { timeZone: "America/Phoenix" })}. A confirmation has been sent.`;
  await prisma.message.create({
    data: { conversationId: ctx.conversationId, direction: "outbound", senderType: "system", body: reply },
  });
  await addTimelineEvent({
    customerId: ctx.customer.id,
    type: "appointment_rescheduled",
    title: "Appointment rescheduled",
    detail: reply,
    channel: ctx.input.channel,
    refType: "appointment",
    refId: updated.id,
  });
  await publishActivity({
    organizationId: ctx.input.organizationId,
    type: "appointment",
    title: "Appointment rescheduled",
    detail: `${ctx.customer.firstName} ${ctx.customer.lastName}`,
  });
  ctx.actions.push("appointment_rescheduled", "confirmation_sent");

  await maybeSendConfirmationEmail({
    customer: ctx.customer,
    serviceName: upcoming.service.name,
    startsAt: updated.startsAt,
    technicianName: updated.employee?.name,
    actions: ctx.actions,
  });
  await maybeDispatchChannelReply(ctx.input, reply, ctx.actions);

  return {
    conversationId: ctx.conversationId,
    customerId: ctx.customer.id,
    reply,
    urgency: ctx.urgency,
    intent: nlu.intent,
    departmentSlug: "scheduling",
    appointmentId: updated.id,
    afterHours: ctx.afterHours,
    actions: ctx.actions,
  };
}

async function escalateToHuman(
  ctx: FlowCtx,
  args: {
    nlu: Pick<NluResult, "intent" | "summary">;
    departmentId?: string;
    reason: string;
    safetyScript?: string | null;
    internalNotes?: string;
  },
): Promise<ProcessResult> {
  const ticket = await createTicket({
    organizationId: ctx.input.organizationId,
    customerId: ctx.customer.id,
    departmentId: args.departmentId,
    category: args.nlu.intent === "complaint" ? "complaint" : args.reason === "kb_miss" ? "faq_unknown" : "emergency",
    priority: ctx.urgency === "CRITICAL" ? "CRITICAL" : "HIGH",
    subject: args.nlu.summary,
    description: ctx.input.text,
    conversationId: ctx.conversationId,
    status: "Escalated",
    internalNotes: args.internalNotes,
  });

  const escalation = await prisma.escalation.create({
    data: {
      customerId: ctx.customer.id,
      conversationId: ctx.conversationId,
      ticketId: ticket.id,
      reason: args.reason,
      urgency: ctx.urgency,
      summary: args.nlu.summary,
      historySnippet: ctx.input.text.slice(0, 500),
      recommendedAction:
        ctx.urgency === "CRITICAL"
          ? "Contact the customer immediately. Do not speculate."
          : "Review context and contact the customer within SLA.",
      method: "dashboard",
      status: "open",
    },
  });

  const base =
    args.safetyScript ??
    `I've passed this to a person on the team with your conversation so they won't ask you to repeat yourself. ${frontDeskLine()}`;
  const reply = ctx.afterHours
    ? `${base} Our office is currently closed, but the on-call team has been notified.`
    : base;

  await prisma.message.create({
    data: { conversationId: ctx.conversationId, direction: "outbound", senderType: "system", body: reply },
  });
  await prisma.conversation.update({
    where: { id: ctx.conversationId },
    data: { status: "escalated", endedAt: new Date() },
  });
  await addTimelineEvent({
    customerId: ctx.customer.id,
    type: "escalation",
    title: "Human escalation",
    detail: args.reason,
    channel: ctx.input.channel,
    refType: "escalation",
    refId: escalation.id,
  });
  await publishActivity({
    organizationId: ctx.input.organizationId,
    type: "escalation",
    title: "Human escalation",
    detail: `${ctx.customer.firstName} ${ctx.customer.lastName} — ${ctx.urgency}`,
    severity: "critical",
  });
  ctx.actions.push("escalated", "ticket_created");

  return {
    conversationId: ctx.conversationId,
    customerId: ctx.customer.id,
    reply,
    urgency: ctx.urgency,
    intent: args.nlu.intent,
    departmentSlug: ctx.departmentSlug,
    ticketId: ticket.id,
    escalationId: escalation.id,
    afterHours: ctx.afterHours,
    actions: ctx.actions,
  };
}

async function finishReply(ctx: FlowCtx, reply: string, intent: string): Promise<ProcessResult> {
  await prisma.message.create({
    data: { conversationId: ctx.conversationId, direction: "outbound", senderType: "system", body: reply },
  });
  await maybeDispatchChannelReply(ctx.input, reply, ctx.actions);
  return {
    conversationId: ctx.conversationId,
    customerId: ctx.customer.id,
    reply,
    urgency: ctx.urgency,
    intent,
    departmentSlug: ctx.departmentSlug,
    afterHours: ctx.afterHours,
    actions: ctx.actions,
  };
}

async function handleMissedCall(args: {
  org: Org;
  customer: { id: string; firstName: string; lastName: string };
  conversationId: string;
  input: InboundMessage;
  afterHours: boolean;
  actions: string[];
  isExisting: boolean;
}): Promise<ProcessResult> {
  const { org, customer, conversationId, input, afterHours, actions, isExisting } = args;

  const recovery =
    `Hi${isExisting ? ` ${customer.firstName}` : ""} — we missed your call to Onyx Web Systems. ` +
    `Reply here with what you need and we'll help right away.`;

  await prisma.message.create({
    data: {
      conversationId,
      direction: "outbound",
      senderType: "system",
      body: recovery,
    },
  });

  const followText =
    input.text?.trim() && !/^missed call$/i.test(input.text)
      ? input.text
      : "I'd like to book a consultation.";

  const nlu = await extractNlu(followText);
  const service =
    org.services.find((s) => s.slug === nlu.serviceHint) ??
    org.services.find((s) => s.slug === "consultation") ??
    org.services[0];

  const lead = await prisma.lead.create({
    data: {
      organizationId: input.organizationId,
      customerId: customer.id,
      serviceId: service?.id,
      source: "missed_call",
      stage: "new",
      urgency: "HIGH",
      summary: nlu.summary || "Missed call recovery lead",
    },
  });

  await addTimelineEvent({
    customerId: customer.id,
    type: "missed_call_recovery",
    title: "Missed-call follow-up sent",
    detail: recovery,
    channel: "sms",
    refType: "lead",
    refId: lead.id,
  });

  await publishActivity({
    organizationId: input.organizationId,
    type: "lead",
    title: "Lead captured from missed call",
    detail: `${customer.firstName} ${customer.lastName}`,
    severity: "warning",
  });

  actions.push("recovery_sent", "lead_captured", "staff_notified");

  if (input.from) {
    try {
      const sent = await sendChannelReply({
        channel: "sms",
        to: input.from,
        body: recovery,
      });
      if (sent.ok && !("skipped" in sent && sent.skipped)) {
        actions.push(sent.simulated ? "recovery_sms_simulated" : "recovery_sms_sent");
      }
    } catch (error) {
      logger.warn("Missed-call SMS dispatch failed", { error: String(error) });
    }
  }

  return {
    conversationId,
    customerId: customer.id,
    reply: recovery,
    urgency: "HIGH",
    intent: "missed_call_recovery",
    departmentSlug: "scheduling",
    leadId: lead.id,
    afterHours,
    actions,
  };
}

async function maybeSendConfirmationEmail(input: {
  customer: { firstName: string; lastName: string; email?: string | null; addressLine1?: string | null };
  serviceName: string;
  startsAt: Date;
  technicianName?: string | null;
  address?: string | null;
  actions: string[];
}) {
  if (!input.customer.email) return;
  try {
    const result = await sendAppointmentConfirmationEmail({
      toEmail: input.customer.email,
      customerName: `${input.customer.firstName} ${input.customer.lastName}`,
      serviceName: input.serviceName,
      startsAt: input.startsAt,
      technicianName: input.technicianName,
      address: input.address ?? input.customer.addressLine1,
    });
    input.actions.push(result.simulated ? "email_confirmation_simulated" : "email_confirmation_sent");
  } catch (error) {
    logger.warn("Confirmation email failed", { error: String(error) });
    input.actions.push("email_confirmation_failed");
  }
}

async function maybeDispatchChannelReply(
  input: InboundMessage,
  reply: string,
  actions: string[],
) {
  if (!input.dispatchLiveOutbound) return;
  if (!input.from) return;
  if (input.channel !== "whatsapp" && input.channel !== "sms") return;
  try {
    const result = await sendChannelReply({
      channel: input.channel,
      to: input.from,
      body: reply,
    });
    if (result.ok) {
      actions.push(result.simulated ? "channel_reply_simulated" : "channel_reply_sent");
    }
  } catch (error) {
    logger.warn("Channel reply dispatch failed", { error: String(error) });
  }
}
