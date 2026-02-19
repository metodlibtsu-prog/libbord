import { formatDelta, formatNumber } from '@/utils/formatters'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'
import Sparkline from '@/components/common/Sparkline'
import { useTheme } from '@/context/ThemeContext'

interface Props {
  title: string
  value: number
  delta: number | null
  sparklineData?: number[]
}

export default function KpiCard({ title, value, delta, sparklineData }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const { isDark } = useTheme()
  const isPositive = delta !== null && delta > 0
  const isNegative = delta !== null && delta < 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden group"
    >
      {/* Gradient overlay on hover — dark only */}
      {isDark && (
        <div className="absolute inset-0 bg-gradient-premium opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
      )}

      <p className="text-sm font-medium text-dark-text-secondary mb-3">{title}</p>

      <p className="text-4xl font-semibold text-dark-text mb-2 tracking-tight">
        {inView ? (
          <CountUp end={value} duration={1.5} separator=" " formattingFn={formatNumber} />
        ) : (
          formatNumber(value)
        )}
      </p>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-8 mb-3">
          <Sparkline
            data={sparklineData}
            color={isPositive ? (isDark ? '#10B981' : '#16A34A') : isNegative ? (isDark ? '#EF4444' : '#DC2626') : (isDark ? '#8B949E' : '#94A3B8')}
          />
        </div>
      )}

      {delta !== null && (
        <div className="flex items-center gap-1.5">
          {isPositive && (
            <span className={clsx('text-sm font-medium', isDark ? 'text-green-400' : 'text-emerald-600')}>
              ↑
            </span>
          )}
          {isNegative && (
            <span className={clsx('text-sm font-medium', isDark ? 'text-red-400' : 'text-red-600')}>
              ↓
            </span>
          )}
          <p
            className={clsx(
              'text-sm font-medium',
              isPositive && (isDark ? 'text-green-400' : 'text-emerald-600'),
              isNegative && (isDark ? 'text-red-400' : 'text-red-600'),
              !isPositive && !isNegative && 'text-dark-text-secondary',
            )}
          >
            {formatDelta(delta)} к пред. периоду
          </p>
        </div>
      )}

      {/* Glow blob — dark only */}
      {isDark && isPositive && (
        <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-green-500/20 rounded-full blur-2xl" />
      )}
    </motion.div>
  )
}
