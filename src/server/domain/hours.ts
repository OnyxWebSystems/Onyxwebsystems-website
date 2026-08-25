import { BUSINESS_TIMEZONE, toZonedParts, parseHm } from "@/lib/timezones";

type DayHours = { open: string; close: string } | null;

export function isBusinessOpen(
  businessHours: Record<string, DayHours>,
  at: Date = new Date(),
  timeZone = BUSINESS_TIMEZONE,
): boolean {
  const parts = toZonedParts(at, timeZone);
  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const day = dayNames[parts.dow];
  const hours = businessHours[day];
  if (!hours) return false;

  const open = parseHm(hours.open);
  const close = parseHm(hours.close);
  const mins = parts.hours * 60 + parts.minutes;
  const openMins = open.h * 60 + open.m;
  const closeMins = close.h * 60 + close.m;
  return mins >= openMins && mins < closeMins;
}
