import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Period } from '@/types'

interface PeriodContextValue {
  period: Period
  setPeriod: (p: Period) => void
  customFrom: string
  customTo: string
  setCustomFrom: (d: string) => void
  setCustomTo: (d: string) => void
}

const PeriodContext = createContext<PeriodContextValue>({
  period: 'week',
  setPeriod: () => {},
  customFrom: '',
  customTo: '',
  setCustomFrom: () => {},
  setCustomTo: () => {},
})

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  return (
    <PeriodContext.Provider value={{ period, setPeriod, customFrom, customTo, setCustomFrom, setCustomTo }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  return useContext(PeriodContext)
}
