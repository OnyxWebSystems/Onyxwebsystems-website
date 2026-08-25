import { betterAuth } from "better-auth";
import { APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "@/server/db";
import { isDashboardOperator } from "@/server/auth/operators";
import { brandedEmailHtml, brandedEmailText } from "@/server/email/brand";
import { sendBrandedEmail } from "@/server/email/resend";

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
    disableSignUp: true,
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
  plugins: [
    twoFactor({
      issuer: "Onyx Web Systems",
      skipVerificationOnEnable: true,
      otpOptions: {
        period: 10,
        async sendOTP({ user, otp }) {
          await sendBrandedEmail({
            to: user.email,
            subject: "Your Onyx dashboard sign-in code",
            html: brandedEmailHtml({
              eyebrow: "Dashboard sign-in",
              heading: "Your verification code",
              intro: "Use this code to finish signing in to the Onyx Web Systems dashboard.",
              fields: [{ label: "Code", value: otp }],
              closing: "If you did not try to sign in, you can ignore this email.",
            }),
            text: brandedEmailText({
              heading: "Your verification code",
              intro: `Your code is ${otp}. If you did not try to sign in, ignore this email.`,
            }),
          });
        },
      },
    }),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      if (!isDashboardOperator(email)) {
        throw new APIError("UNAUTHORIZED", { message: "Invalid email or password" });
      }
    }),
  },
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: dashboardUrl,
});

export type Session = typeof auth.$Infer.Session;
