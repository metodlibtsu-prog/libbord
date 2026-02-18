import { formatDelta, formatNumber } from '@/utils/formatters'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'
import Sparkline from '@/components/common/Sparkline'

interface Props {
  title: string
  value: number
  delta: number | null
  sparklineData?: number[]
}

export default function KpiCard({ title, value, delta, sparklineData }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const isPositive = delta !== null && delta > 0
  const isNegative = delta !== null && delta < 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden group"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-premium opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

      <p className="text-sm text-dark-text-secondary mb-1">{title}</p>

      <p className="text-3xl font-bold text-dark-text mb-2">
        {inView ? (
          <CountUp end={value} duration={1.5} separator=" " formattingFn={formatNumber} />
        ) : (
          formatNumber(value)
        )}
      </p>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-8 mb-2">
          <Sparkline
            data={sparklineData}
            color={isPositive ? '#10B981' : isNegative ? '#EF4444' : '#8B949E'}
          />
        </div>
      )}

      {delta !== null && (
        <div className="flex items-center gap-1">
          {isPositive && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500">
              ↑
            </motion.span>
          )}
          {isNegative && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-500">
              ↓
            </motion.span>
          )}
          <p
            className={clsx(
              'text-sm font-medium',
              isPositive && 'text-green-500',
              isNegative && 'text-red-500',
              !isPositive && !isNegative && 'text-dark-text-secondary',
            )}
          >
            {formatDelta(delta)} к пред. периоду
          </p>
        </div>
      )}

      {/* Glow effect on positive delta */}
      {isPositive && (
        <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-green-500/20 rounded-full blur-2xl" />
      )}
    </motion.div>
  )
}
