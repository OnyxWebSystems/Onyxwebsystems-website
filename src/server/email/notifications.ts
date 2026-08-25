import { addMinutes } from "date-fns";
import { brandedEmailHtml, brandedEmailText, emailCta, formatWhenForGuest, publicSiteUrl } from "./brand";
import { sendBrandedEmail } from "./resend";
import { buildCalendarInvite, googleCalendarTemplateUrl } from "@/server/calendar/ics";
import { createOnyxCalendarEvent } from "@/server/calendar/google";
import { canRescheduleMeeting } from "@/server/calendar/timezone";
import { signRescheduleToken } from "@/server/booking/schedule-token";
import { logger } from "@/server/logger";

function teamInbox() {
  return process.env.ONYX_NOTIFY_EMAIL || "onyxwebsystems@gmail.com";
}

function icsAttachment(ics: string) {
  return {
    filename: "onyx-web-systems-consultation.ics",
    content: Buffer.from(ics, "utf8").toString("base64"),
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
  };
}

function rescheduleUrl(appointmentId: string, email: string) {
  const token = signRescheduleToken({ appointmentId, email });
  return `${publicSiteUrl()}/book/reschedule?token=${encodeURIComponent(token)}`;
}

function bookingActionsHtml(input: {
  calendarLink: string;
  appointmentId?: string;
  customerEmail: string;
  startsAt: Date;
}) {
  const parts = [emailCta(input.calendarLink, "Add to Google Calendar")];
  if (input.appointmentId && canRescheduleMeeting(input.startsAt)) {
    parts.push(emailCta(rescheduleUrl(input.appointmentId, input.customerEmail), "Reschedule this meeting"));
  }
  parts.push(
    `<p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#7a7a76;">A calendar invitation is also attached to this email.</p>`,
  );
  return parts.join("");
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
  guestTimeZone?: string | null;
}) {
  const endsAt = input.endsAt ?? addMinutes(input.startsAt, 30);
  const when = formatWhenForGuest(input.startsAt, input.guestTimeZone);
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
  const extraHtml = bookingActionsHtml({
    calendarLink,
    appointmentId: input.appointmentId,
    customerEmail: input.customerEmail,
    startsAt: input.startsAt,
  });

  const rescheduleAllowed = Boolean(input.appointmentId && canRescheduleMeeting(input.startsAt));
  const closing = rescheduleAllowed
    ? "Please add the attached invitation to your calendar. You can reschedule from the button above until the day of the meeting."
    : "Please add the attached invitation to your calendar. On the day of the meeting, this time is locked.";

  const customerFields = [
    { label: "Meeting", value: input.serviceName },
    { label: "When", value: when },
    { label: "With", value: input.technicianName ? `${input.technicianName}, Onyx Web Systems` : "Onyx Web Systems" },
    { label: "Company", value: input.company },
  ];

  const customerHtml = brandedEmailHtml({
    eyebrow: "Consultation confirmed",
    heading: "Your meeting with Onyx Web Systems is booked.",
    intro: `Dear ${input.customerName.split(" ")[0]}, thank you for booking a consultation with Onyx Web Systems. We look forward to understanding how your business operates and where a connected system can create the most value.`,
    fields: customerFields,
    extraHtml,
    closing,
  });
  const customerText = brandedEmailText({
    heading: "Your meeting with Onyx Web Systems is booked.",
    intro: `Dear ${input.customerName.split(" ")[0]}, thank you for booking a consultation with Onyx Web Systems.`,
    fields: customerFields,
    extra: `Add to Google Calendar: ${calendarLink}`,
    closing,
  });

  const teamFields = [
    { label: "Client", value: input.customerName },
    { label: "Email", value: input.customerEmail },
    { label: "Phone", value: input.customerPhone },
    { label: "Company", value: input.company },
    { label: "When", value: when },
    { label: "Service", value: input.serviceName },
    { label: "Notes", value: input.details },
  ];
  const teamHtml = brandedEmailHtml({
    eyebrow: "New booking",
    heading: "A consultation has been booked.",
    intro: `${input.customerName} scheduled a ${input.serviceName.toLowerCase()} with Onyx Web Systems.`,
    fields: teamFields,
    extraHtml: emailCta(calendarLink, "Open in Google Calendar"),
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

export async function notifyConsultationReminder(input: {
  customerName: string;
  customerEmail: string;
  startsAt: Date;
  endsAt: Date;
  company?: string | null;
  appointmentId: string;
  guestTimeZone?: string | null;
  kind: "5d" | "3d" | "1d" | "1h" | "15m";
}) {
  const when = formatWhenForGuest(input.startsAt, input.guestTimeZone);
  const labels: Record<typeof input.kind, { subject: string; heading: string; intro: string }> = {
    "5d": {
      subject: "Your Onyx consultation is in 5 days",
      heading: "A reminder: your consultation is in five days.",
      intro: `Dear ${input.customerName.split(" ")[0]}, this is a reminder that your consultation with Onyx Web Systems is coming up.`,
    },
    "3d": {
      subject: "Your Onyx consultation is in 3 days",
      heading: "Your consultation is in three days.",
      intro: `Dear ${input.customerName.split(" ")[0]}, we look forward to speaking with you in three days.`,
    },
    "1d": {
      subject: "Your Onyx consultation is tomorrow",
      heading: "Your consultation is tomorrow.",
      intro: `Dear ${input.customerName.split(" ")[0]}, your consultation with Onyx Web Systems is tomorrow.`,
    },
    "1h": {
      subject: "Your Onyx consultation starts in 1 hour",
      heading: "Your consultation starts in one hour.",
      intro: `Dear ${input.customerName.split(" ")[0]}, we will speak with you in one hour.`,
    },
    "15m": {
      subject: "Your Onyx consultation starts in 15 minutes",
      heading: "Your consultation starts in 15 minutes.",
      intro: `Dear ${input.customerName.split(" ")[0]}, please join shortly — we start in 15 minutes.`,
    },
  };
  const copy = labels[input.kind];
  const calendarLink = googleCalendarTemplateUrl({
    title: `Consultation — ${input.customerName}`,
    details: "Consultation with Onyx Web Systems",
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });
  const extraHtml = bookingActionsHtml({
    calendarLink,
    appointmentId: input.appointmentId,
    customerEmail: input.customerEmail,
    startsAt: input.startsAt,
  });

  await sendBrandedEmail({
    to: input.customerEmail,
    subject: copy.subject,
    html: brandedEmailHtml({
      eyebrow: "Reminder",
      heading: copy.heading,
      intro: copy.intro,
      fields: [
        { label: "When", value: when },
        { label: "Company", value: input.company },
      ],
      extraHtml,
      closing: canRescheduleMeeting(input.startsAt)
        ? "If you need a different time, use the reschedule button before the day of the meeting."
        : "This meeting can no longer be rescheduled online. Reply to this email if you cannot attend.",
    }),
    text: brandedEmailText({
      heading: copy.heading,
      intro: copy.intro,
      fields: [{ label: "When", value: when }],
    }),
  });
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
