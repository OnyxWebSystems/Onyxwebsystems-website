"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { OnyxNavBrand } from "@/components/brand/onyx-nav-brand";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (media.matches) setMenuOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const htmlStyle = document.documentElement.style;
    const previous = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
      htmlOverflow: htmlStyle.overflow,
    };
    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    htmlStyle.overflow = "hidden";

    const focusables = () => {
      const items: HTMLElement[] = [];
      if (toggleRef.current) items.push(toggleRef.current);
      menuRef.current?.querySelectorAll<HTMLElement>("a").forEach((el) => items.push(el));
      return items;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      style.overflow = previous.overflow;
      style.position = previous.position;
      style.top = previous.top;
      style.width = previous.width;
      htmlStyle.overflow = previous.htmlOverflow;
      if (window.location.pathname === pathname) {
        window.scrollTo(0, scrollY);
      }
    };
  }, [menuOpen, pathname]);

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    setMenuOpen(false);
    if (pathname !== "/") return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <>
      <header
        className="ox-site-header sticky top-0 z-50"
        data-scrolled={scrolled ? "true" : "false"}
        data-menu={menuOpen ? "true" : "false"}
        style={{ ["--ox-scroll" as string]: progress }}
      >
        <div className="ox-site-header-inner relative z-[60] flex w-full items-center justify-between lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Link
            href="/"
            className="ox-brand-link relative z-10 lg:justify-self-start"
            aria-label="onyxwebsystems home"
            onClick={goHome}
          >
            <OnyxNavBrand />
          </Link>
          <nav className="hidden items-center gap-2 text-sm lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ox-nav-link"
                  data-active={active ? "true" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-end">
            <Link
              href="/book"
              className="ox-btn-nav relative z-10 hidden px-4 py-2 text-sm font-medium lg:inline-flex"
              data-active={pathname === "/book" || pathname.startsWith("/book/") ? "true" : undefined}
            >
              <span>Book a Consultation</span>
              <span className="ox-btn-nav-arrow" aria-hidden="true">
                →
              </span>
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className="ox-menu-toggle lg:hidden"
              data-open={menuOpen ? "true" : "false"}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="ox-menu-toggle-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
        <div className="ox-scroll-progress" />
      </header>
      <div
        ref={menuRef}
        id={menuId}
        className="ox-mobile-nav lg:hidden"
        data-open={menuOpen ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!menuOpen}
      >
        <div className="ox-mobile-nav-inner">
          <nav className="ox-mobile-nav-links" aria-label="Mobile">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ox-mobile-link"
                  data-active={active ? "true" : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/book"
            className="ox-btn-solid ox-mobile-nav-cta px-6 py-3.5 text-sm font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Book a Consultation
          </Link>
        </div>
      </div>
    </>
  );
}
