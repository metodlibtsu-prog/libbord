import type { Insight } from '@/types'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

interface Props {
  insights: Insight[]
  block: string
}

const severityStyles = {
  info:    'border-gradient-cyan text-dark-text',
  warning: 'border-yellow-500 text-dark-text',
  alert:   'border-red-500 text-dark-text',
}

const severityIconColors = {
  info:    'text-gradient-cyan',
  warning: 'text-yellow-500',
  alert:   'text-red-500',
}

const severityIconColorsDark = {
  info:    { color: '#00D4FF', shadow: '0 0 10px rgba(0, 212, 255, 0.7)' },
  warning: { color: '#F59E0B', shadow: '0 0 10px rgba(245, 158, 11, 0.7)' },
  alert:   { color: '#EF4444', shadow: '0 0 10px rgba(239, 68, 68, 0.7)' },
}

const severityIcons = {
  info:    'i',
  warning: '!',
  alert:   '!!',
}

export default function InsightBanner({ insights, block }: Props) {
  const { isDark } = useTheme()
  const blockInsights = insights.filter((i) => i.block === block)
  if (blockInsights.length === 0) return null

  return (
    <div className="space-y-2 mt-2">
      {blockInsights.map((insight, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.4 }}
          className={clsx(
            'glass-card px-4 py-2.5 rounded-lg border-2 text-sm flex items-start gap-3 relative overflow-hidden',
            severityStyles[insight.severity],
          )}
        >
          {/* Icon with neon glow in dark mode, clean in light */}
          <span
            className={clsx(
              'font-bold text-xs mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2',
              severityIconColors[insight.severity],
            )}
            style={{
              borderColor: 'currentColor',
              boxShadow: isDark ? severityIconColorsDark[insight.severity].shadow : 'none',
            }}
          >
            {severityIcons[insight.severity]}
          </span>
          <span className="flex-1">{insight.message}</span>

          {/* Subtle gradient overlay — dark only */}
          {isDark && (
            <div className="absolute inset-0 bg-gradient-premium opacity-5 pointer-events-none" />
          )}
        </motion.div>
      ))}
    </div>
  )
}
