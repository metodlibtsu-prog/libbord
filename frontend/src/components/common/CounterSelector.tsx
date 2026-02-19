import type { MetricCounter } from '@/types'

interface Props {
  counters: MetricCounter[]
  selected: string | undefined
  onChange: (id: string | undefined) => void
}

export default function CounterSelector({ counters, selected, onChange }: Props) {
  if (counters.length <= 1) return null

  return (
    <div className="relative">
      <select
        value={selected || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="appearance-none px-4 py-2 pr-10 rounded-lg border border-dark-border bg-dark-card text-dark-text text-sm font-medium hover:border-gradient-cyan focus:border-gradient-cyan focus:outline-none focus:ring-2 focus:ring-gradient-cyan/20 transition-all duration-300 cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2300D4FF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
        }}
      >
        <option value="" className="bg-dark-card text-dark-text">
          Все счётчики
        </option>
        {counters.map((c) => (
          <option key={c.id} value={c.id} className="bg-dark-card text-dark-text">
            {c.name}
          </option>
        ))}
      </select>
    </div>
  )
}
