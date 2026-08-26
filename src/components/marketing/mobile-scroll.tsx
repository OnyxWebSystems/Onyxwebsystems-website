"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = [
  ".marketing-shell main section > div",
  ".marketing-shell main article",
  ".marketing-shell .ox-service-card",
  ".marketing-shell form > *",
  ".marketing-shell footer > div",
].join(",");

const MOTIONS = ["clip", "left", "rise", "right", "scale"] as const;

function isMobileScroll() {
  return (
    window.matchMedia("(max-width: 1023px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function inView(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.88 && rect.bottom > 64;
}

function skip(el: HTMLElement) {
  if (el.closest(".ox-mobile-nav")) return true;
  if (el.querySelector("[data-ox-reveal], .ox-reveal")) return true;
  const style = getComputedStyle(el);
  if (style.pointerEvents === "none") return true;
  if (style.position === "absolute" || style.position === "fixed") return true;
  return false;
}

export function MobileScrollAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;

    const teardown = () => {
      observer?.disconnect();
      observer = null;
      document.documentElement.classList.remove("ox-mscroll");
      document.querySelectorAll<HTMLElement>(".ox-scroll-anim").forEach((el) => {
        el.classList.remove("ox-scroll-anim");
        delete el.dataset.in;
        delete el.dataset.oxMotion;
        el.style.removeProperty("--ox-scroll-delay");
      });
    };

    const setup = () => {
      teardown();
      if (!isMobileScroll()) return;

      const raw = [...document.querySelectorAll<HTMLElement>(SELECTOR)].filter((el) => !skip(el));
      const nodes = raw.filter((el) => !raw.some((other) => other !== el && el.contains(other)));

      nodes.forEach((el, index) => {
        el.classList.add("ox-scroll-anim");
        el.dataset.oxMotion = MOTIONS[index % MOTIONS.length];
        el.style.setProperty("--ox-scroll-delay", `${Math.min((index % 4) * 90, 270)}ms`);
        if (inView(el)) el.dataset.in = "true";
      });

      document.documentElement.classList.add("ox-mscroll");

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            el.dataset.in = "true";
            observer?.unobserve(el);
          }
        },
        { threshold: 0, rootMargin: "80px 0px -8% 0px" },
      );

      nodes.forEach((el) => {
        if (el.dataset.in === "true") return;
        observer?.observe(el);
      });
    };

    const frame = window.requestAnimationFrame(setup);
    const later = window.setTimeout(setup, 80);
    mobile.addEventListener("change", setup);
    reduce.addEventListener("change", setup);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(later);
      mobile.removeEventListener("change", setup);
      reduce.removeEventListener("change", setup);
      teardown();
    };
  }, [pathname]);

  return null;
}
