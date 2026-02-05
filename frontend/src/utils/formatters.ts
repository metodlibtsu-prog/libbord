export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n)
}

export function formatDelta(delta: number | null): string {
  if (delta === null) return '--'
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function formatPlatform(platform: string): string {
  const map: Record<string, string> = {
    yandex_maps: 'Яндекс.Карты',
    google_maps: 'Google Maps',
    '2gis': '2ГИС',
  }
  return map[platform] || platform
}
