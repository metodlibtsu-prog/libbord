import PeriodSelector from '@/components/common/PeriodSelector'
import CounterSelector from '@/components/common/CounterSelector'
import type { MetricCounter } from '@/types'

interface Props {
  libraryName: string
  counters: MetricCounter[]
  selectedCounter: string | undefined
  onCounterChange: (id: string | undefined) => void
}

export default function Header({ libraryName, counters, selectedCounter, onCounterChange }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Libbord</h1>
            <p className="text-sm text-gray-500">{libraryName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector />
            <CounterSelector
              counters={counters}
              selected={selectedCounter}
              onChange={onCounterChange}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
