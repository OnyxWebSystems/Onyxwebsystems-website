import { BRAND_REPLY_TO, BRAND_TIMEZONE } from "@/server/email/brand";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function utcStamp(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function fold(line: string) {
  return line.replace(/[,;\\]/g, (ch) => `\\${ch}`).replace(/\n/g, "\\n");
}

export function buildCalendarInvite(input: {
  uid: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  organizerEmail?: string;
  attendeeEmail?: string;
  attendeeName?: string;
}) {
  const organizer = input.organizerEmail ?? BRAND_REPLY_TO;
  const stamp = utcStamp(new Date());
  const start = utcStamp(input.startsAt);
  const end = utcStamp(input.endsAt);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Onyx Web Systems//Consultations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "X-WR-CALNAME:Onyx Web Systems",
    `X-WR-TIMEZONE:${BRAND_TIMEZONE}`,
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${fold(input.title)}`,
    `DESCRIPTION:${fold(input.description)}`,
    `ORGANIZER;CN=Onyx Web Systems:mailto:${organizer}`,
    input.attendeeEmail
      ? `ATTENDEE;CN=${fold(input.attendeeName || input.attendeeEmail)};RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:${input.attendeeEmail}`
      : null,
    "LOCATION:Video consultation — details to follow from Onyx Web Systems",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Onyx Web Systems consultation in 1 hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function googleCalendarTemplateUrl(input: {
  title: string;
  details: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const dates = `${utcStamp(input.startsAt)}/${utcStamp(input.endsAt)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates,
    details: input.details,
    location: "Onyx Web Systems consultation",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
