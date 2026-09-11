import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { parseMetaMessagingEvents, verifyMetaSignature } from "./meta";

describe("verifyMetaSignature", () => {
  it("accepts a valid X-Hub-Signature-256", () => {
    const secret = "app_secret";
    const body = '{"object":"instagram"}';
    const digest = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(verifyMetaSignature(body, `sha256=${digest}`, secret)).toBe(true);
    expect(verifyMetaSignature(body, "sha256=deadbeef", secret)).toBe(false);
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
  });
});

describe("parseMetaMessagingEvents", () => {
  it("maps Instagram DMs and ignores echoes", () => {
    const events = parseMetaMessagingEvents({
      object: "instagram",
      entry: [
        {
          messaging: [
            {
              sender: { id: "IGSID_1" },
              message: { mid: "mid.echo", text: "from page", is_echo: true },
            },
            {
              sender: { id: "IGSID_2" },
              message: { mid: "mid.real", text: "Need a website" },
            },
          ],
        },
      ],
    });
    expect(events).toEqual([
      { channel: "instagram", senderId: "IGSID_2", text: "Need a website", mid: "mid.real" },
    ]);
  });

  it("maps Facebook Messenger on the same payload shape", () => {
    const events = parseMetaMessagingEvents({
      object: "page",
      entry: [
        {
          messaging: [
            {
              sender: { id: "PSID_1" },
              message: { mid: "m.1", text: "Hello" },
            },
          ],
        },
      ],
    });
    expect(events[0]).toMatchObject({ channel: "facebook", senderId: "PSID_1", mid: "m.1" });
  });
});
