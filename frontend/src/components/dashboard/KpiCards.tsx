import { useMemo } from 'react'
import type { ChannelTrendPoint, KpiOverview } from '@/types'
import { usePeriod } from '@/context/PeriodContext'
import { ArrowIcon, ArrowDownIcon, ArrowUpIcon } from '@/components/common/Icons'
import { formatNumber } from '@/utils/formatters'

interface Props {
  data?: KpiOverview
  isLoading: boolean
  trend?: ChannelTrendPoint[]
}

function Sparkline({ data, color = '#3146E6', height = 34 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null
  const W = 200
  const H = height
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pad = (max - min) * 0.15 || 1
  const yMin = min - pad
  const yMax = max + pad
  const step = W / (data.length - 1)
  const points = data.map((v, i) => [i * step, H - ((v - yMin) / (yMax - yMin)) * H] as [number, number])
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = path + ` L ${W} ${H} L 0 ${H} Z`
  const id = `sp-${color.replace('#', '')}`

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={color} />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="6" fill={color} opacity="0.18" />
    </svg>
  )
}

function Delta({ value }: { value: number | null }) {
  if (value === null || value === undefined) return null
  const dir = value > 0.1 ? 'pos' : value < -0.1 ? 'neg' : 'flat'
  return (
    <span className={`lb-pulse-delta lb-${dir}`}>
      {dir === 'pos' && <ArrowUpIcon style={{ width: 11, height: 11 }} />}
      {dir === 'neg' && <ArrowDownIcon style={{ width: 11, height: 11 }} />}
      {value > 0 ? '+' : ''}{value.toFixed(1)}% к пред. периоду
    </span>
  )
}

function FlowConnector({ rate, label }: { rate: string; label: string }) {
  return (
    <div className="lb-pulse-conn">
      <div className="lb-pulse-conn-arrow">
        <span className="lb-seg-line" style={{ width: 14, height: 1, background: 'var(--ink-3)', display: 'inline-block' }} />
        <ArrowIcon style={{ width: 12, height: 12 }} />
      </div>
      <div className="lb-pulse-conn-rate lb-mono">{rate}</div>
      <div className="lb-pulse-conn-label">{label}</div>
    </div>
  )
}

export default function KpiCards({ data, isLoading, trend }: Props) {
  const { period, customFrom, customTo } = usePeriod()

  const dateLabel = useMemo(() => {
    if (period === 'custom' && customFrom && customTo) {
      return `${customFrom} — ${customTo}`
    }
    const labels: Record<string, string> = {
      today: 'Сегодня',
      yesterday: 'Вчера',
      week: 'Последние 7 дней',
      month: 'Последние 30 дней',
      quarter: 'Квартал',
      year: 'Год',
    }
    return labels[period] || period
  }, [period, customFrom, customTo])

  if (isLoading) {
    return (
      <div className="lb-glass-strong lb-pulse" style={{ minHeight: 160 }}>
        <div className="lb-eyebrow">Цифровые сервисы библиотеки</div>
        <div className="lb-h1" style={{ marginTop: 4 }}>Пульс аудитории</div>
        <div style={{ marginTop: 32, color: 'var(--ink-4)', fontSize: 14 }}>Загрузка данных…</div>
      </div>
    )
  }

  if (!data) return null

  const views = data.views ?? 0
  const visits = data.visits ?? 0
  const users = data.users ?? 0

  const convRate = views > 0 ? ((visits / views) * 100).toFixed(1) + '%' : '—'
  const uniqRate = visits > 0 ? ((users / visits) * 100).toFixed(1) + '%' : '—'

  return (
    <div className="lb-glass-strong lb-pulse">
      <div className="lb-row" style={{ marginBottom: 18, alignItems: 'baseline' }}>
        <div>
          <div className="lb-eyebrow">Цифровые сервисы библиотеки</div>
          <div className="lb-h1" style={{ marginTop: 4 }}>Пульс аудитории</div>
        </div>
        <div className="lb-spacer" />
        <div className="lb-small lb-muted">{dateLabel}</div>
      </div>

      <div className="lb-pulse-grid">
        {/* Просмотры */}
        <div className="lb-pulse-cell">
          <div className="lb-pulse-label">
            <span style={{ width: 8, height: 8, borderRadius: 3, background: '#3146E6', display: 'inline-block', flexShrink: 0 }} />
            Просмотры
          </div>
          <div className="lb-pulse-value lb-mono">{formatNumber(views)}</div>
          <Delta value={data.views_delta_pct} />
          <div className="lb-pulse-spark">
            <Sparkline data={trend && trend.length > 1 ? trend.map(t => t.views) : Array(7).fill(views)} color="#3146E6" />
          </div>
        </div>

        <FlowConnector rate={convRate} label="конверсия в визит" />

        {/* Визиты */}
        <div className="lb-pulse-cell">
          <div className="lb-pulse-label">
            <span style={{ width: 8, height: 8, borderRadius: 3, background: '#0EA5A5', display: 'inline-block', flexShrink: 0 }} />
            Визиты
          </div>
          <div className="lb-pulse-value lb-mono">{formatNumber(visits)}</div>
          <Delta value={data.visits_delta_pct} />
          <div className="lb-pulse-spark">
            <Sparkline data={trend && trend.length > 1 ? trend.map(t => t.visits) : Array(7).fill(visits)} color="#0EA5A5" />
          </div>
        </div>

        <FlowConnector rate={uniqRate} label="уникальность" />

        {/* Уникальные */}
        <div className="lb-pulse-cell">
          <div className="lb-pulse-label">
            <span style={{ width: 8, height: 8, borderRadius: 3, background: '#7C3AED', display: 'inline-block', flexShrink: 0 }} />
            Уникальные посетители
          </div>
          <div className="lb-pulse-value lb-mono">{formatNumber(users)}</div>
          <Delta value={data.users_delta_pct} />
          <div className="lb-pulse-spark">
            <Sparkline data={trend && trend.length > 1 ? trend.map(t => t.users) : Array(7).fill(users)} color="#7C3AED" />
          </div>
        </div>
      </div>
    </div>
  )
}
