import { describe, expect, it } from "vitest";
import { scorePartner } from "./scoring";
import { DEFAULT_SCORING_WEIGHTS } from "./constants";

describe("scorePartner", () => {
  it("scores a complementary South African advisory firm highly", () => {
    const result = scorePartner({
      category: "Business Consultants",
      industry: "Operations advisory",
      description: "Helps established SMEs improve operations and scale",
      companySize: "11-50",
      targetClientDescription: "Established mid-market businesses",
      targetClientSize: "mid-market",
      country: "South Africa",
      city: "Johannesburg",
      website: "https://example-advisory.test",
      primaryContactName: "Jordan Hale",
      primaryContactEmail: "jordan@example-advisory.test",
    });
    expect(result.total).toBeGreaterThanOrEqual(80);
    expect(result.criteria).toHaveLength(8);
    expect(result.criteria.reduce((sum, item) => sum + item.max, 0)).toBe(
      Object.values(DEFAULT_SCORING_WEIGHTS).reduce((a, b) => a + b, 0),
    );
    expect(result.criteria.find((item) => item.key === "competition")?.points).toBe(15);
  });

  it("does not invent a high score when almost nothing is known", () => {
    const result = scorePartner({ companyName: "Unknown Co" } as never);
    expect(result.total).toBeLessThan(70);
    expect(result.criteria.every((item) => item.reason.length > 0)).toBe(true);
  });

  it("reduces the non-compete score when they already build websites", () => {
    const result = scorePartner({
      category: "Marketing Agencies",
      description: "Full-service web development and custom software for startups",
      country: "South Africa",
    });
    const competition = result.criteria.find((item) => item.key === "competition");
    expect(competition?.points).toBeLessThan(8);
    expect(result.competitionRiskScore).toBeGreaterThan(50);
  });
});
