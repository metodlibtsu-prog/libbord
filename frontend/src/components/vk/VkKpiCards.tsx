import { formatNumber, formatDelta } from '@/utils/formatters'
import type { VkKpi } from '@/types'

interface Props {
  kpis: VkKpi
}

interface MiniCardProps {
  label: string
  value: number
  delta?: number | null
}

function MiniCard({ label, value, delta }: MiniCardProps) {
  const dir = delta != null ? (delta > 0.1 ? 'pos' : delta < -0.1 ? 'neg' : 'flat') : null
  return (
    <div className="lb-glass lb-kpi-mini">
      <div className="lb-label">{label}</div>
      <div className="lb-val lb-mono">{formatNumber(value)}</div>
      {delta != null && (
        <div
          className="lb-sub"
          style={{
            color: dir === 'pos' ? 'var(--pos)' : dir === 'neg' ? 'var(--neg)' : 'var(--ink-3)',
          }}
        >
          {delta > 0 ? '+' : ''}{formatDelta(delta)} к пред. периоду
        </div>
      )}
    </div>
  )
}

export default function VkKpiCards({ kpis }: Props) {
  return (
    <div className="lb-grid-4">
      <MiniCard label="Подписчики" value={kpis.subscribers} delta={kpis.subscribers_delta_pct} />
      <MiniCard label="Лайки" value={(kpis as any).likes ?? 0} />
      <MiniCard label="Репосты" value={kpis.reposts} />
      <MiniCard label="Комментарии" value={kpis.comments} />
    </div>
  )
}
