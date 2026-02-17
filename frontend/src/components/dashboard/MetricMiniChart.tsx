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
import type { CounterBehaviorTimeline } from '@/types'
import { formatDate } from '@/utils/formatters'
import MetricInsightHint from './MetricInsightHint'

interface Props {
  title: string
  metricKey: 'bounce_rate' | 'return_rate' | 'depth' | 'avg_time'
  counters: CounterBehaviorTimeline[]
  unit?: string
}

const COLORS = ['#EF4444', '#10B981', '#6366F1', '#F59E0B', '#0EA5E9', '#8B5CF6']

export default function MetricMiniChart({ title, metricKey, counters, unit = '%' }: Props) {
  // Prepare chart data: merge all counter timelines by date
  const dateMap = new Map<string, any>()

  counters.forEach((counter, idx) => {
    counter.timeline.forEach((point) => {
      const dateKey = point.date
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey })
      }
      const entry = dateMap.get(dateKey)!
      entry[`counter_${idx}`] = point[metricKey]
    })
  })

  const chartData = Array.from(dateMap.values())
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((d) => ({ ...d, date: formatDate(d.date) }))

  // Calculate average for insight hint
  const avgValue =
    counters.reduce((sum, c) => {
      const currentKey = `current_${metricKey}` as keyof CounterBehaviorTimeline
      return sum + (c[currentKey] as number)
    }, 0) / (counters.length || 1)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-md font-semibold text-gray-900 mb-3">{title}</h3>

      {counters.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#999" />
              <YAxis tick={{ fontSize: 11 }} stroke="#999" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => {
                  const idx = parseInt(value.replace('counter_', ''))
                  const counter = counters[idx]
                  if (!counter) return value
                  const currentKey = `current_${metricKey}` as keyof CounterBehaviorTimeline
                  const currentValue = counter[currentKey] as number
                  return `${counter.counter_name}: ${currentValue.toFixed(
                    metricKey === 'depth' ? 2 : 1,
                  )}${unit}`
                }}
              />
              {counters.map((counter, idx) => (
                <Line
                  key={counter.counter_id}
                  type="monotone"
                  dataKey={`counter_${idx}`}
                  name={`counter_${idx}`}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <MetricInsightHint metricType={metricKey} avgValue={avgValue} />
        </>
      )}
    </div>
  )
}
