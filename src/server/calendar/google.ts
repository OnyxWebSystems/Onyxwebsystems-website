import { prisma } from "@/server/db";
import { logger } from "@/server/logger";
import { BRAND_REPLY_TO, BRAND_TIMEZONE } from "@/server/email/brand";

type GoogleEventInput = {
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  attendeeEmail?: string;
  attendeeName?: string;
};

async function googleAccessToken() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      logger.error("Google OAuth refresh failed", { status: res.status, body: await res.text() });
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (error) {
    logger.error("Google OAuth refresh failed", { error: String(error) });
    return null;
  }
}

async function googleFetch(path: string, accessToken: string, init?: RequestInit) {
  return fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export function isGoogleCalendarConfigured() {
  return Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
      process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  );
}

export async function ensureOnyxCalendar(accessToken: string, organizationId?: string) {
  if (process.env.GOOGLE_CALENDAR_ID) return process.env.GOOGLE_CALENDAR_ID;

  if (organizationId) {
    try {
      const row = await prisma.integration.findFirst({
        where: { organizationId, key: "google_calendar" },
      });
      const stored = (row?.config as { calendarId?: string } | null)?.calendarId;
      if (stored) return stored;
    } catch (error) {
      logger.warn("Google calendar lookup skipped", { error: String(error) });
    }
  }

  const created = await googleFetch("/calendars", accessToken, {
    method: "POST",
    body: JSON.stringify({
      summary: "Onyx Web Systems",
      description:
        "Consultations and project meetings for Onyx Web Systems. Black-and-white operating calendar for booked work.",
      timeZone: BRAND_TIMEZONE,
    }),
  });
  if (!created.ok) {
    logger.error("Google calendar create failed", { status: created.status, body: await created.text() });
    return "primary";
  }
  const calendar = (await created.json()) as { id?: string };
  const calendarId = calendar.id ?? "primary";

  await googleFetch(`/users/me/calendarList/${encodeURIComponent(calendarId)}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({
      colorId: "8",
      backgroundColor: "#0a0a0a",
      foregroundColor: "#ffffff",
      defaultReminders: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 30 },
      ],
    }),
  }).catch((error) => logger.warn("Google calendar theme patch failed", { error: String(error) }));

  if (organizationId) {
    try {
      await prisma.integration.upsert({
        where: { organizationId_key: { organizationId, key: "google_calendar" } },
        update: {
          status: "CONNECTED",
          description: "Onyx Web Systems Google Calendar",
          config: { calendarId },
        },
        create: {
          organizationId,
          key: "google_calendar",
          name: "Google Calendar",
          status: "CONNECTED",
          description: "Onyx Web Systems Google Calendar",
          config: { calendarId },
        },
      });
    } catch (error) {
      logger.warn("Google calendar id was not stored", { error: String(error) });
    }
  }

  logger.info("Onyx Google Calendar ready", { calendarId });
  return calendarId;
}

export async function createOnyxCalendarEvent(input: GoogleEventInput & { organizationId?: string }) {
  if (!isGoogleCalendarConfigured()) {
    logger.info("Google Calendar not configured — event not synced");
    return { ok: false, simulated: true as const };
  }

  const accessToken = await googleAccessToken();
  if (!accessToken) return { ok: false, simulated: true as const };

  const calendarId = await ensureOnyxCalendar(accessToken, input.organizationId);
  const notify = process.env.ONYX_NOTIFY_EMAIL || BRAND_REPLY_TO;
  const attendees = [
    notify ? { email: notify, displayName: "Onyx Web Systems" } : null,
    input.attendeeEmail
      ? { email: input.attendeeEmail, displayName: input.attendeeName || input.attendeeEmail }
      : null,
  ].filter(Boolean);

  const res = await googleFetch(`/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      summary: input.title,
      description: input.description,
      location: "Onyx Web Systems consultation",
      start: { dateTime: input.startsAt.toISOString(), timeZone: BRAND_TIMEZONE },
      end: { dateTime: input.endsAt.toISOString(), timeZone: BRAND_TIMEZONE },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 30 },
        ],
      },
      colorId: "8",
    }),
  });

  if (!res.ok) {
    logger.error("Google Calendar event create failed", { status: res.status, body: await res.text() });
    return { ok: false, simulated: false as const };
  }

  const event = (await res.json()) as { id?: string; htmlLink?: string };
  logger.info("Google Calendar event created", { id: event.id, calendarId });
  return { ok: true, simulated: false as const, eventId: event.id, htmlLink: event.htmlLink };
}

async function calendarsForBusyCheck(accessToken: string) {
  const ids = new Set<string>(["primary"]);
  if (process.env.GOOGLE_CALENDAR_ID) ids.add(process.env.GOOGLE_CALENDAR_ID);
  try {
    const res = await googleFetch("/users/me/calendarList?maxResults=50", accessToken);
    if (res.ok) {
      const data = (await res.json()) as { items?: { id?: string; summary?: string }[] };
      for (const item of data.items ?? []) {
        if (item.id && item.summary === "Onyx Web Systems") ids.add(item.id);
      }
    }
  } catch (error) {
    logger.warn("Google calendar list failed", { error: String(error) });
  }
  return [...ids];
}

export async function listGoogleBusyIntervals(from: Date, to: Date) {
  if (!isGoogleCalendarConfigured()) return [];
  try {
    const accessToken = await googleAccessToken();
    if (!accessToken) return [];

    const items = (await calendarsForBusyCheck(accessToken)).map((id) => ({ id }));
    const res = await googleFetch("/freeBusy", accessToken, {
      method: "POST",
      body: JSON.stringify({
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        timeZone: BRAND_TIMEZONE,
        items,
      }),
    });
    if (!res.ok) {
      logger.error("Google freeBusy failed", { status: res.status, body: await res.text() });
      return [];
    }

    const data = (await res.json()) as {
      calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
    };
    const busy: { start: Date; end: Date }[] = [];
    for (const calendar of Object.values(data.calendars ?? {})) {
      for (const block of calendar.busy ?? []) {
        busy.push({ start: new Date(block.start), end: new Date(block.end) });
      }
    }
    return busy;
  } catch (error) {
    logger.error("Google freeBusy failed", { error: String(error) });
    return [];
  }
}

export function intervalsOverlap(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
) {
  return a.start < b.end && a.end > b.start;
}

export async function isGoogleSlotFree(startsAt: Date, endsAt: Date) {
  const busy = await listGoogleBusyIntervals(startsAt, endsAt);
  return !busy.some((block) => intervalsOverlap({ start: startsAt, end: endsAt }, block));
}
