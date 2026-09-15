export function normalizeWebsiteDomain(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const raw = url.trim();
  try {
    const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
    const host = new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    const host = raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      ?.replace(/:\d+$/, "");
    return host || null;
  }
}

export function normalizeCompanyName(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(pty|ltd|inc|llc|limited|co|company|group)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
