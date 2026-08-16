export type ChannelStatus = "SIMULATED" | "CONNECTED" | "READY_FOR_INTEGRATION";

export type OutboundMessage = {
  to: string;
  body: string;
  channel: "sms" | "whatsapp" | "email";
  /** Override From (WhatsApp inbound should use the number that received the message). */
  from?: string;
};

export interface ChannelAdapter {
  key: string;
  status: ChannelStatus;
  send(message: OutboundMessage): Promise<{ ok: boolean; simulated: boolean; providerId?: string }>;
}
