import { usePeriod } from '@/context/PeriodContext'
import { useTheme } from '@/context/ThemeContext'

export default function DateRangePicker() {
  const { customFrom, customTo, setCustomFrom, setCustomTo } = usePeriod()
  const { isDark } = useTheme()
  const hasRange = customFrom && customTo

  const inputClass =
    'w-[130px] px-3 py-1.5 rounded-lg border border-dark-border bg-dark-card text-dark-text text-sm ' +
    'hover:border-gradient-cyan focus:border-gradient-cyan focus:outline-none focus:ring-2 ' +
    'focus:ring-gradient-cyan/20 transition-all duration-300 cursor-pointer'

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={customFrom}
        onChange={(e) => setCustomFrom(e.target.value)}
        className={inputClass}
        style={{ colorScheme: isDark ? 'dark' : 'light' }}
      />
      <span className="text-dark-text-secondary text-xs">—</span>
      <input
        type="date"
        value={customTo}
        min={customFrom || undefined}
        onChange={(e) => setCustomTo(e.target.value)}
        className={inputClass}
        style={{ colorScheme: isDark ? 'dark' : 'light' }}
      />
      {hasRange && (
        <button
          onClick={() => { setCustomFrom(''); setCustomTo('') }}
          className="p-1.5 rounded-lg border border-dark-border text-dark-text-secondary hover:text-dark-text hover:border-gradient-cyan transition-all duration-300 text-xs leading-none"
          title="Сбросить диапазон"
        >
          ×
        </button>
      )}
    </div>
  )
}
