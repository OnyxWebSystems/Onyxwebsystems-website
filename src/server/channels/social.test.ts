import { describe, expect, it } from "vitest";
import {
  alreadyDelivered,
} from "./inbound-dedupe";
import { isSocialChannel, isThreadChannel, socialAiRepliesEnabled } from "@/server/messaging/front-desk";

describe("social channel helpers", () => {
  it("treats IG/FB/TikTok as thread channels without SMS menus", () => {
    expect(isSocialChannel("instagram")).toBe(true);
    expect(isSocialChannel("facebook")).toBe(true);
    expect(isSocialChannel("tiktok")).toBe(true);
    expect(isSocialChannel("whatsapp")).toBe(false);
    expect(isThreadChannel("instagram")).toBe(true);
    expect(isThreadChannel("whatsapp")).toBe(true);
    expect(isThreadChannel("email")).toBe(false);
  });

  it("treats SOCIAL_AI_REPLIES=false as off", () => {
    const previous = process.env.SOCIAL_AI_REPLIES;
    process.env.SOCIAL_AI_REPLIES = "false";
    expect(socialAiRepliesEnabled()).toBe(false);
    process.env.SOCIAL_AI_REPLIES = "true";
    expect(socialAiRepliesEnabled()).toBe(true);
    if (previous === undefined) delete process.env.SOCIAL_AI_REPLIES;
    else process.env.SOCIAL_AI_REPLIES = previous;
  });
});

describe("inbound dedupe helpers", () => {
  it("treats a real providerId as already delivered", () => {
    expect(alreadyDelivered({ providerId: "mid.123" })).toBe(true);
    expect(alreadyDelivered({ providerId: "sim_abc" })).toBe(false);
    expect(alreadyDelivered({})).toBe(false);
  });
});
