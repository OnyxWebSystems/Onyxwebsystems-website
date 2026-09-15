import { describe, expect, it } from "vitest";
import { normalizeCompanyName, normalizeWebsiteDomain } from "./normalize";
import { fallbackOutreach } from "./outreach";

describe("duplicate helpers", () => {
  it("treats www and protocol variants as the same domain", () => {
    expect(normalizeWebsiteDomain("https://www.abc.co.za/about")).toBe("abc.co.za");
    expect(normalizeWebsiteDomain("http://abc.co.za")).toBe("abc.co.za");
    expect(normalizeWebsiteDomain("abc.co.za")).toBe("abc.co.za");
  });

  it("normalizes company legal suffixes", () => {
    expect(normalizeCompanyName("ABC Advisory Pty Ltd")).toBe("abc advisory");
    expect(normalizeCompanyName("ABC Advisory")).toBe("abc advisory");
  });
});

describe("fallbackOutreach", () => {
  it("does not use generic greetings or invent a person", () => {
    const draft = fallbackOutreach({
      companyName: "Example Advisory",
      category: "Business Consultants",
      partnershipAngle: "You handle strategy; Onyx handles implementation.",
    });
    expect(draft.message).not.toMatch(/Dear Sir\/Madam/i);
    expect(draft.message).not.toMatch(/Hope this email finds you well/i);
    expect(draft.message).toContain("Example Advisory");
    expect(draft.message).toContain("https://onyxwebsystems.co.za/");
    expect(draft.message.toLowerCase()).toContain("will not follow up");
  });
});
