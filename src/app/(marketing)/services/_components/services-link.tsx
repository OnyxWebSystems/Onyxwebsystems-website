import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./services.module.css";

type Variant = "solid" | "ghost";

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
    <Link
      href={href}
      className={cn(styles.cta, variant === "solid" ? styles.ctaSolid : styles.ctaGhost, className)}
    >
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
      className={cn(styles.cta, variant === "solid" ? styles.ctaSolid : styles.ctaGhost, className)}
      {...props}
    >
      <span>{children}</span>
      <span className={styles.arrow} aria-hidden>
        →
      </span>
    </button>
  );
}
