import { describe, expect, it } from "vitest";
import { routeRequest } from "./routing";

describe("routeRequest", () => {
  it("routes critical to emergency", () => {
    expect(routeRequest({ intent: "book_appointment", urgency: "CRITICAL" }).departmentSlug).toBe(
      "emergency",
    );
  });

  it("routes complaints to management", () => {
    expect(routeRequest({ intent: "complaint", urgency: "HIGH" }).departmentSlug).toBe("management");
  });

  it("routes booking to scheduling", () => {
    expect(routeRequest({ intent: "book_appointment", urgency: "NORMAL", isExistingCustomer: true }).departmentSlug).toBe(
      "scheduling",
    );
  });

  it("routes greetings to support", () => {
    expect(routeRequest({ intent: "greeting", urgency: "LOW" }).departmentSlug).toBe("support");
  });
});
