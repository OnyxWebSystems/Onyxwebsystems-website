import { describe, expect, it } from "vitest";
import type { VoiceToolCall } from "./tools";

function paramsOf(call: VoiceToolCall): Record<string, unknown> {
  if (call.parameters && typeof call.parameters === "object") return call.parameters;
  if (typeof call.arguments === "string") {
    try {
      return JSON.parse(call.arguments) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (call.arguments && typeof call.arguments === "object") return call.arguments;
  return {};
}

describe("voice tool param parsing", () => {
  it("parses JSON string arguments", () => {
    const call: VoiceToolCall = {
      name: "lookup_customer",
      arguments: JSON.stringify({ phone: "+16025551212" }),
    };
    expect(paramsOf(call).phone).toBe("+16025551212");
  });

  it("uses parameters object when present", () => {
    const call: VoiceToolCall = {
      name: "check_availability",
      parameters: { serviceSlug: "consultation", days: 3 },
    };
    expect(paramsOf(call).serviceSlug).toBe("consultation");
  });
});
