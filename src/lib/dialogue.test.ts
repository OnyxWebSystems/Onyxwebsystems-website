import { describe, expect, it } from "vitest";
import { customerFirstName, parseDialogue, turnsFromMessages } from "./dialogue";

describe("parseDialogue", () => {
  it("splits a Retell transcript into agent and customer turns", () => {
    const turns = parseDialogue(
      "Agent: Hi, thanks for calling Onyx Web Systems.\nUser: Hi, I'd like to book a consultation.\nAgent: Of course.",
    );
    expect(turns).toEqual([
      { role: "agent", text: "Hi, thanks for calling Onyx Web Systems." },
      { role: "customer", text: "Hi, I'd like to book a consultation." },
      { role: "agent", text: "Of course." },
    ]);
  });

  it("drops system noise", () => {
    expect(parseDialogue("Call started")).toEqual([]);
  });
});

describe("turnsFromMessages", () => {
  it("expands a single transcript message", () => {
    const turns = turnsFromMessages([
      { senderType: "system", body: "Call started" },
      {
        senderType: "customer",
        body: "Agent: Hello\nUser: This is Sihle",
      },
    ]);
    expect(turns.map((t) => t.role)).toEqual(["agent", "customer"]);
  });
});

describe("customerFirstName", () => {
  it("uses the first name", () => {
    expect(customerFirstName("Sihle Simelane")).toBe("Sihle");
  });
});
