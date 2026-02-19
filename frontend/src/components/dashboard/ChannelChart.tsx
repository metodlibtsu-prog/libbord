import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import type { ChannelMetric, ChannelType } from '@/types'
import { CHANNEL_COLORS, CHANNEL_LABELS } from '@/utils/colors'
import { formatNumber } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface Props {
  data?: ChannelMetric[]
  isLoading: boolean
}

export default function ChannelChart({ data, isLoading }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  if (isLoading) return <LoadingSpinner />
  if (!data || data.length === 0) {
    return <p className="text-sm text-dark-text-secondary text-center py-8">Нет данных по каналам</p>
  }

  // Filter out VK channels since they have their own block
  const filteredData = data.filter((ch) => ch.channel_type !== 'vk')

  const chartData = filteredData.map((ch) => ({
    name: ch.custom_name || CHANNEL_LABELS[ch.channel_type as ChannelType] || ch.channel_type,
    views: ch.views,
    visits: ch.visits,
    users: ch.users,
    fill: CHANNEL_COLORS[ch.channel_type as ChannelType] || CHANNEL_COLORS.other,
  }))

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      {/* Gradient accent line at top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-premium" />

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
          <defs>
            {chartData.map((item, idx) => (
              <linearGradient key={idx} id={`gradient-${idx}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={item.fill} stopOpacity={0.8} />
                <stop offset="100%" stopColor={item.fill} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#30363D" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => formatNumber(v)}
            stroke="#8B949E"
            tick={{ fill: '#8B949E', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            stroke="#8B949E"
            tick={{ fill: '#E6EDF3', fontSize: 13 }}
          />
          <Tooltip
            formatter={(value: number) => formatNumber(value)}
            contentStyle={{
              backgroundColor: '#161B22',
              border: '1px solid #30363D',
              borderRadius: '8px',
              color: '#E6EDF3',
            }}
            cursor={{ fill: 'rgba(0, 212, 255, 0.1)' }}
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
              <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Glow effect overlay at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gradient-cyan/5 to-transparent pointer-events-none" />
    </motion.div>
  )
}
