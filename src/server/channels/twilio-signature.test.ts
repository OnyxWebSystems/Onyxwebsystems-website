import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { detectTwilioChannel, stripWhatsappPrefix, verifyTwilioSignature } from "./twilio-signature";

describe("twilio signature helpers", () => {
  it("detects whatsapp vs sms", () => {
    expect(detectTwilioChannel("whatsapp:+15551234567")).toBe("whatsapp");
    expect(detectTwilioChannel("+15551234567")).toBe("sms");
  });

  it("strips whatsapp prefix", () => {
    expect(stripWhatsappPrefix("whatsapp:+15551234567")).toBe("+15551234567");
  });

  it("verifies a valid signature", () => {
    const authToken = "test_token";
    const url = "https://example.com/api/webhooks/twilio";
    const params = { Body: "hello", From: "+15551234567" };
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key as keyof typeof params], "");
    const signature = createHmac("sha1", authToken)
      .update(url + sorted, "utf8")
      .digest("base64");

    expect(verifyTwilioSignature({ authToken, signature, url, params })).toBe(true);
    expect(verifyTwilioSignature({ authToken, signature: "bad", url, params })).toBe(false);
  });
});
