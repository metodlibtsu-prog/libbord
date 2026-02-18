import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PeriodSelector from '@/components/common/PeriodSelector'
import CounterSelector from '@/components/common/CounterSelector'
import { useAuth } from '@/context/AuthContext'
import type { MetricCounter } from '@/types'

interface Props {
  libraryName: string
  counters: MetricCounter[]
  selectedCounter: string | undefined
  onCounterChange: (id: string | undefined) => void
}

export default function Header({ libraryName, counters, selectedCounter, onCounterChange }: Props) {
  const { session } = useAuth()

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card sticky top-0 z-50 border-b border-dark-border"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold gradient-text">Libboard</h1>
            <p className="text-sm text-dark-text-secondary">{libraryName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector />
            <CounterSelector
              counters={counters}
              selected={selectedCounter}
              onChange={onCounterChange}
            />
            {session ? (
              <Link
                to="/admin"
                className="ml-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-premium rounded-md hover:shadow-glow-cyan transition-all duration-300"
              >
                Админ-панель
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="ml-2 px-3 py-1.5 text-sm font-medium text-dark-text border border-dark-border rounded-md hover:border-gradient-cyan transition-all duration-300"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
