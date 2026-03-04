import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number as Turkish locale currency string */
export function formatCurrency(
  value: number,
  currency: "TRY" | "USDT" | "USD" = "TRY",
  compact = false
): string {
  if (currency === "TRY") {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (currency === "USDT" || currency === "USD") {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "USD",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return String(value);
}

/** Format large numbers with compact notation (e.g. 1.2M) */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format percentage change with + or - sign */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Returns "text-success" or "text-danger" based on sign */
export function priceChangeColor(value: number | null | undefined): string {
  if (value == null) return "text-text-secondary";
  return value >= 0 ? "text-success" : "text-danger";
}

/** Turkish locale date formatting */
export function formatDate(date: Date | string, includeTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}
