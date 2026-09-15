import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { DiscoverForm } from "@/components/dashboard/partners/discover-form";

export default function DiscoverPartnersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        label="Partner Engine"
        title="Find partners"
        description="Add a company you already know. Research runs from the website URL you provide — this is not a mass-discovery scraper."
        actions={
          <Link href="/dashboard/partners" className="ox-btn-ghost px-4 py-2.5 text-sm font-semibold">
            Back to overview
          </Link>
        }
      />
      <DiscoverForm />
    </div>
  );
}
