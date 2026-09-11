import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { parseTikTokMessagingEvents, verifyTikTokSignature } from "./tiktok";

function sign(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
}

describe("verifyTikTokSignature", () => {
  it("accepts TikTok-Signature t=,s= HMAC", () => {
    const secret = "tiktok_secret";
    const timestamp = "1700000000";
    const body = '{"event":"im_receive_msg"}';
    const signature = sign(secret, timestamp, body);
    expect(
      verifyTikTokSignature({
        rawBody: body,
        signatureHeader: `t=${timestamp},s=${signature}`,
        appSecret: secret,
        nowMs: 1700000000 * 1000,
      }),
    ).toBe(true);
    expect(
      verifyTikTokSignature({
        rawBody: body,
        signatureHeader: `t=${timestamp},s=deadbeef`,
        appSecret: secret,
        nowMs: 1700000000 * 1000,
      }),
    ).toBe(false);
  });

  it("rejects stale timestamps", () => {
    const secret = "tiktok_secret";
    const timestamp = "1000";
    const body = "{}";
    const signature = sign(secret, timestamp, body);
    expect(
      verifyTikTokSignature({
        rawBody: body,
        signatureHeader: `t=${timestamp},s=${signature}`,
        appSecret: secret,
        nowMs: Date.now(),
      }),
    ).toBe(false);
  });
});

describe("parseTikTokMessagingEvents", () => {
  it("parses im_receive_msg content JSON and ignores business echoes", () => {
    const inbound = parseTikTokMessagingEvents({
      event: "im_receive_msg",
      content: JSON.stringify({
        unique_identifier: "user_1",
        from: "demo_user",
        from_user: { id: "user_1", role: "personal_account" },
        conversation_id: "conv_1",
        message_id: "msg_1",
        type: "text",
        text: { body: "Need a BOS" },
      }),
    });
    expect(inbound).toEqual([
      {
        senderId: "user_1",
        conversationId: "conv_1",
        messageId: "msg_1",
        text: "Need a BOS",
        customerName: "demo_user",
      },
    ]);

    const echo = parseTikTokMessagingEvents({
      event: "im_receive_msg",
      content: JSON.stringify({
        unique_identifier: "biz",
        from_user: { id: "biz", role: "business_account" },
        conversation_id: "conv_1",
        message_id: "msg_echo",
        type: "text",
        text: { body: "auto reply" },
      }),
    });
    expect(echo).toEqual([]);
  });
});
