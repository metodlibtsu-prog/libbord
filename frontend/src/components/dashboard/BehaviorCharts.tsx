import type { BehaviorData, CounterBehaviorTimeline } from '@/types'
import { WarnIcon, OkIcon } from '@/components/common/Icons'

interface Props {
  data?: BehaviorData
  isLoading: boolean
}

const LINE_COLORS = ['#3146E6', '#0EA5A5', '#7C3AED', '#D97706', '#DB2777', '#059669']

function SvgLineChart({
  series,
  labels,
  yFormat = (v: number) => String(v),
  height = 180,
}: {
  series: { name: string; data: number[]; color: string }[]
  labels: string[]
  yFormat?: (v: number) => string
  height?: number
}) {
  const W = 600
  const H = height
  const padL = 38
  const padR = 12
  const padT = 14
  const padB = 24
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const allVals = series.flatMap((s) => s.data).filter((v) => !isNaN(v))
  if (allVals.length === 0) return null

  const dataMin = Math.min(0, ...allVals)
  const dataMax = Math.max(...allVals) * 1.1 || 1
  const range = dataMax - dataMin || 1

  const n = labels.length

  const xPos = (i: number) => padL + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2)
  const yPos = (v: number) => padT + innerH - ((v - dataMin) / range) * innerH

  const toPath = (data: number[]) => {
    if (!data.length) return ''
    let d = `M ${xPos(0).toFixed(1)} ${yPos(data[0]).toFixed(1)}`
    for (let i = 1; i < data.length; i++) {
      const x0 = xPos(i - 1)
      const y0 = yPos(data[i - 1])
      const x1 = xPos(i)
      const y1 = yPos(data[i])
      const cx = (x0 + x1) / 2
      d += ` C ${cx.toFixed(1)} ${y0.toFixed(1)}, ${cx.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`
    }
    return d
  }

  const gridY = 4
  const yTicks = Array.from({ length: gridY + 1 }, (_, i) => dataMin + (i / gridY) * range)

  // Show at most 7 x-labels evenly
  const labelStep = Math.ceil(n / 7)

  return (
    <div className="lb-lc-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL} x2={W - padR}
              y1={yPos(t)} y2={yPos(t)}
              stroke="rgba(15,23,42,0.06)" strokeDasharray="3 4"
            />
            <text
              x={padL - 6} y={yPos(t) + 3}
              textAnchor="end" fontSize="10"
              fill="#9AA3B2"
              fontFamily="JetBrains Mono, monospace"
            >
              {yFormat(Math.round(t * 10) / 10)}
            </text>
          </g>
        ))}
        {labels.map((d, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <text
              key={i} x={xPos(i)} y={H - 6}
              textAnchor="middle" fontSize="10" fill="#9AA3B2"
            >
              {d}
            </text>
          ) : null
        )}
        {series.map((s) => (
          <g key={s.name}>
            <path
              d={toPath(s.data)}
              fill="none" stroke={s.color}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              opacity="0.95"
            />
            {s.data.length > 0 && (
              <circle
                cx={xPos(s.data.length - 1)}
                cy={yPos(s.data[s.data.length - 1])}
                r="3" fill={s.color}
              />
            )}
          </g>
        ))}
      </svg>
      <div className="lb-lc-legend">
        {series.map((s) => (
          <span key={s.name}>
            <span className="lb-dot" style={{ background: s.color }} />
            {s.name}
            <span className="lb-mono lb-muted" style={{ marginLeft: 5 }}>
              {yFormat(s.data[s.data.length - 1] ?? 0)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

interface ChartCardProps {
  title: string
  sub: string
  badgeText?: string
  badgeKind?: 'pos' | 'neg'
  insight?: string
  insightKind?: 'ok' | 'warn' | 'info'
  children: React.ReactNode
}

function ChartCard({ title, sub, badgeText, badgeKind, insight, insightKind = 'warn', children }: ChartCardProps) {
  return (
    <div className="lb-glass lb-card">
      <div className="lb-card-head">
        <div>
          <div className="lb-card-title">{title}</div>
          <div className="lb-card-sub">{sub}</div>
        </div>
        {badgeText && (
          <span className={`lb-card-badge ${badgeKind === 'neg' ? 'lb-neg' : 'lb-pos'}`}>
            {badgeText}
          </span>
        )}
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
      {insight && (
        <div className={`lb-insight lb-${insightKind}`}>
          {insightKind === 'ok'
            ? <OkIcon style={{ flexShrink: 0, marginTop: 2 }} />
            : <WarnIcon style={{ flexShrink: 0, marginTop: 2 }} />}
          <div>{insight}</div>
        </div>
      )}
    </div>
  )
}

function buildSeries(
  counters: CounterBehaviorTimeline[],
  key: keyof Pick<CounterBehaviorTimeline['timeline'][0], 'bounce_rate' | 'return_rate' | 'depth' | 'avg_time'>,
) {
  const top = counters.slice(0, 5)
  return {
    series: top.map((c, i) => ({
      name: c.counter_name,
      color: LINE_COLORS[i % LINE_COLORS.length],
      data: c.timeline.map((p) => Number(p[key]) || 0),
    })),
    labels: top[0]?.timeline.map((p) => {
      const d = new Date(p.date)
      return `${d.getDate()} ${d.toLocaleString('ru', { month: 'short' }).replace('.', '')}`
    }) ?? [],
  }
}

function bounceInsight(counters: CounterBehaviorTimeline[]): string | undefined {
  const high = counters.filter((c) => c.current_bounce_rate > 40)
  if (high.length === 0) return undefined
  const names = high
    .sort((a, b) => b.current_bounce_rate - a.current_bounce_rate)
    .slice(0, 2)
    .map((c) => `«${c.counter_name}»`)
    .join(' и ')
  return `Высокий показатель отказов на ${names}. Проверьте релевантность контента и улучшите навигацию.`
}

function returnInsight(counters: CounterBehaviorTimeline[]): { text: string; kind: 'ok' | 'warn' } | undefined {
  const stable = counters.filter((c) => c.current_return_rate > 0.5)
  if (stable.length > 0) {
    const name = stable[0].counter_name
    return { text: `Стабильный возврат на «${name}» — пользователи возвращаются за справкой и подборками.`, kind: 'ok' }
  }
  return undefined
}

function depthInsight(counters: CounterBehaviorTimeline[]): string | undefined {
  const low = counters.filter((c) => c.current_depth < 2)
  if (low.length === 0) return undefined
  const name = low[0].counter_name
  return `Низкая глубина на «${name}». Рекомендуем добавить внутренние ссылки и улучшить навигацию между разделами.`
}

function timeInsight(counters: CounterBehaviorTimeline[]): { text: string; kind: 'ok' | 'warn' } | undefined {
  const good = counters.filter((c) => c.current_avg_time > 100)
  if (good.length > 0) {
    return { text: 'Достаточное время на сайте: пользователи находят нужную информацию и уделяют время изучению.', kind: 'ok' }
  }
  return undefined
}

export default function BehaviorCharts({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="lb-grid-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="lb-glass lb-card" style={{ minHeight: 260 }}>
            <div style={{ color: 'var(--ink-4)', fontSize: 14 }}>Загрузка…</div>
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.counters.length === 0) {
    return (
      <p style={{ fontSize: 14, color: 'var(--ink-4)', textAlign: 'center', padding: '32px 0' }}>
        Нет данных о поведении
      </p>
    )
  }

  const { counters } = data

  const bounce = buildSeries(counters, 'bounce_rate')
  const ret = buildSeries(counters, 'return_rate')
  const depth = buildSeries(counters, 'depth')
  const avgTime = buildSeries(counters, 'avg_time')

  const bounceHint = bounceInsight(counters)
  const returnHint = returnInsight(counters)
  const depthHint = depthInsight(counters)
  const timeHint = timeInsight(counters)

  const maxBounce = counters.reduce((best, c) =>
    c.current_bounce_rate > (best?.current_bounce_rate ?? 0) ? c : best
  , counters[0])

  const maxDepth = counters.reduce((best, c) =>
    c.current_depth > (best?.current_depth ?? 0) ? c : best
  , counters[0])

  const maxTime = counters.reduce((best, c) =>
    c.current_avg_time > (best?.current_avg_time ?? 0) ? c : best
  , counters[0])

  return (
    <div className="lb-grid-2">
      <ChartCard
        title="Показатель отказов"
        sub="Доля визитов с одной страницей, %"
        badgeText={`${maxBounce?.current_bounce_rate?.toFixed(1)}% макс`}
        badgeKind="neg"
        insight={bounceHint}
        insightKind="warn"
      >
        <SvgLineChart
          series={bounce.series}
          labels={bounce.labels}
          yFormat={(v) => `${v}%`}
        />
      </ChartCard>

      <ChartCard
        title="Показатель возвратов"
        sub="Доля пользователей, вернувшихся в течение периода"
        badgeText={returnHint ? `${counters[0]?.current_return_rate?.toFixed(2)} средний` : undefined}
        badgeKind="pos"
        insight={returnHint?.text}
        insightKind={returnHint?.kind ?? 'ok'}
      >
        <SvgLineChart
          series={ret.series}
          labels={ret.labels}
          yFormat={(v) => `${v}`}
        />
      </ChartCard>

      <ChartCard
        title="Глубина просмотра"
        sub="Среднее количество страниц за визит"
        badgeText={maxDepth ? `${maxDepth.current_depth?.toFixed(2)} стр ${maxDepth.counter_name}` : undefined}
        badgeKind="pos"
        insight={depthHint}
        insightKind="warn"
      >
        <SvgLineChart
          series={depth.series}
          labels={depth.labels}
          yFormat={(v) => `${v}`}
        />
      </ChartCard>

      <ChartCard
        title="Среднее время на сайте"
        sub="В секундах, по последнему дню периода"
        badgeText={maxTime ? `${Math.round(maxTime.current_avg_time)}с ${maxTime.counter_name}` : undefined}
        badgeKind="pos"
        insight={timeHint?.text}
        insightKind={timeHint?.kind ?? 'ok'}
      >
        <SvgLineChart
          series={avgTime.series}
          labels={avgTime.labels}
          yFormat={(v) => `${v}с`}
        />
      </ChartCard>
    </div>
  )
}
