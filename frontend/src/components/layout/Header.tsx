import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeriod } from '@/context/PeriodContext'
import { useRobots } from '@/context/RobotsContext'
import { useAuth } from '@/context/AuthContext'
import type { MetricCounter, Period } from '@/types'
import {
  ArrowIcon,
  CalendarIcon,
  ChevronIcon,
  FilterIcon,
  SparklesIcon,
} from '@/components/common/Icons'

const PERIODS: { id: Exclude<Period, 'custom'>; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: 'yesterday', label: 'Вчера' },
  { id: 'week', label: '7 дней' },
  { id: 'month', label: '30 дней' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'year', label: 'Год' },
]

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, open: boolean) {
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, ref])
}

interface Props {
  libraryName: string
  counters?: MetricCounter[]
  onOpenAI: () => void
  aiOpen: boolean
}

export default function Header({ libraryName, counters = [], onOpenAI, aiOpen }: Props) {
  const { period, setPeriod, customFrom, customTo, setCustomFrom, setCustomTo, counterId, setCounterId } = usePeriod()
  const { excludeRobots, setExcludeRobots } = useRobots()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [periodOpen, setPeriodOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(customFrom)
  const [draftTo, setDraftTo] = useState(customTo)

  const periodRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  useClickOutside(periodRef, () => setPeriodOpen(false), periodOpen)
  useClickOutside(filterRef, () => setFilterOpen(false), filterOpen)

  const activeFilterCount =
    (excludeRobots ? 0 : 1) + (counterId ? 1 : 0)

  const applyCustomPeriod = () => {
    if (draftFrom && draftTo) {
      setCustomFrom(draftFrom)
      setCustomTo(draftTo)
      setPeriod('custom')
      setPeriodOpen(false)
    }
  }

  const periodLabel =
    period === 'custom' && customFrom && customTo
      ? `${customFrom} – ${customTo}`
      : 'Период'

  return (
    <div className="lb-topbar lb-glass-strong">
      {/* Brand */}
      <div className="lb-brand">
        <div className="lb-brand-mark">Lb</div>
        <div>
          <div className="lb-brand-name">Libboard</div>
          <div className="lb-brand-sub">{libraryName}</div>
        </div>
      </div>

      {/* Segmented period */}
      <div className="lb-seg" style={{ position: 'relative' }} ref={periodRef}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            className={period === p.id ? 'lb-active' : ''}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
        <button
          className={period === 'custom' ? 'lb-active' : ''}
          onClick={() => setPeriodOpen((o) => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <CalendarIcon style={{ width: 13, height: 13 }} />
          {periodLabel}
        </button>

        {periodOpen && (
          <div className="lb-popover lb-glass-strong lb-right">
            <div className="lb-eyebrow" style={{ marginBottom: 10 }}>Произвольный период</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="lb-small lb-muted" style={{ display: 'block', marginBottom: 4 }}>с</label>
                <input
                  type="date"
                  className="lb-input"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="lb-small lb-muted" style={{ display: 'block', marginBottom: 4 }}>по</label>
                <input
                  type="date"
                  className="lb-input"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="lb-pill lb-ghost" onClick={() => setPeriodOpen(false)}>Отмена</button>
              <button
                className="lb-pill lb-accent"
                onClick={applyCustomPeriod}
                disabled={!draftFrom || !draftTo}
              >
                Применить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters popover */}
      <div style={{ position: 'relative' }} ref={filterRef}>
        <button className="lb-pill" onClick={() => setFilterOpen((o) => !o)}>
          <FilterIcon style={{ width: 13, height: 13 }} />
          Фильтры
          {activeFilterCount > 0 && (
            <span
              className="lb-mono"
              style={{
                background: 'var(--accent)',
                color: 'white',
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 6,
                marginLeft: 2,
              }}
            >
              {activeFilterCount}
            </span>
          )}
          <ChevronIcon style={{ width: 12, height: 12, opacity: 0.6 }} />
        </button>

        {filterOpen && (
          <div className="lb-popover lb-glass-strong" style={{ minWidth: 340 }}>
            <div className="lb-eyebrow" style={{ marginBottom: 8 }}>Трафик</div>
            <div className="lb-seg" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <button
                className={excludeRobots ? 'lb-active' : ''}
                onClick={() => setExcludeRobots(true)}
              >
                Только люди
              </button>
              <button
                className={!excludeRobots ? 'lb-active' : ''}
                onClick={() => setExcludeRobots(false)}
              >
                Все посещения
              </button>
            </div>

            {counters.length > 0 && (
              <>
                <div
                  className="lb-eyebrow"
                  style={{
                    marginTop: 16,
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>Счётчик Яндекс.Метрики</span>
                  {counterId && (
                    <button
                      onClick={() => setCounterId('')}
                      style={{
                        appearance: 'none',
                        border: 0,
                        background: 'transparent',
                        color: 'var(--accent)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Сбросить
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {counters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCounterId(counterId === c.id ? '' : c.id)}
                      className="lb-pill"
                      style={{
                        fontSize: 12,
                        padding: '5px 10px',
                        ...(counterId === c.id
                          ? {
                              background: 'var(--accent-soft)',
                              borderColor: 'var(--accent)',
                              color: 'var(--accent)',
                            }
                          : {}),
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="lb-spacer" />

      {/* AI button */}
      <button
        className="lb-pill"
        onClick={onOpenAI}
        style={{
          background: aiOpen
            ? 'var(--ink-0)'
            : 'linear-gradient(135deg, rgba(49,70,230,0.08), rgba(14,165,165,0.08))',
          borderColor: aiOpen ? 'var(--ink-0)' : 'rgba(49,70,230,0.25)',
          color: aiOpen ? 'white' : 'var(--accent)',
          fontWeight: 700,
          padding: '8px 14px',
        }}
      >
        <SparklesIcon style={{ width: 14, height: 14 }} />
        AI-аналитик
      </button>

      {/* Admin link */}
      <button
        className="lb-pill lb-ghost"
        onClick={() => navigate(session ? '/admin' : '/admin/login')}
        style={{ padding: '8px 14px' }}
      >
        Админ-панель
        <ArrowIcon style={{ width: 12, height: 12, opacity: 0.55 }} />
      </button>
    </div>
  )
}
