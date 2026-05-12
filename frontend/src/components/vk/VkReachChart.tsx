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
import type { VkEngagementPoint } from '@/types'
import { formatNumber } from '@/utils/formatters'
import { useChartTheme } from '@/hooks/useChartTheme'
import { useTheme } from '@/context/ThemeContext'

interface Props {
  data: VkEngagementPoint[]
}

export default function VkReachChart({ data }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const chartTheme = useChartTheme()
  const { isDark } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-dark-text mb-4">Вовлечённость</h2>
        <p className="text-sm text-dark-text-secondary text-center py-8">Нет данных</p>
      </div>
    )
  }

  const likesColor   = isDark ? '#00D4FF' : '#3146E6'
  const repostsColor = isDark ? '#0EA5A5' : '#0EA5A5'
  const commentsColor = isDark ? '#F59E0B' : '#D97706'

  const avgLikes    = Math.round(data.reduce((s, d) => s + d.likes, 0) / data.length)
  const avgReposts  = Math.round(data.reduce((s, d) => s + d.reposts, 0) / data.length)
  const avgComments = Math.round(data.reduce((s, d) => s + d.comments, 0) / data.length)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      <h2 className="text-lg font-semibold text-dark-text mb-2 relative z-10">Вовлечённость</h2>
      <p className="text-sm text-dark-text-secondary mb-4 relative z-10">Лайки, репосты и комментарии по дням</p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
          />
          <Tooltip
            formatter={(value: number) => formatNumber(value)}
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
          <Legend wrapperStyle={{ color: chartTheme.legendColor }} />
          <Line type="monotone" dataKey="likes"    stroke={likesColor}    name="Лайки"       strokeWidth={2} dot={false} isAnimationActive={inView} animationDuration={1500} animationEasing="ease-out" />
          <Line type="monotone" dataKey="reposts"  stroke={repostsColor}  name="Репосты"     strokeWidth={2} dot={false} isAnimationActive={inView} animationDuration={1500} animationEasing="ease-out" />
          <Line type="monotone" dataKey="comments" stroke={commentsColor} name="Комментарии" strokeWidth={2} dot={false} isAnimationActive={inView} animationDuration={1500} animationEasing="ease-out" />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm relative z-10">
        <div>
          <p className="text-dark-text-secondary">Лайков/день</p>
          <p className="font-semibold text-dark-text">{formatNumber(avgLikes)}</p>
        </div>
        <div>
          <p className="text-dark-text-secondary">Репостов/день</p>
          <p className="font-semibold text-dark-text">{formatNumber(avgReposts)}</p>
        </div>
        <div>
          <p className="text-dark-text-secondary">Комментариев/день</p>
          <p className="font-semibold text-dark-text">{formatNumber(avgComments)}</p>
        </div>
      </div>
    </motion.div>
  )
}
