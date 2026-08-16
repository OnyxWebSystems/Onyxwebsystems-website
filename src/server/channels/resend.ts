import type { ChannelAdapter, OutboundMessage } from "./types";
import { logger } from "@/server/logger";
import { createSimulatedAdapter } from "./simulated";

export function createResendAdapter(): ChannelAdapter {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      ...createSimulatedAdapter("resend"),
      key: "resend",
      status: "READY_FOR_INTEGRATION",
    };
  }

  return {
    key: "resend",
    status: "CONNECTED",
    async send(message: OutboundMessage) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? "noreply@apexclimatesolutions.example",
          to: [message.to],
          subject: "Onyx Web Systems",
          text: message.body,
        }),
      });
      if (!res.ok) {
        logger.error("Resend send failed", { status: res.status });
        throw new Error("Resend send failed");
      }
      const data = (await res.json()) as { id?: string };
      return { ok: true, simulated: false, providerId: data.id };
    },
  };
}
