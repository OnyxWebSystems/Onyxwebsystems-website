import { prisma } from "@/server/db";

export type KbMatch = {
  articleId: string;
  title: string;
  content: string;
  score: number;
};

/**
 * Knowledge answers must come from approved articles only.
 * No invention — empty result means escalate.
 */
export function knowledgeTokens(query: string): string[] {
  const raw = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
  const extra: string[] = [];
  for (const token of raw) {
    if (token.endsWith("s") && token.length > 3) extra.push(token.slice(0, -1));
    if (token.endsWith("ing") && token.length > 5) extra.push(token.slice(0, -3));
  }
  return [...new Set([...raw, ...extra])];
}

export async function searchKnowledge(organizationId: string, query: string): Promise<KbMatch[]> {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { organizationId, isApproved: true },
  });

  const tokens = knowledgeTokens(query);

  const scored = articles
    .map((article) => {
      const keywords = article.keywords.map((k) => k.toLowerCase());
      const hay = `${article.title} ${article.content} ${keywords.join(" ")}`.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (hay.includes(token)) score += 1;
        if (keywords.some((k) => k === token || k.includes(token) || token.includes(k))) score += 2;
      }
      if (article.title.toLowerCase().includes(query.toLowerCase())) score += 3;
      return {
        articleId: article.id,
        title: article.title,
        content: article.content,
        score,
      };
    })
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3);
}

export function formatKbAnswer(match: KbMatch | undefined): string | null {
  if (!match || match.score < 2) return null;
  return match.content;
}

export const ESCALATE_UNKNOWN =
  "I don't want to give you incorrect information. Let me connect you with someone who can help.";
