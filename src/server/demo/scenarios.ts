export type DemoBeat = {
  delayMs: number;
  action: "inbound" | "activity";
  payload: Record<string, unknown>;
};

export type DemoScenarioDef = {
  key: string;
  name: string;
  description: string;
  beats: DemoBeat[];
};

export const DEMO_SCENARIOS: DemoScenarioDef[] = [
  {
    key: "scenario_1_new_customer_call",
    name: "New Prospect Calls",
    description: "New prospect books a consultation over phone.",
    beats: [
      {
        delayMs: 0,
        action: "inbound",
        payload: {
          channel: "phone",
          from: "+16025550101",
          customerName: "Jordan Blake",
          text: "Hi, I'm exploring a Business Operating System for our front desk and lead follow-up. Can I book a consultation this week?",
          simulateAfterHours: false,
        },
      },
    ],
  },
  {
    key: "scenario_2_existing_customer",
    name: "Existing Client",
    description: "Returning client recognized from history.",
    beats: [
      {
        delayMs: 0,
        action: "inbound",
        payload: {
          channel: "phone",
          from: "+16025551001",
          text: "Hey, it's Maya again. We want to expand into Reporting & Analytics modules. Can someone walk us through options?",
        },
      },
    ],
  },
  {
    key: "scenario_3_whatsapp",
    name: "WhatsApp Enquiry",
    description: "WhatsApp consultation request.",
    beats: [
      {
        delayMs: 0,
        action: "inbound",
        payload: {
          channel: "whatsapp",
          from: "+16025551002",
          customerName: "Chris Nguyen",
          text: "Hi — interested in App Development similar to what you did for SEC Nightlife. Can we book a discovery call?",
        },
      },
    ],
  },
  {
    key: "scenario_4_missed_call",
    name: "Missed Call Recovery",
    description: "Missed call triggers follow-up and lead capture.",
    beats: [
      {
        delayMs: 0,
        action: "inbound",
        payload: {
          channel: "phone",
          from: "+16025550111",
          customerName: "Sam Ortiz",
          text: "Missed call — need a custom website quote and consultation ASAP",
          isMissedCall: true,
        },
      },
    ],
  },
  {
    key: "scenario_5_urgent",
    name: "Security Escalation",
    description: "Security concern escalates immediately.",
    beats: [
      {
        delayMs: 0,
        action: "inbound",
        payload: {
          channel: "phone",
          from: "+16025551003",
          text: "I think we have unauthorized access on our staging site. Can you escalate this?",
        },
      },
    ],
  },
  {
    key: "scenario_6_complaint",
    name: "Client Complaint",
    description: "Angry client creates priority escalated ticket.",
    beats: [
      {
        delayMs: 0,
        action: "inbound",
        payload: {
          channel: "email",
          email: "maya.patel@example.com",
          from: "+16025551001",
          subject: "Unacceptable delay",
          text: "This is unacceptable. Nobody called me back about the proposal. I want a manager.",
        },
      },
    ],
  },
  {
    key: "scenario_7_reschedule",
    name: "Rescheduling",
    description: "Existing client moves a consultation.",
    beats: [
      {
        delayMs: 0,
        action: "inbound",
        payload: {
          channel: "whatsapp",
          from: "+16025551001",
          text: "Can I reschedule my consultation to a different time?",
        },
      },
    ],
  },
  {
    key: "scenario_8_after_hours",
    name: "After-Hours Call",
    description: "After-hours consultation booking.",
    beats: [
      {
        delayMs: 0,
        action: "inbound",
        payload: {
          channel: "phone",
          from: "+16025550122",
          customerName: "Riley Quinn",
          text: "Calling after hours — our site went down and we need to talk about a Business Operating System for support and follow-ups. Can you book someone?",
          simulateAfterHours: true,
        },
      },
    ],
  },
];
