import { describe, expect, it } from "vitest";
import {
  decodePendingBook,
  encodePendingBook,
  isConfirm,
  isPlaceholderName,
  menuChoice,
  nameFromProfile,
  parsePersonName,
} from "./front-desk";

describe("front-desk helpers", () => {
  it("detects placeholder New Customer names", () => {
    expect(isPlaceholderName("New", "Customer")).toBe(true);
    expect(isPlaceholderName("Sihle", "")).toBe(false);
  });

  it("parses a spoken name", () => {
    expect(parsePersonName("My name is Sihle Simelane")).toEqual({
      firstName: "Sihle",
      lastName: "Simelane",
    });
    expect(parsePersonName("hi")).toBeNull();
  });

  it("uses Twilio ProfileName including a single given name", () => {
    expect(nameFromProfile("Sihle")).toEqual({ firstName: "Sihle", lastName: "" });
    expect(nameFromProfile("Sihle Simelane")).toEqual({ firstName: "Sihle", lastName: "Simelane" });
  });

  it("treats yes/1/book it as confirmation", () => {
    expect(isConfirm("yes")).toBe(true);
    expect(isConfirm("book it")).toBe(true);
    expect(isConfirm("1")).toBe(true);
    expect(isConfirm("prices")).toBe(false);
  });

  it("reads numbered menu choices", () => {
    expect(menuChoice("2")).toBe(2);
    expect(menuChoice("3) book")).toBe(3);
    expect(menuChoice("pricing")).toBe(2);
  });

  it("round-trips pending booking slots", () => {
    const encoded = encodePendingBook([
      {
        serviceId: "svc",
        serviceName: "App Discovery Call",
        startsAt: "2026-08-17T16:30:00.000Z",
        employeeId: "emp",
        employeeName: "Alex",
      },
    ]);
    expect(decodePendingBook(encoded)?.[0]?.serviceName).toBe("App Discovery Call");
  });
});
