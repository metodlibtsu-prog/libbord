import { usePeriod } from '@/context/PeriodContext'
import type { Period } from '@/types'
import clsx from 'clsx'

const periods: { value: Period; label: string }[] = [
  { value: 'today', label: 'Сегодня' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
]

export default function PeriodSelector() {
  const { period, setPeriod } = usePeriod()

  return (
    <div className="flex gap-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => setPeriod(p.value)}
          className={clsx(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
            period === p.value
              ? 'bg-gradient-premium text-white shadow-premium'
              : 'bg-dark-card text-dark-text-secondary hover:text-dark-text hover:border-gradient-cyan border border-dark-border',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
