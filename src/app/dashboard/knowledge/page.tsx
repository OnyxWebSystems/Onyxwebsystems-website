import { prisma } from "@/server/db";
import { getDemoOrganization } from "@/server/demo/runner";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function KnowledgePage() {
  const org = await getDemoOrganization();
  const articles = await prisma.knowledgeArticle.findMany({
    where: { organizationId: org.id },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Approved answers only"
        title="Knowledge base"
        description="The front desk answers from these articles. If information is missing, it escalates instead of inventing."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((a) => (
          <article key={a.id} className="cx-card p-5">
            <div className="cx-label">{a.category}</div>
            <h2 className="mt-1 text-lg font-semibold">{a.title}</h2>
            <p className="mt-3 text-sm text-[var(--ink-muted)] whitespace-pre-wrap">{a.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
