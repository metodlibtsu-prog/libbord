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
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import type { CounterBehaviorTimeline } from '@/types'
import { formatDate } from '@/utils/formatters'
import { NEON_COLORS } from '@/utils/colors'
import { useChartTheme } from '@/hooks/useChartTheme'
import MetricInsightHint from './MetricInsightHint'

interface Props {
  title: string
  metricKey: 'bounce_rate' | 'return_rate' | 'depth' | 'avg_time'
  counters: CounterBehaviorTimeline[]
  unit?: string
}

export default function MetricMiniChart({ title, metricKey, counters, unit = '%' }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const chartTheme = useChartTheme()
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
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="glass-card rounded-xl p-4 relative overflow-hidden"
    >
      {/* Corner gradient accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-premium opacity-10 blur-2xl" />

      <h3 className="text-md font-semibold text-dark-text mb-3 relative z-10">{title}</h3>

      {counters.length === 0 ? (
        <p className="text-sm text-dark-text-secondary text-center py-8">Нет данных</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <defs>
                {counters.map((_counter, idx) => (
                  <filter key={`glow-${idx}`} id={`glow-${idx}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} horizontal={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: chartTheme.textColor }}
                stroke={chartTheme.textColor}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} stroke={chartTheme.textColor} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  borderRadius: '8px',
                  fontSize: 12,
                  color: chartTheme.tooltipText,
                  backdropFilter: 'blur(12px)',
                }}
                formatter={(value: any, name: string) => {
                  const idx = parseInt(name.replace('counter_', ''))
                  const counter = counters[idx]
                  const counterName = counter ? counter.counter_name : name
                  return [
                    `${typeof value === 'number' ? value.toFixed(metricKey === 'depth' ? 2 : 1) : value}${unit}`,
                    counterName,
                  ]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: chartTheme.legendColor }}
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
                  stroke={NEON_COLORS[idx % NEON_COLORS.length]}
                  strokeWidth={3}
                  dot={false}
                  filter={`url(#glow-${idx})`}
                  isAnimationActive={inView}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="relative z-10">
            <MetricInsightHint metricType={metricKey} avgValue={avgValue} />
          </div>
        </>
      )}
    </motion.div>
  )
}
