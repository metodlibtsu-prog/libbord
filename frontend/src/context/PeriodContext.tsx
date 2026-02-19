import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Period } from '@/types'

interface PeriodContextValue {
  period: Period
  setPeriod: (p: Period) => void
}

const PeriodContext = createContext<PeriodContextValue>({
  period: 'week',
  setPeriod: () => {},
})

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('week')
  return (
    <PeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  return useContext(PeriodContext)
}
