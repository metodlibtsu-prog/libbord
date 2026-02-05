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
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            period === p.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
