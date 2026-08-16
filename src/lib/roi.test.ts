import { describe, expect, it } from "vitest";

function estimateMonthlyRecoveredValue(input: {
  callsPerDay: number;
  missedCallPct: number;
  recoveryRate: number;
  conversionRate: number;
  avgCustomerValue: number;
}) {
  const missed = input.callsPerDay * 22 * (input.missedCallPct / 100);
  const recovered = missed * (input.recoveryRate / 100);
  return recovered * (input.conversionRate / 100) * input.avgCustomerValue;
}

describe("ROI estimate math", () => {
  it("computes a positive recovered value for typical HVAC inputs", () => {
    const value = estimateMonthlyRecoveredValue({
      callsPerDay: 60,
      missedCallPct: 30,
      recoveryRate: 35,
      conversionRate: 40,
      avgCustomerValue: 700,
    });
    expect(value).toBeGreaterThan(1000);
  });
});
