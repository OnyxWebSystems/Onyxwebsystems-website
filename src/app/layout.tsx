import type { Metadata } from "next";
import { Bungee, Bungee_Outline, Plus_Jakarta_Sans, Syne } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: "400",
});

const bungeeOutline = Bungee_Outline({
  variable: "--font-outline",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "onyxwebsystems",
    template: "%s · onyxwebsystems",
  },
  description:
    "Onyx Web Systems — Business Operating Systems, App Development, and Web Development. CREATE. CONNECT. CONVERT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${syne.variable} ${bungee.variable} ${bungeeOutline.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-[family-name:var(--font-plus-jakarta)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
