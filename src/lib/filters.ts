import { endOfDay, startOfDay, subDays } from "date-fns";

export type ListFilterInput = {
  range?: string | null;
  from?: string | null;
  to?: string | null;
  channel?: string | null;
  status?: string | null;
  q?: string | null;
};

export function resolveDateRange(input: ListFilterInput): { gte?: Date; lte?: Date } {
  const range = input.range ?? "30";
  if (range === "today") {
    const now = new Date();
    return { gte: startOfDay(now), lte: endOfDay(now) };
  }
  if (range === "custom") {
    const gte = input.from ? startOfDay(new Date(input.from)) : undefined;
    const lte = input.to ? endOfDay(new Date(input.to)) : undefined;
    return { gte, lte };
  }
  const days = range === "7" || range === "90" ? Number(range) : 30;
  return { gte: subDays(new Date(), days) };
}

export function parseListFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): ListFilterInput {
  const get = (key: string) => {
    if (sp instanceof URLSearchParams) return sp.get(key);
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    range: get("range"),
    from: get("from"),
    to: get("to"),
    channel: get("channel"),
    status: get("status"),
    q: get("q"),
  };
}
