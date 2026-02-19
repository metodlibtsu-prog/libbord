import { useState, useMemo } from 'react'
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
import { smartAggregate } from '@/utils/aggregateTimeline'
import { useChartTheme } from '@/hooks/useChartTheme'
import { useTheme } from '@/context/ThemeContext'
import MetricInsightHint from './MetricInsightHint'

// Max counters shown by default before "show more" toggle
const MAX_VISIBLE = 5

interface Props {
  title: string
  metricKey: 'bounce_rate' | 'return_rate' | 'depth' | 'avg_time'
  counters: CounterBehaviorTimeline[]
  unit?: string
}

export default function MetricMiniChart({ title, metricKey, counters, unit = '%' }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const chartTheme = useChartTheme()
  const { isDark } = useTheme()
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Limit visible counters to top MAX_VISIBLE (by current metric value descending)
  const sortedCounters = useMemo(() => {
    const currentKey = `current_${metricKey}` as keyof CounterBehaviorTimeline
    return [...counters].sort(
      (a, b) => ((b[currentKey] as number) || 0) - ((a[currentKey] as number) || 0),
    )
  }, [counters, metricKey])

  const visibleCounters = showAll ? sortedCounters : sortedCounters.slice(0, MAX_VISIBLE)
  const hiddenCount = sortedCounters.length - MAX_VISIBLE

  // Build merged daily rows
  const dailyRows = useMemo(() => {
    const dateMap = new Map<string, Record<string, any>>()
    visibleCounters.forEach((counter, idx) => {
      counter.timeline.forEach((point) => {
        const key = point.date
        if (!dateMap.has(key)) dateMap.set(key, { date: key })
        dateMap.get(key)![`counter_${idx}`] = point[metricKey]
      })
    })
    return Array.from(dateMap.values()).sort((a, b) => (a.date > b.date ? 1 : -1))
  }, [visibleCounters, metricKey])

  // Auto-aggregate: weekly for quarter/year, daily otherwise
  const counterKeys = visibleCounters.map((_, idx) => `counter_${idx}`)
  const { data: aggregatedData, isAggregated } = useMemo(
    () => smartAggregate(dailyRows, counterKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dailyRows, metricKey],
  )
  // Format date labels AFTER aggregation:
  // - daily: "2025-01-15" → "15 янв."
  // - weekly: getMondayLabel already produced a localized string, leave as-is
  const chartData = useMemo(
    () =>
      isAggregated
        ? aggregatedData
        : aggregatedData.map((r) => ({ ...r, date: formatDate(r.date) })),
    [aggregatedData, isAggregated],
  )

  // Smart Y-axis domain: auto-fit with small padding
  const allValues = useMemo(() => {
    const vals: number[] = []
    chartData.forEach((row) => {
      counterKeys.forEach((k) => {
        if (row[k] !== null && row[k] !== undefined) vals.push(row[k])
      })
    })
    return vals
  }, [chartData, counterKeys])

  const yDomain = useMemo((): [number | string, number | string] => {
    if (allValues.length === 0) return ['auto', 'auto']
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const pad = (max - min) * 0.15 || 1
    return [
      parseFloat(Math.max(0, min - pad).toFixed(1)),
      parseFloat((max + pad).toFixed(1)),
    ]
  }, [allValues])

  // Average for insight hint (using all counters, not just visible)
  const avgValue =
    counters.reduce((sum, c) => {
      const currentKey = `current_${metricKey}` as keyof CounterBehaviorTimeline
      return sum + (c[currentKey] as number)
    }, 0) / (counters.length || 1)

  const strokeWidth = isAggregated ? (isDark ? 2 : 2) : (isDark ? 3 : 2.5)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="glass-card rounded-xl p-4 relative overflow-hidden"
    >
      {/* Corner gradient accent — dark only */}
      {isDark && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-premium opacity-10 blur-2xl" />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-1 relative z-10">
        <h3 className="text-md font-semibold text-dark-text">{title}</h3>
        <div className="flex items-center gap-2">
          {isAggregated && (
            <span className="text-xs text-dark-text-secondary bg-dark-card px-2 py-0.5 rounded-full border border-dark-border">
              по неделям
            </span>
          )}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-dark-text-secondary hover:text-dark-text transition-colors border border-dark-border rounded-full px-2 py-0.5"
            >
              {showAll ? 'Скрыть' : `+${hiddenCount} ещё`}
            </button>
          )}
        </div>
      </div>

      {counters.length === 0 ? (
        <p className="text-sm text-dark-text-secondary text-center py-8">Нет данных</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              {isDark && (
                <defs>
                  {visibleCounters.map((_counter, idx) => (
                    <filter key={`glow-${idx}`} id={`glow-mc-${idx}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation={isAggregated ? '2' : '3'} result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
              )}

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartTheme.gridColor}
                strokeOpacity={isDark ? 1 : 0.6}
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: chartTheme.textColor }}
                stroke={chartTheme.textColor}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10, fill: chartTheme.textColor }}
                stroke={chartTheme.textColor}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(v) =>
                  metricKey === 'avg_time'
                    ? `${v}с`
                    : metricKey === 'depth'
                    ? `${v}`
                    : `${v}%`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  borderRadius: '12px',
                  fontSize: 12,
                  backdropFilter: isDark ? 'blur(12px)' : 'none',
                  boxShadow: isDark ? 'none' : '0 8px 24px rgba(0,0,0,0.08)',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: chartTheme.tooltipText, fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: chartTheme.tooltipText }}
                formatter={(value: any, name: string) => {
                  const idx = parseInt(name.replace('counter_', ''))
                  const counter = visibleCounters[idx]
                  const counterName = counter ? counter.counter_name : name
                  const formatted =
                    typeof value === 'number'
                      ? value.toFixed(metricKey === 'depth' ? 2 : 1)
                      : value
                  return [`${formatted}${unit}`, counterName]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: chartTheme.legendColor, paddingTop: 8 }}
                formatter={(value) => {
                  const idx = parseInt(value.replace('counter_', ''))
                  const counter = visibleCounters[idx]
                  if (!counter) return value
                  const currentKey = `current_${metricKey}` as keyof CounterBehaviorTimeline
                  const currentValue = counter[currentKey] as number
                  return `${counter.counter_name}: ${currentValue.toFixed(
                    metricKey === 'depth' ? 2 : 1,
                  )}${unit}`
                }}
              />
              {visibleCounters.map((_counter, idx) => {
                const isActive = activeLine === null || activeLine === idx
                return (
                  <Line
                    key={_counter.counter_id}
                    type={isAggregated ? 'basis' : 'monotone'}
                    dataKey={`counter_${idx}`}
                    name={`counter_${idx}`}
                    stroke={chartTheme.lineColors[idx % chartTheme.lineColors.length]}
                    strokeWidth={isActive ? strokeWidth : strokeWidth * 0.5}
                    strokeOpacity={isDark ? 1 : isActive ? 1 : 0.25}
                    dot={false}
                    connectNulls
                    filter={isDark ? `url(#glow-mc-${idx})` : undefined}
                    isAnimationActive={inView}
                    animationDuration={isAggregated ? 800 : 1500}
                    animationEasing="ease-out"
                    onMouseEnter={() => !isDark && setActiveLine(idx)}
                    onMouseLeave={() => !isDark && setActiveLine(null)}
                    style={{ cursor: isDark ? 'default' : 'pointer', transition: 'stroke-opacity 0.2s' }}
                  />
                )
              })}
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
