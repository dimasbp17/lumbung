import { addDays, fromIso, todayWib, toIso } from "@/lib/format"

export interface Period {
  /** "YYYY-MM-DD", inclusive */
  start: string
  /** "YYYY-MM-DD", inclusive */
  end: string
  label: string
}

const monthName = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})
const shortDay = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})
const shortDayWithYear = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

/**
 * Computes the monthly period based on the period start day (1..28).
 * Example: start day 25, today 3 Dec → period 25 Nov – 24 Dec.
 * `offset` = -1 for the previous period, +1 for the next one.
 */
export function getPeriod(
  startDay: number,
  offset = 0,
  reference: string = todayWib()
): Period {
  const day = Math.min(Math.max(Math.trunc(startDay) || 1, 1), 28)
  const ref = fromIso(reference)
  let year = ref.getUTCFullYear()
  let month = ref.getUTCMonth()
  if (ref.getUTCDate() < day) month -= 1
  month += offset

  const start = new Date(Date.UTC(year, month, day))
  year = start.getUTCFullYear()
  month = start.getUTCMonth()
  const end = addDays(toIso(new Date(Date.UTC(year, month + 1, day))), -1)

  const label =
    day === 1
      ? monthName.format(start)
      : `${shortDay.format(start)} – ${shortDayWithYear.format(fromIso(end))}`

  return { start: toIso(start), end, label }
}
