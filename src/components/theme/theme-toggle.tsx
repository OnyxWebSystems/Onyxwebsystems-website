"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--line)] text-[var(--ink-muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  );
}
