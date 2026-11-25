import { addDays, fromIso, toIso } from "@/lib/format"
import type { RecurrenceFrequency } from "@/types"

const units: Record<RecurrenceFrequency, string> = {
  weekly: "minggu",
  monthly: "bulan",
  yearly: "tahun",
}

export const frequencyLabels: Record<RecurrenceFrequency, string> = {
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
}

/** "Setiap bulan", "Setiap 2 minggu", ... */
export function recurrenceLabel(frequency: RecurrenceFrequency, interval: number): string {
  return interval > 1 ? `Setiap ${interval} ${units[frequency]}` : `Setiap ${units[frequency]}`
}

export function frequencyUnit(frequency: RecurrenceFrequency): string {
  return units[frequency]
}

/**
 * `iso` moved forward by `interval` weeks/months/years. Like Postgres date
 * arithmetic (used by the database), a day that doesn't exist in the target
 * month is clamped to its last day: 31 Jan + 1 month = 28/29 Feb.
 */
export function addRecurrence(iso: string, frequency: RecurrenceFrequency, interval: number): string {
  if (frequency === "weekly") return addDays(iso, 7 * interval)
  const d = fromIso(iso)
  const months = frequency === "monthly" ? interval : 12 * interval
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay))
  return toIso(target)
}

/** Mirror of the database's next_recurrence_date: the first start + k·step strictly after `after`. */
export function nextRecurrenceDate(
  start: string,
  frequency: RecurrenceFrequency,
  interval: number,
  after: string
): string {
  let d = start
  for (let k = 1; d <= after; k++) d = addRecurrence(start, frequency, k * interval)
  return d
}
