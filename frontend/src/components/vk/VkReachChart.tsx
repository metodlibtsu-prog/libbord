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
import type { VkReachPoint } from '@/types'
import { formatNumber } from '@/utils/formatters'
import { useChartTheme } from '@/hooks/useChartTheme'

interface Props {
  data: VkReachPoint[]
}

export default function VkReachChart({ data }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const chartTheme = useChartTheme()

  if (!data || data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-dark-text mb-4">Охват и показы</h2>
        <p className="text-sm text-dark-text-secondary text-center py-8">Нет данных</p>
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      {/* Corner gradient accent */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-premium opacity-10 blur-2xl" />

      <h2 className="text-lg font-semibold text-dark-text mb-2 relative z-10">Охват и показы</h2>
      <p className="text-sm text-dark-text-secondary mb-4 relative z-10">Сколько людей увидели контент</p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <filter id="glow-reach" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-views" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} horizontal={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: chartTheme.textColor }}
            stroke={chartTheme.textColor}
            tickLine={false}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}.${date.getMonth() + 1}`
            }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: chartTheme.textColor }}
            stroke={chartTheme.textColor}
            tickLine={false}
            tickFormatter={(v) => formatNumber(v)}
          />
          <Tooltip
            formatter={(value: number) => formatNumber(value)}
            contentStyle={{
              backgroundColor: chartTheme.tooltipBg,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: '8px',
              color: chartTheme.tooltipText,
              backdropFilter: 'blur(12px)',
            }}
            labelFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
            }}
          />
          <Legend wrapperStyle={{ color: chartTheme.legendColor }} />
          <Line
            type="monotone"
            dataKey="reach"
            stroke="#00D4FF"
            name="Охват"
            strokeWidth={3}
            filter="url(#glow-reach)"
            isAnimationActive={inView}
            animationDuration={1500}
            animationEasing="ease-out"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#10B981"
            name="Показы"
            strokeWidth={3}
            filter="url(#glow-views)"
            isAnimationActive={inView}
            animationDuration={1500}
            animationEasing="ease-out"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm relative z-10">
        <div>
          <p className="text-dark-text-secondary">Средний охват на день</p>
          <p className="font-semibold text-dark-text">
            {formatNumber(Math.round(data.reduce((sum, d) => sum + d.reach, 0) / data.length))}
          </p>
        </div>
        <div>
          <p className="text-dark-text-secondary">Средние показы на день</p>
          <p className="font-semibold text-dark-text">
            {formatNumber(Math.round(data.reduce((sum, d) => sum + d.views, 0) / data.length))}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
