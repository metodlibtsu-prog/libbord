import type { KpiOverview } from '@/types'
import KpiCard from './KpiCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface Props {
  data?: KpiOverview
  isLoading: boolean
}

export default function KpiCards({ data, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />
  if (!data) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KpiCard title="Просмотры" value={data.views} delta={data.views_delta_pct} />
      <KpiCard title="Визиты" value={data.visits} delta={data.visits_delta_pct} />
      <KpiCard title="Уникальные посетители" value={data.users} delta={data.users_delta_pct} />
    </div>
  )
}
