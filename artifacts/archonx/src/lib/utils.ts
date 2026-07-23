import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "Jul 3, 2026 UTC" */
export function formatShortDateUTC(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }) + " UTC";
}

/** "Jul 3, 2026 · 18:45 UTC" */
export function formatDateTimeUTC(date: string | Date): string {
  const d = new Date(date);
  const day  = d.toLocaleDateString("en-US",  { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-US",  { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  return `${day} · ${time} UTC`;
}

/** "5m ago", "2h ago", "3d ago" — all UTC-based, no timezone drift */
export function formatTimeAgoUTC(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (d >= 1)  return `${d}d ago`;
  if (h >= 1)  return `${h}h ago`;
  if (m >= 1)  return `${m}m ago`;
  return "just now";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatNumber(value: number, decimals: number = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

export function formatPercentage(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)         return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatCompactNum(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)         return `${(value / 1_000).toFixed(1)}K`;
  return `${value.toFixed(0)}`;
}

export function formatAddress(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getHealthColor(healthFactor: number) {
  if (healthFactor < 1.0) return "text-destructive border-destructive";
  if (healthFactor <= 1.25) return "text-warning border-warning";
  if (healthFactor <= 1.5) return "text-warning border-warning";
  return "text-safe border-safe";
}
