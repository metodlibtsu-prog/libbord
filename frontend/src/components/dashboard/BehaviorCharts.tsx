import type { BehaviorData } from '@/types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import MetricMiniChart from './MetricMiniChart'

interface Props {
  data?: BehaviorData
  isLoading: boolean
}

export default function BehaviorCharts({ data, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />
  if (!data || data.counters.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Нет данных о поведении</p>
  }

  return (
    <div className="space-y-4">
      {/* Grid 2x2 для графиков */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricMiniChart
          title="Показатель отказов"
          metricKey="bounce_rate"
          counters={data.counters}
          unit="%"
        />
        <MetricMiniChart
          title="Показатель возвратов"
          metricKey="return_rate"
          counters={data.counters}
          unit="%"
        />
        <MetricMiniChart
          title="Глубина просмотра страниц"
          metricKey="depth"
          counters={data.counters}
          unit=" стр"
        />
        <MetricMiniChart
          title="Среднее время на сайте"
          metricKey="avg_time"
          counters={data.counters}
          unit=" сек"
        />
      </div>
    </div>
  )
}
