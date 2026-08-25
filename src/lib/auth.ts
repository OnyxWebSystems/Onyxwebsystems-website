import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/server/db";

const dashboardUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_DASHBOARD_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const trustedOrigins = [
  dashboardUrl,
  process.env.NEXT_PUBLIC_DASHBOARD_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.PUBLIC_APP_URL,
  "https://dashboard.onyxwebsystems.co.za",
  "https://onyxwebsystems.co.za",
  "https://www.onyxwebsystems.co.za",
  "http://localhost:3000",
].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "agent",
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: dashboardUrl,
});

export type Session = typeof auth.$Infer.Session;
