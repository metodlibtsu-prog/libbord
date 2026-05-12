import { VkReachPoint } from '@/types'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { formatNumber } from '@/utils/formatters'
import { useChartTheme } from '@/hooks/useChartTheme'
import { useTheme } from '@/context/ThemeContext'

interface VkContentChartProps {
  data: VkReachPoint[]
}

export default function VkContentChart({ data }: VkContentChartProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const chartTheme = useChartTheme()
  const { isDark } = useTheme()

  const validData = data?.filter(d => d.subscribers > 0) ?? []

  if (validData.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-dark-text mb-4">Динамика подписчиков</h2>
        <p className="text-sm text-dark-text-secondary text-center py-8">Нет данных</p>
      </div>
    )
  }

  const minSubs = Math.min(...validData.map(d => d.subscribers))
  const maxSubs = Math.max(...validData.map(d => d.subscribers))
  const growth  = maxSubs - minSubs
  const latestSubs = validData[validData.length - 1]?.subscribers ?? 0

  const fillColor  = isDark ? '#00D4FF' : '#3146E6'
  const strokeColor = isDark ? '#00D4FF' : '#3146E6'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      <h2 className="text-lg font-semibold text-dark-text mb-2 relative z-10">Динамика подписчиков</h2>
      <p className="text-sm text-dark-text-secondary mb-4 relative z-10">Общее число подписчиков по дням</p>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={validData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="subs-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={fillColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} horizontal={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: chartTheme.textColor }}
            stroke={chartTheme.textColor}
            tickLine={false}
            tickFormatter={(value) => {
              const d = new Date(value)
              return `${d.getDate()}.${d.getMonth() + 1}`
            }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: chartTheme.textColor }}
            stroke={chartTheme.textColor}
            tickLine={false}
            tickFormatter={(v) => formatNumber(v)}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value: number) => [formatNumber(value), 'Подписчики']}
            contentStyle={{
              backgroundColor: chartTheme.tooltipBg,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: '8px',
              color: chartTheme.tooltipText,
              backdropFilter: isDark ? 'blur(12px)' : 'none',
              boxShadow: isDark ? 'none' : '0 6px 20px rgba(0,0,0,0.08)',
            }}
            labelFormatter={(value) => {
              const d = new Date(value)
              return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
            }}
          />
          <Area
            type="monotone"
            dataKey="subscribers"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#subs-grad)"
            name="Подписчики"
            dot={false}
            isAnimationActive={inView}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm relative z-10">
        <div>
          <p className="text-dark-text-secondary">Сейчас</p>
          <p className="font-semibold text-dark-text">{formatNumber(latestSubs)}</p>
        </div>
        <div>
          <p className="text-dark-text-secondary">Максимум</p>
          <p className="font-semibold text-dark-text">{formatNumber(maxSubs)}</p>
        </div>
        <div>
          <p className="text-dark-text-secondary">Прирост</p>
          <p className={`font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {growth >= 0 ? '+' : ''}{formatNumber(growth)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
