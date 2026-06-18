"use client";

import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function Money({ value, cents = false, className }: { value: number | null | undefined; cents?: boolean; className?: string }) {
  if (value == null) return <span className={className}>—</span>;
  return <span className={className}>{cents ? fmt2.format(value) : fmt.format(value)}</span>;
}

export function CompactMoney({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className={className}>—</span>;
  if (Math.abs(value) >= 1000) {
    return <span className={className}>${(value / 1000).toFixed(1)}k</span>;
  }
  return <span className={className}>${Math.round(value)}</span>;
}

export function CompactNumber({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className={className}>—</span>;
  if (Math.abs(value) >= 1000) {
    return <span className={className}>{(value / 1000).toFixed(1)}k</span>;
  }
  return <span className={className}>{value}</span>;
}

export function Delta({ value, suffix = "%", className }: { value: number; suffix?: string; className?: string }) {
  const up = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", up ? "text-emerald-600" : "text-rose-500", className)}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}
