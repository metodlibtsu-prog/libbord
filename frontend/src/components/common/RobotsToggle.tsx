import clsx from 'clsx'
import { useRobots } from '@/context/RobotsContext'

export default function RobotsToggle() {
  const { excludeRobots, setExcludeRobots } = useRobots()

  return (
    <div className="flex gap-1 rounded-full border border-dark-border overflow-hidden">
      <button
        onClick={() => setExcludeRobots(true)}
        className={clsx(
          'px-3 py-1.5 text-xs font-medium transition-all duration-200',
          excludeRobots
            ? 'bg-gradient-premium text-white'
            : 'text-dark-text-secondary hover:text-dark-text',
        )}
        title="Данные без учёта роботов и ботов"
      >
        Без роботов
      </button>
      <button
        onClick={() => setExcludeRobots(false)}
        className={clsx(
          'px-3 py-1.5 text-xs font-medium transition-all duration-200',
          !excludeRobots
            ? 'bg-gradient-premium text-white'
            : 'text-dark-text-secondary hover:text-dark-text',
        )}
        title="Данные включая роботов и ботов"
      >
        С роботами
      </button>
    </div>
  )
}
