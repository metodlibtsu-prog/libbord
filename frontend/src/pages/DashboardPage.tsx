import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCounters, fetchLibraries } from '@/api/dashboard'
import Header from '@/components/layout/Header'
import KpiCards from '@/components/dashboard/KpiCards'
import ChannelChart from '@/components/dashboard/ChannelChart'
import BehaviorCharts from '@/components/dashboard/BehaviorCharts'
import ReviewsList from '@/components/dashboard/ReviewsList'
import InsightBanner from '@/components/dashboard/InsightBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import VkKpiCards from '@/components/vk/VkKpiCards'
import VkReachChart from '@/components/vk/VkReachChart'
import VkContentChart from '@/components/vk/VkContentChart'
import GeoReviewsSection from '@/components/dashboard/GeoReviewsSection'
import {
  useBehavior,
  useChannels,
  useInsights,
  useOverview,
  useReviews,
  useVkStats,
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
  const reviews = useReviews(libraryId)
  const insights = useInsights(libraryId, selectedCounter)
  const vkStats = useVkStats(libraryId)

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

        {/* Block 4: VK Stats */}
        {vkStats.data && !vkStats.isLoading && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">ВКонтакте</h2>
            <VkKpiCards kpis={vkStats.data.kpis} />
            {vkStats.data.insights && vkStats.data.insights.length > 0 && (
              <div className="mt-4">
                <InsightBanner insights={vkStats.data.insights} block="vk" />
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <VkReachChart data={vkStats.data.reach_trend} />
              <VkContentChart data={vkStats.data.content_trend} />
            </div>
          </section>
        )}

        {/* Block 5: Geo-service Reviews */}
        <section>
          <GeoReviewsSection />
        </section>

        {/* Block 6: Reviews */}
        <section>
          <ReviewsList data={reviews.data} isLoading={reviews.isLoading} />
        </section>
      </main>
    </div>
  )
}
