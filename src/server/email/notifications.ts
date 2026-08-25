import { addMinutes } from "date-fns";
import { brandedEmailHtml, brandedEmailText, emailCta, formatWhen } from "./brand";
import { sendBrandedEmail } from "./resend";
import { buildCalendarInvite, googleCalendarTemplateUrl } from "@/server/calendar/ics";
import { createOnyxCalendarEvent } from "@/server/calendar/google";
import { logger } from "@/server/logger";

function teamInbox() {
  return process.env.ONYX_NOTIFY_EMAIL || process.env.RESEND_FROM_EMAIL?.match(/<([^>]+)>/)?.[1] || "onyxwebsystems@gmail.com";
}

function icsAttachment(ics: string) {
  return {
    filename: "onyx-web-systems-consultation.ics",
    content: Buffer.from(ics, "utf8").toString("base64"),
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
  };
}

export async function notifyConsultationBooked(input: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  company?: string | null;
  serviceName: string;
  startsAt: Date;
  endsAt?: Date;
  technicianName?: string | null;
  details?: string | null;
  appointmentId?: string;
  organizationId?: string;
}) {
  const endsAt = input.endsAt ?? addMinutes(input.startsAt, 30);
  const when = formatWhen(input.startsAt);
  const title = `${input.serviceName} — ${input.customerName}`;
  const description = [
    `Consultation with Onyx Web Systems`,
    `Guest: ${input.customerName}`,
    input.company ? `Company: ${input.company}` : null,
    input.customerPhone ? `Phone: ${input.customerPhone}` : null,
    input.details ? `\n${input.details}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const uid = `${input.appointmentId || input.startsAt.getTime()}@onyxwebsystems.com`;
  const ics = buildCalendarInvite({
    uid,
    title,
    description,
    startsAt: input.startsAt,
    endsAt,
    attendeeEmail: input.customerEmail,
    attendeeName: input.customerName,
  });
  const calendarLink = googleCalendarTemplateUrl({ title, details: description, startsAt: input.startsAt, endsAt });
  const extraHtml = `${emailCta(calendarLink, "Add to Google Calendar")}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#7a7a76;">A calendar invitation is also attached to this email.</p>`;

  const customerFields = [
    { label: "Meeting", value: input.serviceName },
    { label: "When", value: `${when} (Arizona time)` },
    { label: "With", value: input.technicianName ? `${input.technicianName}, Onyx Web Systems` : "Onyx Web Systems" },
    { label: "Company", value: input.company },
  ];

  const customerHtml = brandedEmailHtml({
    eyebrow: "Consultation confirmed",
    heading: "Your meeting with Onyx Web Systems is booked.",
    intro: `Dear ${input.customerName.split(" ")[0]}, thank you for booking a consultation with Onyx Web Systems. We look forward to understanding how your business operates and where a connected system can create the most value.`,
    fields: customerFields,
    extraHtml,
    closing:
      "Please add the attached invitation to your calendar. If you need to reschedule, reply to this email and we will find another time.",
  });
  const customerText = brandedEmailText({
    heading: "Your meeting with Onyx Web Systems is booked.",
    intro: `Dear ${input.customerName.split(" ")[0]}, thank you for booking a consultation with Onyx Web Systems.`,
    fields: customerFields,
    extra: `Add to Google Calendar: ${calendarLink}`,
  });

  const teamFields = [
    { label: "Client", value: input.customerName },
    { label: "Email", value: input.customerEmail },
    { label: "Phone", value: input.customerPhone },
    { label: "Company", value: input.company },
    { label: "When", value: `${when} (Arizona time)` },
    { label: "Service", value: input.serviceName },
    { label: "Notes", value: input.details },
  ];
  const teamHtml = brandedEmailHtml({
    eyebrow: "New booking",
    heading: "A consultation has been booked.",
    intro: `${input.customerName} scheduled a ${input.serviceName.toLowerCase()} with Onyx Web Systems. The meeting has been added to the Onyx calendar where Google is connected.`,
    fields: teamFields,
    extraHtml,
    closing: "Please review the notes before the call and confirm any follow-up materials.",
  });
  const teamText = brandedEmailText({
    heading: "A consultation has been booked.",
    intro: `${input.customerName} scheduled a consultation.`,
    fields: teamFields,
  });

  const icsFile = icsAttachment(ics);
  const results = await Promise.allSettled([
    sendBrandedEmail({
      to: input.customerEmail,
      subject: "Your consultation with Onyx Web Systems is confirmed",
      html: customerHtml,
      text: customerText,
      attachments: [icsFile],
    }),
    sendBrandedEmail({
      to: teamInbox(),
      subject: `New consultation booked — ${input.customerName}`,
      html: teamHtml,
      text: teamText,
      attachments: [icsFile],
    }),
    createOnyxCalendarEvent({
      title,
      description,
      startsAt: input.startsAt,
      endsAt,
      attendeeEmail: input.customerEmail,
      attendeeName: input.customerName,
      organizationId: input.organizationId,
    }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      logger.warn("Consultation notification step failed", { error: String(result.reason) });
    }
  }

  const emailResult = results[0];
  if (emailResult.status === "fulfilled") return emailResult.value;
  throw emailResult.reason;
}

export async function notifyProjectRequest(input: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  company: string;
  lookingFor: string;
  summary: string;
  organizationId?: string;
}) {
  const customerHtml = brandedEmailHtml({
    eyebrow: "Request received",
    heading: "We have received your project request.",
    intro: `Dear ${input.customerName.split(" ")[0]}, thank you for writing to Onyx Web Systems. Our team will review what you shared and follow up with the most useful next step — typically a consultation to map the system around how your business actually operates.`,
    fields: [
      { label: "Company", value: input.company },
      { label: "Interest", value: input.lookingFor },
    ],
    closing: "No action is needed from you right now. If anything is urgent, reply to this email.",
  });
  const customerText = brandedEmailText({
    heading: "We have received your project request.",
    intro: `Dear ${input.customerName.split(" ")[0]}, thank you for writing to Onyx Web Systems. We will review your request and follow up shortly.`,
    fields: [
      { label: "Company", value: input.company },
      { label: "Interest", value: input.lookingFor },
    ],
  });

  const teamHtml = brandedEmailHtml({
    eyebrow: "New project request",
    heading: "A project enquiry needs review.",
    intro: `${input.customerName} submitted a project request from the Services page.`,
    fields: [
      { label: "Client", value: input.customerName },
      { label: "Email", value: input.customerEmail },
      { label: "Phone", value: input.customerPhone },
      { label: "Company", value: input.company },
      { label: "Interest", value: input.lookingFor },
      { label: "Brief", value: input.summary },
    ],
    closing: "Please review internally, then schedule a consultation if the request is a fit.",
  });
  const teamText = brandedEmailText({
    heading: "A project enquiry needs review.",
    intro: `${input.customerName} submitted a project request.`,
    fields: [
      { label: "Client", value: input.customerName },
      { label: "Email", value: input.customerEmail },
      { label: "Phone", value: input.customerPhone },
      { label: "Company", value: input.company },
      { label: "Interest", value: input.lookingFor },
      { label: "Brief", value: input.summary },
    ],
  });

  await Promise.allSettled([
    sendBrandedEmail({
      to: input.customerEmail,
      subject: "We received your project request — Onyx Web Systems",
      html: customerHtml,
      text: customerText,
    }),
    sendBrandedEmail({
      to: teamInbox(),
      subject: `New project request — ${input.company}`,
      html: teamHtml,
      text: teamText,
    }),
  ]);
}

export async function notifyConsultationRequested(input: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  company?: string | null;
  serviceName: string;
  details?: string | null;
  scheduleUrl: string;
}) {
  const firstName = input.customerName.split(" ")[0];
  const receivedFields = [
    { label: "Meeting", value: input.serviceName },
    { label: "Company", value: input.company },
  ];
  const scheduleButton = emailCta(input.scheduleUrl, "Choose a consultation time");

  await sendBrandedEmail({
    to: input.customerEmail,
    subject: "We received your consultation request — Onyx Web Systems",
    html: brandedEmailHtml({
      eyebrow: "Request received",
      heading: "Your consultation request is booked with our team.",
      intro: `Dear ${firstName}, thank you for requesting a consultation with Onyx Web Systems. We have your details and will use them to prepare for the conversation.`,
      fields: receivedFields,
      closing:
        "The next email contains a link to choose a date and time from our live calendar. No action is needed until then.",
    }),
    text: brandedEmailText({
      heading: "Your consultation request is booked with our team.",
      intro: `Dear ${firstName}, thank you for requesting a consultation with Onyx Web Systems.`,
      fields: receivedFields,
      closing: "The next email will let you choose a date and time.",
    }),
  });

  await sendBrandedEmail({
    to: input.customerEmail,
    subject: "Choose your consultation time — Onyx Web Systems",
    html: brandedEmailHtml({
      eyebrow: "Schedule your meeting",
      heading: "Pick a date and time that works for you.",
      intro: `Dear ${firstName}, use the button below to choose a 30-minute consultation. The times shown are open on the Onyx Web Systems calendar.`,
      fields: receivedFields,
      extraHtml: scheduleButton,
      closing: "After you select a slot, we will send a calendar invitation and add the meeting to Google Calendar.",
    }),
    text: brandedEmailText({
      heading: "Pick a date and time that works for you.",
      intro: `Dear ${firstName}, choose a 30-minute consultation from our open calendar.`,
      fields: receivedFields,
      extra: `Choose a time: ${input.scheduleUrl}`,
      closing: "After you select a slot, we will send a calendar invitation.",
    }),
  });

  await sendBrandedEmail({
    to: teamInbox(),
    subject: `Consultation request — ${input.customerName} (awaiting time)`,
    html: brandedEmailHtml({
      eyebrow: "New request",
      heading: "A client requested a consultation and is choosing a time.",
      intro: `${input.customerName} submitted a consultation request. They have been emailed a link to pick an open slot on the Onyx calendar.`,
      fields: [
        { label: "Client", value: input.customerName },
        { label: "Email", value: input.customerEmail },
        { label: "Phone", value: input.customerPhone },
        { label: "Company", value: input.company },
        { label: "Service", value: input.serviceName },
        { label: "Notes", value: input.details },
      ],
      closing: "The meeting will appear on Google Calendar once they select a slot.",
    }),
    text: brandedEmailText({
      heading: "A client requested a consultation and is choosing a time.",
      intro: `${input.customerName} submitted a consultation request.`,
      fields: [
        { label: "Client", value: input.customerName },
        { label: "Email", value: input.customerEmail },
        { label: "Phone", value: input.customerPhone },
        { label: "Company", value: input.company },
        { label: "Service", value: input.serviceName },
        { label: "Notes", value: input.details },
      ],
    }),
  });
}
