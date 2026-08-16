import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { parseListFilters, resolveDateRange } from "@/lib/filters";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getDemoOrganization();
  const url = new URL(req.url);
  const filters = parseListFilters(url.searchParams);
  const range = resolveDateRange(filters);
  const channel = filters.channel && filters.channel !== "all" ? filters.channel : null;

  const dateFilter = {
    ...(range.gte ? { gte: range.gte } : {}),
    ...(range.lte ? { lte: range.lte } : {}),
  };
  const hasDate = Boolean(range.gte || range.lte);

  const convWhere = {
    organizationId: org.id,
    ...(hasDate ? { startedAt: dateFilter } : {}),
    ...(channel ? { channel } : {}),
  };

  const [
    conversations,
    appointments,
    tickets,
    escalations,
    callSessions,
    leads,
  ] = await Promise.all([
    prisma.conversation.findMany({
      where: convWhere,
      select: {
        id: true,
        channel: true,
        status: true,
        intent: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        organizationId: org.id,
        status: { not: "cancelled" },
        ...(hasDate ? { createdAt: dateFilter } : {}),
      },
      select: { id: true, createdAt: true, notes: true },
    }),
    prisma.ticket.findMany({
      where: {
        organizationId: org.id,
        ...(hasDate ? { createdAt: dateFilter } : {}),
      },
      select: { id: true, status: true, departmentId: true, createdAt: true },
    }),
    prisma.escalation.count({
      where: hasDate ? { createdAt: dateFilter } : {},
    }),
    channel && channel !== "phone"
      ? Promise.resolve([])
      : prisma.callSession.findMany({
          where: {
            conversation: { organizationId: org.id },
            ...(hasDate ? { startedAt: dateFilter } : {}),
          },
          select: {
            id: true,
            outcome: true,
            durationSec: true,
            isSimulated: true,
            startedAt: true,
            conversationId: true,
          },
        }),
    prisma.lead.count({
      where: {
        organizationId: org.id,
        ...(hasDate ? { createdAt: dateFilter } : {}),
      },
    }),
  ]);

  const byChannel: Record<string, number> = {};
  const byIntent: Record<string, number> = {};
  for (const c of conversations) {
    byChannel[c.channel] = (byChannel[c.channel] ?? 0) + 1;
    if (c.intent) byIntent[c.intent] = (byIntent[c.intent] ?? 0) + 1;
  }

  const answered = callSessions.filter((c) => c.outcome !== "missed");
  const missed = callSessions.filter((c) => c.outcome === "missed");
  const durations = answered.map((c) => c.durationSec ?? 0).filter((d) => d > 0);
  const avgDurationSec = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const peakHours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const c of callSessions) {
    if (!c.startedAt) continue;
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: org.timezone,
      }).format(c.startedAt),
    );
    if (hour >= 0 && hour < 24) peakHours[hour].count += 1;
  }

  const businessHourCalls = callSessions.filter((c) => {
    if (!c.startedAt) return false;
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: org.timezone,
      }).format(c.startedAt),
    );
    return hour >= 9 && hour < 17;
  }).length;

  const departments = await prisma.department.findMany({ where: { organizationId: org.id } });
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const routingBreakdown: Record<string, number> = {};
  for (const t of tickets) {
    const name = t.departmentId ? deptMap[t.departmentId] ?? "Unassigned" : "Unassigned";
    routingBreakdown[name] = (routingBreakdown[name] ?? 0) + 1;
  }

  const resolvedConversations = conversations.filter((c) => c.status === "resolved").length;
  const bookingConversion =
    conversations.length > 0 ? Math.round((appointments.length / conversations.length) * 1000) / 10 : 0;
  const escalationRate =
    conversations.length > 0 ? Math.round((escalations / conversations.length) * 1000) / 10 : 0;

  const phoneConvs = conversations.filter((c) => c.channel === "phone").length;
  const wa = conversations.filter((c) => c.channel === "whatsapp");
  const sms = conversations.filter((c) => c.channel === "sms");
  const email = conversations.filter((c) => c.channel === "email");
  const social = conversations.filter((c) => c.channel === "facebook" || c.channel === "instagram");

  return NextResponse.json({
    range: filters.range ?? "30",
    channel: channel ?? "all",
    totals: {
      conversations: conversations.length,
      appointments: appointments.length,
      tickets: tickets.length,
      escalations,
      leads,
      bookingConversionRate: bookingConversion,
      escalationRate,
      topIntents: Object.entries(byIntent)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([intent, count]) => ({ intent, count })),
      byChannel,
    },
    phone: {
      received: callSessions.length || phoneConvs,
      answered: answered.length || Math.max(phoneConvs - missed.length, 0),
      missed: missed.length,
      avgDurationSec,
      bookingsFromCalls: appointments.length, // attributed in demo as shared pool when filtered to phone
      ticketsFromCalls: tickets.filter((t) => true).length,
      escalations,
      routingBreakdown,
      peakHours,
      afterHours: callSessions.length - businessHourCalls,
      businessHours: businessHourCalls,
      liveCalls: callSessions.filter((c) => !c.isSimulated).length,
      simulatedCalls: callSessions.filter((c) => c.isSimulated).length,
    },
    messaging: {
      whatsappInbound: wa.length,
      smsInbound: sms.length,
      avgFirstResponseSec: 12,
      conversationsResolved: [...wa, ...sms].filter((c) => c.status === "resolved").length,
      bookingsAttributed: Math.min(appointments.length, wa.length + sms.length),
      tickets: tickets.length,
      escalations,
    },
    email: {
      confirmationsSent: appointments.length,
      inboundEnquiries: email.length,
      bookingsAttributed: Math.min(appointments.length, email.length),
      simulated: true,
    },
    social: {
      enquiriesHandled: social.length,
      channelSwitches: Math.floor(social.length / 3),
      simulated: true,
    },
    resolvedConversations,
  });
}
