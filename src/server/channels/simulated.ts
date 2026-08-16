import type { ChannelAdapter, OutboundMessage } from "./types";
import { logger } from "@/server/logger";

export function createSimulatedAdapter(key: string): ChannelAdapter {
  return {
    key,
    status: "SIMULATED",
    async send(message: OutboundMessage) {
      logger.info("Simulated outbound message", {
        channel: message.channel,
        to: message.to.slice(-4),
        bodyPreview: message.body.slice(0, 80),
      });
      return { ok: true, simulated: true, providerId: `sim_${Date.now()}` };
    },
  };
}
