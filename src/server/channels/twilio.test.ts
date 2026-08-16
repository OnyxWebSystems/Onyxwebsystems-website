import { describe, expect, it } from "vitest";
import { contentVariablesForReply, twilioAddress, variableKeysFromContent } from "./twilio";

describe("twilioAddress", () => {
  it("adds whatsapp prefix without doubling it", () => {
    expect(twilioAddress("whatsapp", "+17372212163")).toBe("whatsapp:+17372212163");
    expect(twilioAddress("whatsapp", "whatsapp:+17372212163")).toBe("whatsapp:+17372212163");
  });

  it("adds a plus if missing", () => {
    expect(twilioAddress("whatsapp", "17372212163")).toBe("whatsapp:+17372212163");
  });
});

describe("WhatsApp content variables", () => {
  it("reads numbered placeholders from the template body", () => {
    expect(
      variableKeysFromContent({
        types: { "twilio/text": { body: "Hi {{1}}, your {{2}} is {{3}}" } },
      }),
    ).toEqual(["1", "2", "3"]);
  });

  it("puts the reply in variable 1", () => {
    expect(contentVariablesForReply(["1", "2", "3"], "Hi there")).toMatchObject({
      "1": "Hi there",
      "2": "a consultation",
      "3": "this week",
    });
  });
});
