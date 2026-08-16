"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { OnyxNavBrand } from "@/components/brand/onyx-nav-brand";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 12);
      setProgress(max > 0 ? Math.min(y / max, 1) : 0);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/") return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <header
      className="ox-site-header sticky top-0 z-40"
      data-scrolled={scrolled ? "true" : "false"}
      style={{ ["--ox-scroll" as string]: progress }}
    >
      <div className="ox-site-header-inner relative flex w-full items-center justify-between pl-3 pr-6">
        <Link
          href="/"
          className="ox-brand-link relative z-10"
          aria-label="onyxwebsystems home"
          onClick={goHome}
        >
          <OnyxNavBrand />
        </Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 text-sm md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="ox-nav-link">
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <Link href="/book" className="ox-btn-nav relative z-10 hidden px-4 py-2 text-sm font-medium md:inline-flex">
          <span>Book a Consultation</span>
          <span className="ox-btn-nav-arrow" aria-hidden="true">
            →
          </span>
        </Link>
        <Link href="/book" className="relative z-10 border border-black px-3 py-1.5 text-xs font-medium md:hidden">
          Book
        </Link>
      </div>
      <div className="ox-scroll-progress" />
    </header>
  );
}
