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
