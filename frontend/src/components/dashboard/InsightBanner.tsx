import type { Insight } from '@/types'
import clsx from 'clsx'

interface Props {
  insights: Insight[]
  block: string
}

const severityStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  alert: 'bg-red-50 border-red-200 text-red-800',
}

const severityIcons = {
  info: 'i',
  warning: '!',
  alert: '!!',
}

export default function InsightBanner({ insights, block }: Props) {
  const blockInsights = insights.filter((i) => i.block === block)
  if (blockInsights.length === 0) return null

  return (
    <div className="space-y-2 mt-2">
      {blockInsights.map((insight, idx) => (
        <div
          key={idx}
          className={clsx(
            'px-4 py-2.5 rounded-lg border text-sm flex items-start gap-2',
            severityStyles[insight.severity],
          )}
        >
          <span className="font-bold text-xs mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-current/10">
            {severityIcons[insight.severity]}
          </span>
          <span>{insight.message}</span>
        </div>
      ))}
    </div>
  )
}
