import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PeriodSelector from '@/components/common/PeriodSelector'
import DateRangePicker from '@/components/common/DateRangePicker'
import Logo from '@/components/common/Logo'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

interface Props {
  libraryName: string
}

export default function Header({ libraryName }: Props) {
  const { session } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card sticky top-0 z-50 border-b border-dark-border"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold gradient-text">Libboard</h1>
              <p className="text-sm text-dark-text-secondary">{libraryName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg border border-dark-border hover:border-gradient-cyan text-dark-text-secondary hover:text-gradient-cyan transition-all duration-300"
              aria-label="Переключить тему"
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}
            >
              {isDark ? (
                /* Sun icon */
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l.707.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                /* Moon icon */
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </motion.button>

            <PeriodSelector />
            <DateRangePicker />

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
