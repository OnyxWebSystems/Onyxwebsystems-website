import { describe, expect, it } from "vitest";
import { composeSocialReply, withBookingLink } from "./compose-reply";

describe("composeSocialReply", () => {
  it("appends the booking URL and never a numbered SMS menu", async () => {
    const reply = await composeSocialReply({
      draft: "We build Business Operating Systems, apps, and websites.",
      userText: "What do you do?",
      kbSnippets: ["Onyx Web Systems is a technology partner."],
      history: [],
    });
    expect(reply).toMatch(/\/book/);
    expect(reply).not.toMatch(/1\)/);
    expect(reply.toLowerCase()).not.toContain("as an ai");
  });
});

describe("withBookingLink", () => {
  it("does not duplicate an existing booking URL", () => {
    const url = "https://onyxwebsystems.com/book";
    expect(withBookingLink(`See ${url}`, url)).toBe(`See ${url}`);
  });
});
