import { formatDelta, formatNumber } from '@/utils/formatters'
import clsx from 'clsx'

interface Props {
  title: string
  value: number
  delta: number | null
}

export default function KpiCard({ title, value, delta }: Props) {
  const isPositive = delta !== null && delta > 0
  const isNegative = delta !== null && delta < 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{formatNumber(value)}</p>
      {delta !== null && (
        <p
          className={clsx(
            'text-sm mt-1 font-medium',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600',
            !isPositive && !isNegative && 'text-gray-500',
          )}
        >
          {formatDelta(delta)} к пред. периоду
        </p>
      )}
    </div>
  )
}
