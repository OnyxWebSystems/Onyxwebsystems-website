import { MarketingFooter, MarketingHeader } from "@/components/marketing/chrome";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="top" className="marketing-shell min-h-screen bg-white text-black">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
