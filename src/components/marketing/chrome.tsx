import Link from "next/link";
import { OnyxLogo } from "@/components/brand/onyx-logo";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="onyxwebsystems home">
          <OnyxLogo size={48} />
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-[#5c5c5c] transition-colors hover:text-black">
              {item.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="ox-btn-solid px-4 py-2 text-sm font-medium"
          >
            Book a Consultation
          </Link>
        </nav>
        <Link href="/book" className="border border-black px-3 py-1.5 text-xs font-medium md:hidden">
          Book
        </Link>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-black/10 bg-white">
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
