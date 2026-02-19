/**
 * Aggregates a sorted array of daily chart rows into weekly buckets.
 *
 * Each bucket is labelled by the Monday of that ISO week.
 * Values are averaged across days within the bucket (nulls/undefined skipped).
 *
 * @param rows   Array of objects with a "date" string key + arbitrary numeric keys
 * @param keys   Numeric keys to average (e.g. ["counter_0", "counter_1"])
 * @returns      Reduced array with one row per week
 */
export function aggregateByWeek(
  rows: Record<string, any>[],
  keys: string[],
): Record<string, any>[] {
  if (rows.length === 0) return rows

  // Group rows by ISO week key "YYYY-Www"
  const buckets = new Map<string, { label: string; rows: Record<string, any>[] }>()

  for (const row of rows) {
    const weekKey = getISOWeekKey(row.date)
    if (!buckets.has(weekKey)) {
      buckets.set(weekKey, { label: getMondayLabel(row.date), rows: [] })
    }
    buckets.get(weekKey)!.rows.push(row)
  }

  // Average each bucket
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([, bucket]) => {
      const result: Record<string, any> = { date: bucket.label }
      for (const key of keys) {
        const values = bucket.rows
          .map((r) => r[key])
          .filter((v) => v !== undefined && v !== null && !isNaN(v))
        result[key] = values.length > 0
          ? parseFloat((values.reduce((s, v) => s + v, 0) / values.length).toFixed(2))
          : null
      }
      return result
    })
}

/** Returns "YYYY-Www" for the ISO week containing the given date string */
function getISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const thursday = new Date(d)
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3) // nearest Thursday
  const year = thursday.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const week = Math.ceil(
    ((thursday.getTime() - jan4.getTime()) / 86_400_000 + ((jan4.getDay() + 6) % 7) + 1) / 7,
  )
  return `${year}-W${String(week).padStart(2, '0')}`
}

/** Returns the label for the Monday of the week containing dateStr */
function getMondayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const dayOfWeek = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  const monday = new Date(d)
  monday.setDate(d.getDate() - dayOfWeek)
  return monday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

/** Returns "Jan 15 – Jan 21" style range label for the week of dateStr */
export function weekRangeLabel(mondayLabel: string, rows: Record<string, any>[]): string {
  if (rows.length === 0) return mondayLabel
  const dates = rows.map((r) => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime())
  const first = dates[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const last = dates[dates.length - 1].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return first === last ? first : `${first} – ${last}`
}

/**
 * Decides how to aggregate data based on the number of daily points.
 * - ≤ 35 points  → keep daily (week / month)
 * - > 35 points  → aggregate to weekly
 */
export function smartAggregate(
  rows: Record<string, any>[],
  keys: string[],
): { data: Record<string, any>[]; isAggregated: boolean } {
  if (rows.length <= 35) {
    return { data: rows, isAggregated: false }
  }
  return { data: aggregateByWeek(rows, keys), isAggregated: true }
}
