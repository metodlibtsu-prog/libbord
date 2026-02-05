import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BehaviorData } from '@/types'
import { formatDate, formatDelta } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import clsx from 'clsx'

interface Props {
  data?: BehaviorData
  isLoading: boolean
}

function DeltaBadge({ label, delta }: { label: string; delta: number | null }) {
  if (delta === null) return null
  const isPositive = delta > 0
  const isNegative = delta < 0
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={clsx(
          'text-sm font-semibold',
          isPositive && 'text-green-600',
          isNegative && 'text-red-600',
          !isPositive && !isNegative && 'text-gray-500',
        )}
      >
        {formatDelta(delta)}
      </p>
    </div>
  )
}

export default function BehaviorCharts({ data, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />
  if (!data || data.timeline.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Нет данных о поведении</p>
  }

  const chartData = data.timeline.map((p) => ({
    ...p,
    date: formatDate(p.date),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Поведение пользователей</h2>
      <div className="flex gap-6 mb-4">
        <DeltaBadge label="Среднее время" delta={data.avg_time_delta_pct} />
        <DeltaBadge label="Глубина" delta={data.depth_delta_pct} />
        <DeltaBadge label="Отказы" delta={data.bounce_rate_delta_pct} />
        <DeltaBadge label="Возвраты" delta={data.return_rate_delta_pct} />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
          <Legend />
          <Line
            type="monotone"
            dataKey="bounce_rate"
            name="Отказы %"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="return_rate"
            name="Возвраты %"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="depth"
            name="Глубина"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
