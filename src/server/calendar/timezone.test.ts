import { describe, expect, it } from "vitest";
import {
  BUSINESS_TIMEZONE,
  calendarDateHasPassed,
  canRescheduleMeeting,
  ymdInZone,
  zonedLocalToUtc,
} from "./timezone";

describe("timezone conversion", () => {
  it("converts 09:00 SAST to 07:00 UTC", () => {
    const d = zonedLocalToUtc(2026, 7, 25, 9, 0, BUSINESS_TIMEZONE);
    expect(d.toISOString()).toBe("2026-08-25T07:00:00.000Z");
  });

  it("formats calendar dates in SAST", () => {
    expect(ymdInZone(new Date("2026-08-25T07:00:00.000Z"), BUSINESS_TIMEZONE)).toBe("2026-08-25");
  });

  it("blocks reschedule on the meeting day in SAST", () => {
    const meeting = new Date("2026-08-25T13:00:00.000Z");
    const morning = new Date("2026-08-25T06:00:00.000Z");
    const dayBefore = new Date("2026-08-24T10:00:00.000Z");
    expect(canRescheduleMeeting(meeting, BUSINESS_TIMEZONE, morning)).toBe(false);
    expect(calendarDateHasPassed(meeting, BUSINESS_TIMEZONE, morning)).toBe(true);
    expect(canRescheduleMeeting(meeting, BUSINESS_TIMEZONE, dayBefore)).toBe(true);
  });
});
