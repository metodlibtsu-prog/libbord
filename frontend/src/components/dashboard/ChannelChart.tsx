import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import type { ChannelMetric, ChannelType } from '@/types'
import { CHANNEL_COLORS, CHANNEL_LABELS } from '@/utils/colors'
import { formatNumber } from '@/utils/formatters'
import { useChartTheme } from '@/hooks/useChartTheme'
import { useTheme } from '@/context/ThemeContext'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// Softer, more professional palette for light mode bars
const CHANNEL_COLORS_LIGHT: Partial<Record<ChannelType, string>> = {
  website:    '#0EA5E9',
  e_library:  '#059669',
  catalog:    '#D97706',
  telegram:   '#0284C7',
  vk:         '#7C3AED',
  mobile_app: '#DB2777',
  other:      '#64748B',
}

interface Props {
  data?: ChannelMetric[]
  isLoading: boolean
}

export default function ChannelChart({ data, isLoading }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const chartTheme = useChartTheme()
  const { isDark } = useTheme()

  if (isLoading) return <LoadingSpinner />
  if (!data || data.length === 0) {
    return <p className="text-sm text-dark-text-secondary text-center py-8">Нет данных по каналам</p>
  }

  const filteredData = data.filter((ch) => ch.channel_type !== 'vk')

  const chartData = filteredData.map((ch) => {
    const type = ch.channel_type as ChannelType
    const darkColor  = CHANNEL_COLORS[type] || CHANNEL_COLORS.other
    const lightColor = CHANNEL_COLORS_LIGHT[type] || '#64748B'
    return {
      name:  ch.custom_name || CHANNEL_LABELS[type] || ch.channel_type,
      views: ch.views,
      fill:  isDark ? darkColor : lightColor,
    }
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      {/* Gradient accent line at top — dark only */}
      {isDark && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-premium" />}

      <h2 className="text-lg font-semibold text-dark-text mb-1">Каналы привлечения</h2>
      <p className="text-sm text-dark-text-secondary mb-5">Просмотры по источникам трафика</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
          <defs>
            {chartData.map((item, idx) => (
              <linearGradient key={idx} id={`ch-grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor={item.fill} stopOpacity={isDark ? 0.65 : 0.75} />
                <stop offset="100%" stopColor={item.fill} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.gridColor}
            strokeOpacity={isDark ? 1 : 0.6}
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={(v) => formatNumber(v)}
            stroke={chartTheme.textColor}
            tick={{ fill: chartTheme.textColor, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            stroke={chartTheme.textColor}
            tick={{ fill: chartTheme.tooltipText, fontSize: 13 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [formatNumber(value), 'Просмотры']}
            contentStyle={{
              backgroundColor: chartTheme.tooltipBg,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: '12px',
              boxShadow: isDark ? 'none' : '0 8px 24px rgba(0,0,0,0.08)',
              padding: '8px 12px',
            }}
            labelStyle={{ color: chartTheme.tooltipText, fontWeight: 500 }}
            itemStyle={{ color: chartTheme.tooltipText }}
            cursor={{ fill: chartTheme.cursorFill }}
          />
          <Bar
            dataKey="views"
            name="Просмотры"
            radius={[0, 8, 8, 0]}
            isAnimationActive={inView}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#ch-grad-${index})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Bottom glow — dark only */}
      {isDark && (
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gradient-cyan/5 to-transparent pointer-events-none" />
      )}
    </motion.div>
  )
}
