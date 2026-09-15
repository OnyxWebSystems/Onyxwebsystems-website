import { describe, expect, it } from "vitest";
import { nextBestAction } from "./next-action";

describe("nextBestAction", () => {
  it("blocks outreach when do-not-contact is set", () => {
    expect(nextBestAction({ status: "QUALIFIED", doNotContact: true })).toMatch(/Do not contact/);
  });

  it("asks for research before anything else", () => {
    expect(
      nextBestAction({
        status: "DISCOVERED",
        doNotContact: false,
        lastResearchedAt: null,
        description: null,
      }),
    ).toBe("Research company");
  });

  it("requires approval before sending", () => {
    expect(
      nextBestAction({
        status: "AWAITING_APPROVAL",
        doNotContact: false,
        lastResearchedAt: new Date(),
        description: "Known",
        primaryContactName: "Jordan",
        whyGoodFit: "Fit",
        pendingOutreachStatus: "AWAITING_APPROVAL",
      }),
    ).toBe("Review AI message");
  });
});
