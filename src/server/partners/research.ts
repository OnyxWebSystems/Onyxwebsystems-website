import { z } from "zod";

export const UNKNOWN = "Unknown";
export const NOT_FOUND = "Not found";

export const ResearchFindingsSchema = z.object({
  companyDescription: z.string().default(UNKNOWN),
  services: z.string().default(UNKNOWN),
  industriesServed: z.string().default(UNKNOWN),
  targetCustomers: z.string().default(UNKNOWN),
  companySize: z.string().default(UNKNOWN),
  locations: z.string().default(UNKNOWN),
  leadership: z.string().default(UNKNOWN),
  decisionMakers: z.string().default(UNKNOWN),
  technologyServices: z.string().default(UNKNOWN),
  existingSoftware: z.string().default(UNKNOWN),
  potentialCompetitors: z.string().default(UNKNOWN),
  partnershipOpportunities: z.string().default(UNKNOWN),
  onyxServiceOpportunities: z.string().default(UNKNOWN),
});

export type ResearchFindings = z.infer<typeof ResearchFindingsSchema>;

export const emptyResearchFindings = (): ResearchFindings => ({
  companyDescription: UNKNOWN,
  services: UNKNOWN,
  industriesServed: UNKNOWN,
  targetCustomers: UNKNOWN,
  companySize: UNKNOWN,
  locations: UNKNOWN,
  leadership: UNKNOWN,
  decisionMakers: UNKNOWN,
  technologyServices: UNKNOWN,
  existingSoftware: UNKNOWN,
  potentialCompetitors: UNKNOWN,
  partnershipOpportunities: UNKNOWN,
  onyxServiceOpportunities: UNKNOWN,
});

const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIp(ip: string) {
  if (PRIVATE_HOSTS.has(ip)) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  const match = ip.match(/^172\.(\d+)\./);
  if (match) {
    const n = Number(match[1]);
    if (n >= 16 && n <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  return false;
}

async function assertPublicHttpUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http and https URLs can be researched");
  }
  const hostname = url.hostname.toLowerCase();
  if (PRIVATE_HOSTS.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("That URL cannot be fetched");
  }
  if (isPrivateIp(hostname)) throw new Error("That URL cannot be fetched");

  const dns = await import("node:dns/promises");
  const lookedUp = await dns.lookup(hostname, { all: true });
  if (lookedUp.some((row) => isPrivateIp(row.address))) {
    throw new Error("That URL cannot be fetched");
  }
  return url;
}

function pathAllowedByRobots(robotsText: string, pathname: string, userAgent: string) {
  const lines = robotsText.split(/\r?\n/).map((line) => line.trim());
  let applies = false;
  const disallows: string[] = [];
  const allows: string[] = [];
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      applies = value === "*" || userAgent.toLowerCase().includes(value.toLowerCase());
    } else if (applies && key === "disallow") {
      disallows.push(value);
    } else if (applies && key === "allow") {
      allows.push(value);
    }
  }
  const blocked = disallows.some((rule) => rule && pathname.startsWith(rule));
  const allowed = allows.some((rule) => rule && pathname.startsWith(rule));
  if (blocked && !allowed) return false;
  return true;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, names: string[]) {
  for (const name of names) {
    const regex = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const match = html.match(regex);
    if (match?.[1]) return match[1].trim();
    const regex2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
      "i",
    );
    const match2 = html.match(regex2);
    if (match2?.[1]) return match2[1].trim();
  }
  return null;
}

function titleOf(html: string) {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
}

function firstEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (!match) return null;
  if (/noreply|no-reply|donotreply/i.test(match[0])) return null;
  return match[0];
}

function linkedinUrl(html: string) {
  const match = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_-]+/i);
  return match?.[0] ?? null;
}

function contactPage(html: string, origin: string) {
  const match = html.match(/href=["']([^"']*(?:contact|get-in-touch)[^"']*)["']/i);
  if (!match?.[1]) return null;
  try {
    return new URL(match[1], origin).toString();
  } catch {
    return null;
  }
}

const UA = "OnyxWebSystems-PartnerResearch/1.0";

export type ResearchResult = {
  findings: ResearchFindings;
  sources: { sourceName: string; sourceUrl: string; sourceType: string; snippet?: string }[];
  extracted: {
    title?: string | null;
    description?: string | null;
    contactEmail?: string | null;
    linkedinUrl?: string | null;
    contactPageUrl?: string | null;
    textExcerpt: string;
  };
};

export async function fetchPublicCompanyPage(website: string): Promise<ResearchResult> {
  const url = await assertPublicHttpUrl(website.includes("://") ? website : `https://${website}`);
  const robotsUrl = new URL("/robots.txt", url.origin);
  let robotsAllowed = true;
  const sources: ResearchResult["sources"] = [];

  try {
    const robotsRes = await fetch(robotsUrl, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (robotsRes.ok) {
      const robotsText = await robotsRes.text();
      robotsAllowed = pathAllowedByRobots(robotsText, url.pathname || "/", UA);
      sources.push({
        sourceName: "robots.txt",
        sourceUrl: robotsUrl.toString(),
        sourceType: "robots",
        snippet: robotsAllowed ? "Path allowed" : "Path disallowed",
      });
    }
  } catch {
    // Missing robots.txt is treated as allowed for a publicly linked homepage.
  }

  if (!robotsAllowed) {
    return {
      findings: emptyResearchFindings(),
      sources,
      extracted: { textExcerpt: "" },
    };
  }

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    signal: AbortSignal.timeout(10000),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error("The company website could not be retrieved");
  }
  const html = (await res.text()).slice(0, 500_000);
  const text = stripHtml(html).slice(0, 12_000);
  const title = titleOf(html);
  const description = metaContent(html, ["description", "og:description"]);
  const findings = emptyResearchFindings();
  findings.companyDescription = description || title || UNKNOWN;
  if (text && findings.companyDescription === UNKNOWN) {
    findings.companyDescription = text.slice(0, 280);
  }

  sources.push({
    sourceName: "Company website",
    sourceUrl: url.toString(),
    sourceType: "website",
    snippet: (description || title || text).slice(0, 240) || NOT_FOUND,
  });

  return {
    findings,
    sources,
    extracted: {
      title,
      description,
      contactEmail: firstEmail(html) ?? firstEmail(text),
      linkedinUrl: linkedinUrl(html),
      contactPageUrl: contactPage(html, url.origin),
      textExcerpt: text,
    },
  };
}
