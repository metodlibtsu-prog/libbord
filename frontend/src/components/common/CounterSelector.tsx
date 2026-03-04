import { useRef, useState, useEffect } from 'react'
import clsx from 'clsx'
import { usePeriod } from '@/context/PeriodContext'
import type { MetricCounter } from '@/types'

interface Props {
  counters: MetricCounter[]
}

export default function CounterSelector({ counters }: Props) {
  const { counterId, setCounterId } = usePeriod()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = counters.find((c) => c.id === counterId)
  const label = selected ? selected.name : 'Все источники'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (counters.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200',
          counterId
            ? 'bg-gradient-premium text-white border-transparent shadow-premium'
            : 'border-dark-border text-dark-text-secondary hover:text-dark-text hover:border-gradient-cyan bg-dark-card',
        )}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
        </svg>
        <span className="max-w-[120px] truncate">{label}</span>
        <svg
          className={clsx('w-3 h-3 transition-transform duration-200', open && 'rotate-180')}
          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 glass-card rounded-xl border border-dark-border shadow-lg py-1 min-w-[180px]">
          <button
            onClick={() => { setCounterId(''); setOpen(false) }}
            className={clsx(
              'w-full text-left px-4 py-2 text-sm transition-colors duration-150',
              !counterId ? 'text-dark-text font-medium' : 'text-dark-text-secondary hover:text-dark-text',
            )}
          >
            Все источники
          </button>
          {counters.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCounterId(c.id); setOpen(false) }}
              className={clsx(
                'w-full text-left px-4 py-2 text-sm transition-colors duration-150',
                counterId === c.id ? 'text-dark-text font-medium' : 'text-dark-text-secondary hover:text-dark-text',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
