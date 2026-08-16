import Link from "next/link";
import { OnyxLogo } from "@/components/brand/onyx-logo";

export { MarketingHeader } from "@/components/marketing/site-header";

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <OnyxLogo size={48} />
          <p className="mt-3 max-w-sm text-sm text-[#5c5c5c]">
            Technology partner for operators who want systems that create, connect, and convert.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-[#5c5c5c]">
          <Link href="/services">Services</Link>
          <Link href="/about">About</Link>
          <Link href="/book">Book</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
      <div className="border-t border-black/10 px-6 py-4 text-center text-xs text-[#5c5c5c]">
        © {new Date().getFullYear()} Onyx Web Systems
      </div>
    </footer>
  );
}
