import { MarketingFooter, MarketingHeader } from "@/components/marketing/chrome";
import { MobileScrollAnimations } from "@/components/marketing/mobile-scroll";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="top" className="marketing-shell min-h-screen bg-white text-black">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
      <MobileScrollAnimations />
    </div>
  );
}
