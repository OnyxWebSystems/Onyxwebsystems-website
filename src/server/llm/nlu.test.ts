import { describe, expect, it } from "vitest";
import { fixtureNlu } from "./nlu";

describe("fixtureNlu", () => {
  it("maps hi/hello to greeting", () => {
    expect(fixtureNlu("Hi").intent).toBe("greeting");
    expect(fixtureNlu("hello").intent).toBe("greeting");
    expect(fixtureNlu("Hey!").intent).toBe("greeting");
  });

  it("maps pricing questions to faq before booking", () => {
    const nlu = fixtureNlu("Hi I would like to know your prices for App Development?");
    expect(nlu.intent).toBe("faq");
    expect(nlu.serviceHint).toBe("app-discovery");
  });

  it("does not book on quote alone", () => {
    expect(fixtureNlu("quote").intent).not.toBe("book_appointment");
  });

  it("books when they explicitly ask to book", () => {
    expect(fixtureNlu("Can we book a discovery call for app development?").intent).toBe(
      "book_appointment",
    );
  });
});
