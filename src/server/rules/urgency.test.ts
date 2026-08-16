import { describe, expect, it } from "vitest";
import { classifyUrgency } from "./urgency";

describe("classifyUrgency", () => {
  it("escalates security incidents as CRITICAL with script", () => {
    const result = classifyUrgency({ text: "I think we have a security breach on staging" });
    expect(result.level).toBe("CRITICAL");
    expect(result.requiresEscalation).toBe(true);
    expect(result.safetyScript).toBeTruthy();
  });

  it("escalates complaint / manager request as HIGH", () => {
    const result = classifyUrgency({
      text: "This is unacceptable. I want a manager and a refund.",
    });
    expect(result.level).toBe("HIGH");
    expect(result.requiresEscalation).toBe(true);
  });

  it("treats hours questions as LOW", () => {
    const result = classifyUrgency({ text: "What are your business hours?" });
    expect(result.level).toBe("LOW");
  });
});
