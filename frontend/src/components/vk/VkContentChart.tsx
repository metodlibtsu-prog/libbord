import { VkContentPoint } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { formatNumber } from '@/utils/formatters'
import { useChartTheme } from '@/hooks/useChartTheme'
import { useTheme } from '@/context/ThemeContext'

interface VkContentChartProps {
  data: VkContentPoint[]
}

export default function VkContentChart({ data }: VkContentChartProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const chartTheme = useChartTheme()
  const { isDark } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-dark-text mb-4">Активность контента</h2>
        <p className="text-sm text-dark-text-secondary text-center py-8">Нет данных</p>
      </div>
    )
  }

  // Calculate averages
  const avgPosts   = Math.round(data.reduce((sum, d) => sum + d.posts,   0) / data.length)
  const avgStories = Math.round(data.reduce((sum, d) => sum + d.stories, 0) / data.length)
  const avgClips   = Math.round(data.reduce((sum, d) => sum + d.clips,   0) / data.length)
  const avgVideos  = Math.round(data.reduce((sum, d) => sum + d.videos,  0) / data.length)

  // Theme-aware bar colors
  const colors = isDark
    ? { posts: '#00D4FF', stories: '#7B2FBE', clips: '#FF006E', videos: '#F59E0B' }
    : { posts: '#2563EB', stories: '#7C3AED', clips: '#DC2626',  videos: '#D97706' }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="glass-card rounded-xl p-5 relative overflow-hidden"
    >
      {/* Gradient accent line at bottom — dark only */}
      {isDark && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-premium" />}

      <h2 className="text-lg font-semibold text-dark-text mb-2 relative z-10">Просмотры контента</h2>
      <p className="text-sm text-dark-text-secondary mb-4 relative z-10">
        Сколько раз пользователи просмотрели контент
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barCategoryGap="10%">
          <defs>
            <linearGradient id="gradient-posts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.posts} stopOpacity={0.85} />
              <stop offset="100%" stopColor={colors.posts} stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradient-stories" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.stories} stopOpacity={0.85} />
              <stop offset="100%" stopColor={colors.stories} stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradient-clips" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.clips} stopOpacity={0.85} />
              <stop offset="100%" stopColor={colors.clips} stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradient-videos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.videos} stopOpacity={0.85} />
              <stop offset="100%" stopColor={colors.videos} stopOpacity={1} />
            </linearGradient>
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
              backdropFilter: isDark ? 'blur(12px)' : 'none',
              boxShadow: isDark ? 'none' : '0 6px 20px rgba(0,0,0,0.08)',
            }}
            labelFormatter={(value) => {
              const date = new Date(value as string)
              return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
            }}
          />
          <Legend wrapperStyle={{ color: chartTheme.legendColor }} />
          <Bar dataKey="posts"   stackId="content" fill="url(#gradient-posts)"   name="Посты"   radius={[0, 0, 0, 0]} isAnimationActive={inView} animationDuration={1000} animationEasing="ease-out" />
          <Bar dataKey="stories" stackId="content" fill="url(#gradient-stories)" name="Истории" radius={[0, 0, 0, 0]} isAnimationActive={inView} animationDuration={1000} animationEasing="ease-out" />
          <Bar dataKey="clips"   stackId="content" fill="url(#gradient-clips)"   name="Клипы"   radius={[0, 0, 0, 0]} isAnimationActive={inView} animationDuration={1000} animationEasing="ease-out" />
          <Bar dataKey="videos"  stackId="content" fill="url(#gradient-videos)"  name="Видео"   radius={[8, 8, 0, 0]} isAnimationActive={inView} animationDuration={1000} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm relative z-10">
        <div>
          <p className="text-dark-text-secondary">Просмотры постов/день</p>
          <p className="font-semibold text-dark-text">{formatNumber(avgPosts)}</p>
        </div>
        <div>
          <p className="text-dark-text-secondary">Просмотры историй/день</p>
          <p className="font-semibold text-dark-text">{formatNumber(avgStories)}</p>
        </div>
        <div>
          <p className="text-dark-text-secondary">Просмотры клипов/день</p>
          <p className="font-semibold text-dark-text">{formatNumber(avgClips)}</p>
        </div>
        <div>
          <p className="text-dark-text-secondary">Просмотры видео/день</p>
          <p className="font-semibold text-dark-text">{formatNumber(avgVideos)}</p>
        </div>
      </div>
    </motion.div>
  )
}
