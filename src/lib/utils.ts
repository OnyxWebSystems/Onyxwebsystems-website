import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatPhone(phone?: string | null) {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function customerName(c: { firstName: string; lastName: string }) {
  return `${c.firstName} ${c.lastName}`;
}

export function maskPii(value: string) {
  if (value.includes("@")) {
    const [user, domain] = value.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 4) return `***-***-${digits.slice(-4)}`;
  return "***";
}
