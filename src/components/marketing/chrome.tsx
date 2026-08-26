import Link from "next/link";
import { OnyxLogo } from "@/components/brand/onyx-logo";

export { MarketingHeader } from "@/components/marketing/site-header";

const SOCIALS = [
  {
    name: "Instagram",
    handle: "@onyxwebsystems",
    href: "https://www.instagram.com/onyxwebsystems?igsh=MWZpM3pkYzdlMHZreQ%3D%3D&utm_source=qr",
    icon: InstagramIcon,
  },
  {
    name: "TikTok",
    handle: "@OnyxWebSystems",
    href: "http://www.tiktok.com/@onyxwebsystems",
    icon: TikTokIcon,
  },
  {
    name: "Facebook",
    handle: "@Onyxwebsystems",
    href: "https://www.facebook.com/share/192zqKynwi/?mibextid=wwXIfr",
    icon: FacebookIcon,
  },
] as const;

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="currentColor">
      <path d="M14.2 3c.4 2.6 1.8 4.4 4.3 4.7v2.6c-1.5 0-2.9-.5-4.2-1.4v6.6c0 3.4-2.6 6-6.1 6.1-3.4 0-6.2-2.8-6.2-6.2S5.8 9.6 9.2 9.6c.4 0 .8 0 1.2.1v2.7c-.4-.1-.8-.2-1.2-.2-1.9 0-3.4 1.5-3.4 3.4s1.5 3.5 3.4 3.5 3.3-1.5 3.3-3.4V3h1.7Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="currentColor">
      <path d="M14 8.2h2.8V5H14c-2.6 0-4.7 2.1-4.7 4.7V12H6.5v3.2h2.8V22h3.3v-6.8h3l.7-3.2h-3.7V9.7c0-.8.7-1.5 1.4-1.5Z" />
    </svg>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <OnyxLogo size={48} />
          <p className="mt-3 max-w-sm text-sm text-[#5c5c5c]">
            Technology partner for operators who want systems that create, connect, and convert.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex min-h-11 items-center gap-2 text-sm"
                    aria-label={`${social.name} ${social.handle}`}
                  >
                    <span className="inline-flex items-center gap-2 text-[#5c5c5c] transition-colors group-hover:text-black">
                      <Icon />
                      {social.handle}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#5c5c5c]">
          <Link href="/services" className="inline-flex min-h-11 items-center">
            Services
          </Link>
          <Link href="/about" className="inline-flex min-h-11 items-center">
            About
          </Link>
          <Link href="/book" className="inline-flex min-h-11 items-center">
            Book
          </Link>
          <Link href="/privacy" className="inline-flex min-h-11 items-center">
            Privacy
          </Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center">
            Terms
          </Link>
        </div>
      </div>
      <div className="border-t border-black/10 px-6 py-4 text-center text-xs text-[#5c5c5c]">
        © {new Date().getFullYear()} Onyx Web Systems
      </div>
    </footer>
  );
}
