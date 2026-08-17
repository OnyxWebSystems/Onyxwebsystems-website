import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./services.module.css";

type Variant = "solid" | "ghost";

const variantClass: Record<Variant, string> = {
  solid: "ox-btn-solid border border-black",
  ghost: "border border-black bg-transparent transition-colors hover:bg-[#0a0a0a] hover:text-white",
};

export function ServicesLink({
  href,
  children,
  variant = "ghost",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(styles.cta, "inline-flex items-center px-6 py-3 text-sm font-medium", variantClass[variant], className)}>
      <span>{children}</span>
      <span className={styles.arrow} aria-hidden>
        →
      </span>
    </Link>
  );
}

export function ServicesButton({
  children,
  variant = "ghost",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={props.type ?? "button"}
      className={cn(styles.cta, "inline-flex items-center px-6 py-3 text-sm font-medium disabled:opacity-50", variantClass[variant], className)}
      {...props}
    >
      <span>{children}</span>
      <span className={styles.arrow} aria-hidden>
        →
      </span>
    </button>
  );
}
