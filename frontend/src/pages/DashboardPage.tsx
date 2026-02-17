import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCounters, fetchLibraries } from '@/api/dashboard'
import Header from '@/components/layout/Header'
import KpiCards from '@/components/dashboard/KpiCards'
import ChannelChart from '@/components/dashboard/ChannelChart'
import BehaviorCharts from '@/components/dashboard/BehaviorCharts'
import EngagementCharts from '@/components/dashboard/EngagementCharts'
import ReviewsList from '@/components/dashboard/ReviewsList'
import InsightBanner from '@/components/dashboard/InsightBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import {
  useBehavior,
  useChannels,
  useEngagement,
  useInsights,
  useOverview,
  useReviews,
} from '@/hooks/useDashboardData'

export default function DashboardPage() {
  const [selectedCounter, setSelectedCounter] = useState<string | undefined>()

  const { data: libraries, isLoading: libLoading } = useQuery({
    queryKey: ['libraries'],
    queryFn: fetchLibraries,
  })

  const libraryId = libraries?.[0]?.id || ''
  const libraryName = libraries?.[0]?.name || 'Libbord'

  const { data: counters } = useQuery({
    queryKey: ['counters', libraryId],
    queryFn: () => fetchCounters(libraryId),
    enabled: !!libraryId,
  })

  const overview = useOverview(libraryId, selectedCounter)
  const channels = useChannels(libraryId)
  const behavior = useBehavior(libraryId, selectedCounter)
  const engagement = useEngagement(libraryId)
  const reviews = useReviews(libraryId)
  const insights = useInsights(libraryId, selectedCounter)

  if (libLoading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        libraryName={libraryName}
        counters={counters || []}
        selectedCounter={selectedCounter}
        onCounterChange={setSelectedCounter}
      />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Block 1: KPI Overview */}
        <section>
          <KpiCards data={overview.data} isLoading={overview.isLoading} />
          {insights.data && <InsightBanner insights={insights.data} block="overview" />}
        </section>

        {/* Block 2: Channels */}
        <section>
          <ChannelChart data={channels.data} isLoading={channels.isLoading} />
          {insights.data && <InsightBanner insights={insights.data} block="channels" />}
        </section>

        {/* Block 3: User Behavior */}
        <section>
          <BehaviorCharts data={behavior.data} isLoading={behavior.isLoading} />
        </section>

        {/* Block 4: Engagement & Reviews */}
        <section>
          <EngagementCharts data={engagement.data} isLoading={engagement.isLoading} />
          {insights.data && <InsightBanner insights={insights.data} block="engagement" />}
        </section>

        <section>
          <ReviewsList data={reviews.data} isLoading={reviews.isLoading} />
        </section>
      </main>
    </div>
  )
}
