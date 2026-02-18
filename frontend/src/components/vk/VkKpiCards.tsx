import { formatDelta, formatNumber } from '@/utils/formatters'
import clsx from 'clsx'
import type { VkKpi } from '@/types'

interface Props {
  kpis: VkKpi
}

interface KpiCardProps {
  title: string
  value: number
  delta: number | null
  suffix?: string
}

function KpiCard({ title, value, delta, suffix = '' }: KpiCardProps) {
  const isPositive = delta !== null && delta > 0
  const isNegative = delta !== null && delta < 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">
        {formatNumber(value)}
        {suffix}
      </p>
      {delta !== null && (
        <div className="flex items-center gap-1 mt-1">
          {isPositive && <span className="text-green-600">↑</span>}
          {isNegative && <span className="text-red-600">↓</span>}
          <p
            className={clsx(
              'text-sm font-medium',
              isPositive && 'text-green-600',
              isNegative && 'text-red-600',
              !isPositive && !isNegative && 'text-gray-500'
            )}
          >
            {formatDelta(delta)} к пред. периоду
          </p>
        </div>
      )}
    </div>
  )
}

export default function VkKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <KpiCard title="Охват" value={kpis.reach} delta={kpis.reach_delta_pct} />
      <KpiCard title="Показы" value={kpis.views} delta={kpis.views_delta_pct} />
      <KpiCard title="Подписчики" value={kpis.subscribers} delta={kpis.subscribers_delta_pct} />
    </div>
  )
}
