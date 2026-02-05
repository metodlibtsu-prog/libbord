import type { MetricCounter } from '@/types'

interface Props {
  counters: MetricCounter[]
  selected: string | undefined
  onChange: (id: string | undefined) => void
}

export default function CounterSelector({ counters, selected, onChange }: Props) {
  if (counters.length <= 1) return null

  return (
    <select
      value={selected || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700"
    >
      <option value="">Все счётчики</option>
      {counters.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
