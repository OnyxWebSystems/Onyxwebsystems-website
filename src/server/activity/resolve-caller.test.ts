import { describe, expect, it } from "vitest";
import { isPlaceholderPhone, parseSpokenName, threadGroupKey } from "./resolve-caller";

describe("parseSpokenName", () => {
  it("reads a first and last name from a transcript", () => {
    expect(parseSpokenName("Hi, my name is Sihle Simelane")).toEqual({
      firstName: "Sihle",
      lastName: "Simelane",
    });
  });

  it("ignores greetings that are not names", () => {
    expect(parseSpokenName("Hello this is calling about a booking")).toBeNull();
  });
});

describe("threadGroupKey", () => {
  it("groups by customer first", () => {
    expect(
      threadGroupKey({
        customerId: "cust_1",
        channel: "phone",
        fromNumber: "+15555550100",
      }),
    ).toBe("cust_1");
  });

  it("collapses placeholder and missing phone orphans into one thread", () => {
    expect(
      threadGroupKey({
        customerId: null,
        channel: "phone",
        fromNumber: "+15555550100",
      }),
    ).toBe("anon:phone");
    expect(
      threadGroupKey({
        customerId: null,
        channel: "phone",
        fromNumber: null,
      }),
    ).toBe("anon:phone");
  });

  it("groups real unmatched numbers together", () => {
    expect(
      threadGroupKey({
        customerId: null,
        channel: "phone",
        fromNumber: "+27820746046",
      }),
    ).toBe("phone:7820746046");
  });
});

describe("isPlaceholderPhone", () => {
  it("treats Retell test numbers as placeholders", () => {
    expect(isPlaceholderPhone("+15555550100")).toBe(true);
    expect(isPlaceholderPhone("+10000000000")).toBe(true);
    expect(isPlaceholderPhone("0820746046")).toBe(false);
  });
});
