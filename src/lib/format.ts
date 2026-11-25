const numberFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 })

/** 1500000 → "1.500.000" */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** 1500000 → "Rp 1.500.000", -25000 → "-Rp 25.000" */
export function formatRupiah(value: number): string {
  const sign = value < 0 ? "-" : ""
  return `${sign}Rp ${numberFormat.format(Math.abs(value))}`
}

/** "1.500.000" / "Rp 1.500.000" → 1500000. Keeps digits only. */
export function parseNumber(text: string): number {
  const digits = text.replace(/\D/g, "")
  return digits ? Number.parseInt(digits, 10) : 0
}

const TIMEZONE = "Asia/Jakarta"

/** "2026-11-24" → "24 November 2026" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fromIso(iso))
}

/** "2026-11-24" → "Selasa, 24 November 2026" */
export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fromIso(iso))
}

/** "2026-11-24" → "24 Nov" */
export function formatShortDate(iso: string, withYear = false): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(fromIso(iso))
}

/** Date-only values (YYYY-MM-DD) are treated as UTC midnight so they never shift. */
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Today's date in the WIB timezone, "YYYY-MM-DD". */
export function todayWib(): string {
  // en-CA produces the YYYY-MM-DD format
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = fromIso(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toIso(d)
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / 86_400_000)
}

/** "Hari ini", "Besok", "3 hari lagi", "Terlambat 2 hari" — relative to today (WIB). */
export function dueLabel(iso: string): string {
  const days = daysBetween(todayWib(), iso)
  if (days === 0) return "Hari ini"
  if (days === 1) return "Besok"
  if (days > 1) return `${days} hari lagi`
  return `Terlambat ${-days} hari`
}
