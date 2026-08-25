export const BUSINESS_TIMEZONE = "Africa/Johannesburg";

export const COMMON_TIMEZONES = [
  "Africa/Johannesburg",
  "Africa/Harare",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
] as const;

export type ZonedParts = {
  y: number;
  m: number;
  d: number;
  hours: number;
  minutes: number;
  seconds: number;
  dow: number;
};

export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveDisplayTimeZone(timeZone?: string | null) {
  return isValidTimeZone(timeZone) ? timeZone : BUSINESS_TIMEZONE;
}

function zonedPartsMap(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

export function toZonedParts(date: Date, timeZone: string): ZonedParts {
  const map = zonedPartsMap(date, timeZone);
  const y = Number(map.year);
  const m = Number(map.month) - 1;
  const d = Number(map.day);
  const hours = Number(map.hour);
  const minutes = Number(map.minute);
  const seconds = Number(map.second);
  const dow = new Date(Date.UTC(y, m, d)).getUTCDay();
  return { y, m, d, hours, minutes, seconds, dow };
}

function offsetMsAt(date: Date, timeZone: string) {
  const map = zonedPartsMap(date, timeZone);
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - date.getTime();
}

/** Convert a wall-clock time in `timeZone` to a UTC Date. `m` is 0-indexed. */
export function zonedLocalToUtc(
  y: number,
  m: number,
  d: number,
  hours: number,
  minutes: number,
  timeZone: string,
) {
  const utcGuess = Date.UTC(y, m, d, hours, minutes, 0);
  const offset1 = offsetMsAt(new Date(utcGuess), timeZone);
  let instant = utcGuess - offset1;
  const offset2 = offsetMsAt(new Date(instant), timeZone);
  if (offset2 !== offset1) instant = utcGuess - offset2;
  return new Date(instant);
}

export function ymdInZone(date: Date, timeZone: string) {
  const p = toZonedParts(date, timeZone);
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function isSameCalendarDay(a: Date, b: Date, timeZone: string) {
  return ymdInZone(a, timeZone) === ymdInZone(b, timeZone);
}

export function calendarDateHasPassed(startsAt: Date, timeZone = BUSINESS_TIMEZONE, now = new Date()) {
  return ymdInZone(startsAt, timeZone) <= ymdInZone(now, timeZone);
}

export function canRescheduleMeeting(startsAt: Date, timeZone = BUSINESS_TIMEZONE, now = new Date()) {
  return ymdInZone(startsAt, timeZone) > ymdInZone(now, timeZone);
}

export function formatInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
) {
  return date.toLocaleString("en-ZA", { timeZone, ...options });
}

export function formatTimeInZone(date: Date, timeZone: string) {
  return date.toLocaleTimeString("en-ZA", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timezoneLabel(timeZone: string) {
  return timeZone.replace(/_/g, " ");
}

export function parseHm(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}
