import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { addDays, addHours, subDays, subHours } from "date-fns";

const prisma = new PrismaClient();

const BUSINESS_HOURS = {
  mon: { open: "09:00", close: "17:00" },
  tue: { open: "09:00", close: "17:00" },
  wed: { open: "09:00", close: "17:00" },
  thu: { open: "09:00", close: "17:00" },
  fri: { open: "09:00", close: "17:00" },
  sat: null,
  sun: null,
};

async function main() {
  console.log("Seeding Onyx Web Systems demo...");

  await prisma.activityEvent.deleteMany();
  await prisma.demoRun.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.callSession.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customerIdentity.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.urgencyRule.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.availabilityOverride.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.service.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.demoScenario.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const nathyPassword = process.env.DASHBOARD_OPERATOR_NATHY_PASSWORD;
  const bhumbaPassword = process.env.DASHBOARD_OPERATOR_BHUMBA_PASSWORD;
  if (!nathyPassword || !bhumbaPassword) {
    throw new Error("Set DASHBOARD_OPERATOR_NATHY_PASSWORD and DASHBOARD_OPERATOR_BHUMBA_PASSWORD to seed operator logins.");
  }

  const nathy = await prisma.user.create({
    data: {
      name: "Nathy Simelane",
      email: "nathysimelanei@gmail.com",
      emailVerified: true,
      role: "owner",
      twoFactorEnabled: true,
      accounts: {
        create: {
          accountId: "nathysimelanei@gmail.com",
          providerId: "credential",
          password: await hashPassword(nathyPassword),
        },
      },
      twoFactor: {
        create: {
          secret: "seed-nathy-totp",
          backupCodes: "[]",
          verified: true,
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      name: "Bhumba Simelane",
      email: "bhumbasimelane@gmail.com",
      emailVerified: true,
      role: "manager",
      twoFactorEnabled: true,
      accounts: {
        create: {
          accountId: "bhumbasimelane@gmail.com",
          providerId: "credential",
          password: await hashPassword(bhumbaPassword),
        },
      },
      twoFactor: {
        create: {
          secret: "seed-bhumba-totp",
          backupCodes: "[]",
          verified: true,
        },
      },
    },
  });
  const user = nathy;

  const org = await prisma.organization.create({
    data: {
      name: "Onyx Web Systems",
      slug: "onyx-web-systems",
      tagline: "CREATE. CONNECT. CONVERT.",
      phone: process.env.RETELL_PHONE_NUMBER ?? "+10000000000",
      email: "onyxwebsystems@gmail.com",
      website: "https://onyxwebsystems.com",
      whatsapp: process.env.TWILIO_WHATSAPP_FROM ?? "+10000000000",
      timezone: "Africa/Johannesburg",
      businessHours: BUSINESS_HOURS,
    },
  });

  const deptData = [
    { name: "Sales", slug: "sales", description: "New business and proposals" },
    { name: "Scheduling", slug: "scheduling", description: "Consultations and delivery scheduling" },
    { name: "Customer Support", slug: "support", description: "Client support and onboarding help" },
    { name: "Billing", slug: "billing", description: "Invoices and payment questions" },
    { name: "Emergency / Escalation", slug: "emergency", description: "Critical escalations" },
    { name: "Management", slug: "management", description: "Owner / partner escalations" },
  ];
  const departments = await Promise.all(
    deptData.map((d) => prisma.department.create({ data: { ...d, organizationId: org.id } })),
  );
  const bySlug = Object.fromEntries(departments.map((d) => [d.slug, d]));

  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        organizationId: org.id,
        departmentId: bySlug.management.id,
        userId: user.id,
        name: "Sihle Ndlovu",
        email: "sihle@onyxwebsystems.com",
        phone: "+10000000001",
        role: "manager",
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: org.id,
        departmentId: bySlug.sales.id,
        name: "Alex Rivera",
        email: "alex@onyxwebsystems.com",
        role: "consultant",
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: org.id,
        departmentId: bySlug.scheduling.id,
        name: "Taylor Brooks",
        email: "taylor@onyxwebsystems.com",
        role: "consultant",
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: org.id,
        departmentId: bySlug.sales.id,
        name: "Jordan Kim",
        email: "jordan@onyxwebsystems.com",
        role: "sales",
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: org.id,
        departmentId: bySlug.support.id,
        name: "Morgan Lee",
        email: "morgan@onyxwebsystems.com",
        phone: "+10000000002",
        role: "scheduler",
        isOnCall: true,
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: org.id,
        departmentId: bySlug.billing.id,
        name: "Riley Adams",
        email: "riley@onyxwebsystems.com",
        role: "billing",
      },
    }),
  ]);

  for (const consultant of employees.filter((e) =>
    ["consultant", "sales", "scheduler", "manager"].includes(e.role),
  )) {
    for (const day of [1, 2, 3, 4, 5]) {
      await prisma.availabilityRule.create({
        data: {
          employeeId: consultant.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
        },
      });
    }
  }

  const services = await Promise.all(
    [
      {
        name: "Consultation",
        slug: "consultation",
        category: "consult",
        durationMin: 30,
        bufferMin: 15,
        travelBufferMin: 0,
        basePriceCents: null as number | null,
        isEmergencyEligible: false,
        description: "Discovery consultation for BOS, App, or Web engagements.",
      },
      {
        name: "BOS Discovery Workshop",
        slug: "bos-workshop",
        category: "consult",
        durationMin: 90,
        bufferMin: 30,
        travelBufferMin: 0,
        basePriceCents: null,
        description: "Module scoping workshop for Business Operating Systems.",
      },
      {
        name: "App Discovery Call",
        slug: "app-discovery",
        category: "consult",
        durationMin: 45,
        bufferMin: 15,
        travelBufferMin: 0,
        basePriceCents: null,
        description: "Product discovery for custom web/mobile apps.",
      },
      {
        name: "Web Project Kickoff",
        slug: "web-kickoff",
        category: "consult",
        durationMin: 45,
        bufferMin: 15,
        travelBufferMin: 0,
        basePriceCents: null,
        description: "Website / landing / dashboard project kickoff.",
      },
    ].map((s) =>
      prisma.service.create({
        data: {
          organizationId: org.id,
          name: s.name,
          slug: s.slug,
          category: s.category,
          durationMin: s.durationMin,
          bufferMin: s.bufferMin,
          travelBufferMin: s.travelBufferMin,
          basePriceCents: s.basePriceCents ?? undefined,
          isEmergencyEligible: s.isEmergencyEligible ?? false,
          description: s.description,
        },
      }),
    ),
  );

  await prisma.serviceArea.createMany({
    data: [
      { organizationId: org.id, name: "Remote / Global", postalCodes: ["*"] },
      { organizationId: org.id, name: "Phoenix Metro", postalCodes: ["85001", "85016", "85018", "85251"] },
    ],
  });

  const firstNames = [
    "Maya",
    "Chris",
    "Sam",
    "Avery",
    "Quinn",
    "Blake",
    "Drew",
    "Jamie",
    "Cameron",
    "Reese",
    "Skyler",
    "Harper",
    "Rowan",
    "Parker",
    "Finley",
    "Emerson",
    "Hayden",
    "Logan",
    "Morgan",
    "Taylor",
    "Jordan",
    "Riley",
  ];
  const lastNames = [
    "Patel",
    "Nguyen",
    "Ortiz",
    "Chen",
    "Brooks",
    "Garcia",
    "Shah",
    "Kim",
    "Lopez",
    "Wright",
    "Diaz",
    "Murphy",
    "Bailey",
    "Reed",
    "Cook",
    "Bell",
    "Ward",
    "Price",
    "Ross",
    "Gray",
    "Blake",
    "Quinn",
  ];
  const companies = [
    "Northline Retail",
    "Harbor Clinics",
    "Summit Logistics",
    "Velvet Venues",
    "Cascade Fitness",
    "BrightPath Schools",
  ];

  const customers = [];
  for (let i = 0; i < 22; i++) {
    const phone = `+1602555${String(1000 + i).padStart(4, "0")}`;
    const custEmail = `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@example.com`;
    const customer = await prisma.customer.create({
      data: {
        organizationId: org.id,
        firstName: firstNames[i],
        lastName: lastNames[i],
        email: custEmail,
        phone,
        addressLine1: i % 2 === 0 ? undefined : `${1000 + i * 17} N Central Ave`,
        city: i % 2 === 0 ? undefined : "Phoenix",
        state: i % 2 === 0 ? undefined : "AZ",
        postalCode: i % 2 === 0 ? undefined : "85016",
        customerType: i < 14 ? "commercial" : "lead",
        notes: `${companies[i % companies.length]} · Prefers ${i % 2 === 0 ? "WhatsApp" : "email"}`,
        preferences: { channel: i % 2 === 0 ? "whatsapp" : "email", reminders: true },
        identities: {
          create: [
            { channel: "phone", value: phone.replace(/\D/g, ""), isPrimary: true },
            { channel: "email", value: custEmail },
            { channel: "whatsapp", value: phone.replace(/\D/g, "") },
          ],
        },
      },
    });
    customers.push(customer);
  }

  const kb = [
    {
      category: "company",
      title: "About Onyx Web Systems",
      slug: "about",
      keywords: ["about", "company", "onyx"],
      content:
        "Onyx Web Systems is a technology partner building Business Operating Systems, custom applications, and premium web experiences. Tagline: CREATE. CONNECT. CONVERT.",
    },
    {
      category: "services",
      title: "Services Offered",
      slug: "services",
      keywords: ["services", "bos", "app", "apps", "web", "app development", "web development"],
      content:
        "Three pillars: 1) Business Operating Systems — modular interconnected systems for front desk, leads, sales, marketing, ops, support, analytics, follow-ups, and custom workflows. 2) App Development — custom web/mobile apps. 3) Web Development — premium sites, landing pages, booking, dashboards, integrations.",
    },
    {
      category: "modules",
      title: "BOS Modules",
      slug: "bos-modules",
      keywords: ["modules", "customer experience", "crm", "front desk"],
      content:
        "Modules can include: Customer Experience / Front Desk, Lead Management & Speed-to-Lead, Sales & CRM, Marketing, Operations, Customer Support, Internal Comms, Reporting & Analytics, Follow-Ups, Document/Data Processing, Custom Agents/Workflows, or a custom module scoped per client.",
    },
    {
      category: "hours",
      title: "Business Hours",
      slug: "hours",
      keywords: ["hours", "open", "closed"],
      content:
        "Consultations are typically scheduled Monday–Friday 9:00 AM–5:00 PM (Africa/Johannesburg). The digital front desk answers after hours, captures leads, and books the next available consultation.",
    },
    {
      category: "consultation",
      title: "Consultation Policy",
      slug: "consultation-policy",
      keywords: ["consultation", "book", "meeting", "call"],
      content:
        "Standard consultations are 30 minutes. Bring goals, current tools, and which BOS modules or service lines you are exploring. A confirmation email is sent after booking.",
    },
    {
      category: "pricing",
      title: "Pricing Philosophy",
      slug: "pricing",
      keywords: [
        "price",
        "pricing",
        "prices",
        "cost",
        "quote",
        "fee",
        "fees",
        "app development",
        "web development",
        "bos",
      ],
      content:
        "Custom Solutions. Custom Pricing. We do not publish fixed fees for App Development, Web Development, or Business Operating Systems. Scope is defined per engagement, then a custom quote is provided. Never invent dollar amounts.",
    },
    {
      category: "portfolio",
      title: "SEC Nightlife Portfolio",
      slug: "sec-nightlife",
      keywords: ["portfolio", "sec", "nightlife", "app"],
      content:
        "App Development portfolio highlight: SEC Nightlife (secnightlife.com) — nightlife operations and guest experience platform for a multi-venue nightlife brand.",
    },
    {
      category: "escalation",
      title: "Escalation Policy",
      slug: "escalation",
      keywords: ["escalate", "manager", "human", "complaint"],
      content:
        "Angry clients, legal threats, payment disputes, security incidents, low-confidence answers, and any explicit request to speak with a human are escalated to the appropriate department with a full conversation summary.",
    },
    {
      category: "security",
      title: "Security Incidents",
      slug: "security",
      keywords: ["security", "breach", "hack", "data"],
      content:
        "Suspected security incidents, unauthorized access, or data concerns are escalated immediately to Management. Do not speculate on root cause on the call.",
    },
    {
      category: "contact",
      title: "Contact Details",
      slug: "contact",
      keywords: ["phone", "email", "whatsapp", "contact", "call", "front desk"],
      content:
        "Primary email: onyxwebsystems@gmail.com. Ask to call the front desk and we will share the live number when it is configured. WhatsApp and SMS reach the same front desk thread.",
    },
  ];
  for (const article of kb) {
    await prisma.knowledgeArticle.create({ data: { ...article, organizationId: org.id, isApproved: true } });
  }

  await prisma.urgencyRule.createMany({
    data: [
      {
        organizationId: org.id,
        name: "Security incident",
        level: "CRITICAL",
        keywords: ["security", "breach", "hacked", "unauthorized access"],
        requiresEscalation: true,
        priority: 1,
        safetyScript: "We are escalating this to management immediately. Please preserve any evidence and avoid sharing credentials over chat.",
      },
      {
        organizationId: org.id,
        name: "Legal / payment dispute",
        level: "HIGH",
        keywords: ["lawsuit", "lawyer", "refund", "dispute", "chargeback"],
        requiresEscalation: true,
        priority: 10,
      },
      {
        organizationId: org.id,
        name: "Speak to human",
        level: "HIGH",
        keywords: ["speak to a person", "manager", "human"],
        requiresEscalation: true,
        priority: 20,
      },
      {
        organizationId: org.id,
        name: "Standard consult",
        level: "NORMAL",
        keywords: ["consultation", "demo", "modules"],
        requiresEscalation: false,
        priority: 50,
      },
      {
        organizationId: org.id,
        name: "Informational",
        level: "LOW",
        keywords: ["hours", "pricing", "portfolio"],
        requiresEscalation: false,
        priority: 80,
      },
    ],
  });

  for (const [slug, dept] of Object.entries(bySlug)) {
    await prisma.routingRule.create({
      data: {
        organizationId: org.id,
        name: `Route ${slug}`,
        priority: 100,
        conditions: { department: slug },
        departmentId: dept.id,
      },
    });
  }

  await prisma.integration.createMany({
    data: [
      {
        organizationId: org.id,
        key: "voice_simulator",
        name: "Voice (Simulator)",
        status: "SIMULATED",
        description: "Loom-safe simulated inbound calls",
      },
      {
        organizationId: org.id,
        key: "voice_retell",
        name: "Voice (Retell)",
        status: "READY_FOR_INTEGRATION",
        description: "Live telephony via Retell AI",
      },
      {
        organizationId: org.id,
        key: "whatsapp",
        name: "WhatsApp",
        status: "SIMULATED",
        description: "Twilio WhatsApp adapter",
      },
      {
        organizationId: org.id,
        key: "sms",
        name: "SMS",
        status: "SIMULATED",
        description: "Twilio SMS adapter",
      },
      {
        organizationId: org.id,
        key: "email",
        name: "Email",
        status: "SIMULATED",
        description: "Resend confirmations",
      },
      {
        organizationId: org.id,
        key: "social",
        name: "Social Inbox",
        status: "SIMULATED",
        description: "Facebook / Instagram simulated until Meta connected",
      },
      {
        organizationId: org.id,
        key: "calendar",
        name: "Internal Calendar",
        status: "CONNECTED",
        description: "Built-in consultation scheduling",
      },
      {
        organizationId: org.id,
        key: "google_calendar",
        name: "Google Calendar",
        status: "READY_FOR_INTEGRATION",
        description: "Future sync",
      },
      {
        organizationId: org.id,
        key: "crm",
        name: "Internal CRM",
        status: "CONNECTED",
        description: "Lightweight customer + pipeline records",
      },
      {
        organizationId: org.id,
        key: "llm",
        name: "Language Understanding",
        status: process.env.OPENAI_API_KEY ? "CONNECTED" : "SIMULATED",
        description: "NLU / summaries",
      },
    ],
  });

  const scenarios = [
    { key: "scenario_1_new_customer_call", name: "New Prospect Calls", description: "Prospect books a consultation." },
    { key: "scenario_2_existing_customer", name: "Existing Client", description: "Returning client recognized." },
    { key: "scenario_3_whatsapp", name: "WhatsApp Enquiry", description: "WhatsApp consultation request." },
    { key: "scenario_4_missed_call", name: "Missed Call Recovery", description: "Missed call follow-up." },
    { key: "scenario_5_urgent", name: "Security Escalation", description: "Security concern escalation." },
    { key: "scenario_6_complaint", name: "Client Complaint", description: "Complaint escalation." },
    { key: "scenario_7_reschedule", name: "Rescheduling", description: "Move consultation." },
    { key: "scenario_8_after_hours", name: "After-Hours Call", description: "After-hours booking." },
  ];
  for (const s of scenarios) {
    await prisma.demoScenario.create({ data: { ...s, beats: [] } });
  }

  const now = new Date();
  const consultants = employees.filter((e) => ["consultant", "sales", "scheduler"].includes(e.role));
  const consultation = services.find((s) => s.slug === "consultation")!;
  const bosWorkshop = services.find((s) => s.slug === "bos-workshop")!;

  for (let i = 0; i < 14; i++) {
    const startsAt = i < 7 ? addDays(addHours(now, 9 + (i % 6)), i) : subDays(addHours(now, 10), i - 6);
    await prisma.appointment.create({
      data: {
        organizationId: org.id,
        customerId: customers[i % customers.length].id,
        serviceId: i % 2 ? bosWorkshop.id : consultation.id,
        employeeId: consultants[i % consultants.length].id,
        startsAt,
        endsAt: addHours(startsAt, i % 2 ? 1.5 : 0.5),
        status: i < 7 ? "confirmed" : "completed",
        notes: i % 2 ? "BOS module scoping" : "Website consultation",
        confirmationSent: true,
      },
    });
  }

  for (let i = 0; i < 12; i++) {
    await prisma.ticket.create({
      data: {
        organizationId: org.id,
        ticketNumber: `ONX-${String(2000 + i).padStart(5, "0")}`,
        customerId: customers[i % customers.length].id,
        departmentId: bySlug.support.id,
        category: i % 4 === 0 ? "complaint" : "service",
        priority: ["CRITICAL", "HIGH", "NORMAL", "LOW"][i % 4],
        status: ["New", "Assigned", "In Progress", "Waiting for Customer", "Escalated", "Resolved", "Closed"][i % 7],
        subject: `Client request ${i + 1}`,
        description: "Populated for Onyx demo dashboard.",
        slaTargetAt: addHours(now, 12),
      },
    });
  }

  const channels = ["phone", "whatsapp", "email", "sms", "facebook", "instagram"] as const;
  const intents = ["consultation", "pricing", "portfolio", "support", "faq", "booking"];
  for (let i = 0; i < 52; i++) {
    const customer = customers[i % customers.length];
    const channel = channels[i % channels.length];
    const startedAt = subHours(now, 60 - i);
    const conversation = await prisma.conversation.create({
      data: {
        organizationId: org.id,
        customerId: customer.id,
        channel,
        status: i % 7 === 0 ? "open" : i % 11 === 0 ? "escalated" : "resolved",
        subject: `${channel} enquiry`,
        summary: "Prospect asked about Business Operating Systems modules and consultation availability.",
        intent: intents[i % intents.length],
        urgency: ["NORMAL", "LOW", "HIGH", "NORMAL"][i % 4],
        startedAt,
        endedAt: addHours(startedAt, 0.2),
        messages: {
          create: [
            {
              direction: "inbound",
              senderType: "customer",
              body: "Can we book a consultation about a Customer Experience module?",
              createdAt: startedAt,
            },
            {
              direction: "outbound",
              senderType: "system",
              body: "Absolutely — we have openings Mon–Fri for 30-minute consultations. I can hold a slot for you.",
              createdAt: addHours(startedAt, 0.02),
            },
          ],
        },
        callSession:
          channel === "phone"
            ? {
                create: {
                  fromNumber: customer.phone ?? undefined,
                  toNumber: org.phone ?? undefined,
                  direction: "inbound",
                  outcome: i % 9 === 0 ? "missed" : "answered",
                  durationSec: 120 + (i % 10) * 30,
                  isSimulated: i % 5 !== 0,
                  startedAt,
                  endedAt: addHours(startedAt, 0.1),
                },
              }
            : undefined,
      },
    });
    await prisma.timelineEvent.create({
      data: {
        customerId: customer.id,
        type: "conversation_started",
        title: `${channel} conversation`,
        channel,
        refType: "conversation",
        refId: conversation.id,
        occurredAt: startedAt,
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    await prisma.lead.create({
      data: {
        organizationId: org.id,
        customerId: customers[i].id,
        serviceId: consultation.id,
        source: channels[i % channels.length],
        stage: ["new", "contacted", "qualified", "quoted", "won", "lost"][i % 6],
        summary: `Interested in ${["BOS", "App Dev", "Web Dev"][i % 3]}`,
        estimatedValueCents: null,
      },
    });
  }

  await prisma.activityEvent.createMany({
    data: [
      {
        organizationId: org.id,
        type: "system",
        title: "Customer Experience online",
        detail: "Onyx digital front desk ready",
        severity: "info",
      },
      {
        organizationId: org.id,
        type: "inbound",
        title: "Incoming call",
        detail: "Answered in 1s",
        severity: "info",
      },
      {
        organizationId: org.id,
        type: "appointment",
        title: "Consultation booked",
        detail: "Maya Patel — BOS discovery",
        severity: "info",
      },
      {
        organizationId: org.id,
        type: "escalation",
        title: "Human escalation",
        detail: "Client requested a person",
        severity: "critical",
      },
    ],
  });

  console.log("Seed complete.");
  console.log(`Login: ${email} / ${password}`);
  console.log(`Organization: ${org.name} (${org.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
