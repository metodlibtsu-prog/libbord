import type { ChannelMetric, ChannelType } from '@/types'
import { CHANNEL_LABELS } from '@/utils/colors'
import { formatNumber } from '@/utils/formatters'

interface Props {
  data?: ChannelMetric[]
  isLoading: boolean
  title?: string
}

export default function ChannelChart({ data, isLoading, title = 'Цифровые ресурсы' }: Props) {
  if (isLoading) {
    return (
      <div className="lb-glass lb-card">
        <div className="lb-card-title">{title}</div>
        <div style={{ marginTop: 20, color: 'var(--ink-4)', fontSize: 14 }}>Загрузка…</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="lb-glass lb-card">
        <div className="lb-card-title">{title}</div>
        <p style={{ fontSize: 14, color: 'var(--ink-4)', marginTop: 16 }}>Нет данных по ресурсам</p>
      </div>
    )
  }

  const filtered = data
    .filter((ch) => ch.channel_type !== 'vk' && (ch.views > 0 || ch.visits > 0))
    .sort((a, b) => b.views - a.views)

  const max = Math.max(...filtered.map((r) => Math.max(r.views, r.visits)), 1)

  return (
    <div className="lb-glass lb-card">
      <div className="lb-card-head">
        <div>
          <div className="lb-card-title">{title}</div>
          <div className="lb-card-sub">Просмотры и визиты по источникам трафика</div>
        </div>
        <div className="lb-legend">
          <span className="lb-legend-dot lb-views">Просмотры</span>
          <span className="lb-legend-dot lb-visits">Визиты</span>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {filtered.map((r) => {
          const name = r.custom_name || CHANNEL_LABELS[r.channel_type as ChannelType] || r.channel_type
          return (
            <div className="lb-bar-row" key={r.channel_id.toString()}>
              <div className="lb-bar-name">{name}</div>
              <div className="lb-bar-stack">
                <div
                  className="lb-bar lb-views"
                  style={{ width: `${(r.views / max) * 100}%` }}
                  title={`Просмотры: ${formatNumber(r.views)}`}
                />
                <div
                  className="lb-bar lb-visits"
                  style={{ width: `${(r.visits / max) * 100}%` }}
                  title={`Визиты: ${formatNumber(r.visits)}`}
                />
              </div>
              <div className="lb-bar-val">{formatNumber(r.views)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
