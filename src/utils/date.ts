/**
 * Returns today's date as YYYY-MM-DD string in local time.
 */
export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Converts an ISO date string (YYYY-MM-DD) to German display format (DD.MM.YYYY).
 */
export function formatGermanDate(isoDateStr: string): string {
  if (!isoDateStr) return ''
  const [year, month, day] = isoDateStr.split('-')
  return `${day}.${month}.${year}`
}
