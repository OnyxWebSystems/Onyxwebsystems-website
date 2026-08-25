import { createHmac, timingSafeEqual } from "crypto";

export type SchedulePayload = {
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  serviceInterest: "bos" | "app" | "web";
  modules: string[];
  goals?: string | null;
  customerId?: string;
  leadId?: string;
  organizationId?: string;
  exp: number;
};

export type ReschedulePayload = {
  appointmentId: string;
  email: string;
  exp: number;
};

function secret() {
  return process.env.BETTER_AUTH_SECRET || "onyx-schedule-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function signScheduleToken(payload: Omit<SchedulePayload, "exp">) {
  const body: SchedulePayload = {
    ...payload,
    goals: payload.goals ? payload.goals.slice(0, 800) : payload.goals,
    exp: Date.now() + 14 * 24 * 60 * 60 * 1000,
  };
  const json = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return `${json}.${sign(json)}`;
}

export function verifyScheduleToken(token: string): SchedulePayload | null {
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;
  const expected = sign(json);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8")) as SchedulePayload;
    if (!payload.email || !payload.name || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function signRescheduleToken(payload: Omit<ReschedulePayload, "exp">) {
  const body: ReschedulePayload = {
    ...payload,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  const json = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return `${json}.${sign(json)}`;
}

export function verifyRescheduleToken(token: string): ReschedulePayload | null {
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;
  const expected = sign(json);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8")) as ReschedulePayload;
    if (!payload.appointmentId || !payload.email || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
