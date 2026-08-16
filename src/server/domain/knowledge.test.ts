import { describe, expect, it } from "vitest";
import { knowledgeTokens } from "./knowledge";

describe("knowledgeTokens", () => {
  it("stems prices so it matches price keywords", () => {
    expect(knowledgeTokens("prices for App Development")).toEqual(
      expect.arrayContaining(["prices", "price", "app", "development"]),
    );
  });
});
