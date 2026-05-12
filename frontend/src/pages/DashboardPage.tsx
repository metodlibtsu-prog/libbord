import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCounters, fetchLibraries } from '@/api/dashboard'
import Header from '@/components/layout/Header'
import KpiCards from '@/components/dashboard/KpiCards'
import ChannelChart from '@/components/dashboard/ChannelChart'
import BehaviorCharts from '@/components/dashboard/BehaviorCharts'
import ReviewsList from '@/components/dashboard/ReviewsList'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ScrollToTop from '@/components/common/ScrollToTop'
import VkKpiCards from '@/components/vk/VkKpiCards'
import VkReachChart from '@/components/vk/VkReachChart'
import VkContentChart from '@/components/vk/VkContentChart'
import AiDrawer from '@/components/ai/AiDrawer'
import { usePeriod } from '@/context/PeriodContext'
import {
  useBehavior,
  useChannels,
  useOverview,
  useReviews,
  useVkStats,
} from '@/hooks/useDashboardData'

export default function DashboardPage() {
  const { counterId } = usePeriod()
  const [aiOpen, setAiOpen] = useState(false)

  const { data: libraries, isLoading: libLoading } = useQuery({
    queryKey: ['libraries'],
    queryFn: fetchLibraries,
  })

  const libraryId = libraries?.[0]?.id || ''
  const libraryName = libraries?.[0]?.name || 'Libboard'

  const { data: counters } = useQuery({
    queryKey: ['counters', libraryId],
    queryFn: () => fetchCounters(libraryId),
    enabled: !!libraryId,
  })

  const overview = useOverview(libraryId)
  const channels = useChannels(libraryId)
  const behavior = useBehavior(libraryId)
  const reviews = useReviews(libraryId)
  const vkStats = useVkStats(libraryId)

  const isFiltered = !!counterId

  if (libLoading) return <LoadingSpinner />

  return (
    <>
      <div className="bg-mesh" />

      <div className="lb-app">
        <Header
          libraryName={libraryName}
          counters={counters || []}
          onOpenAI={() => setAiOpen((o) => !o)}
          aiOpen={aiOpen}
        />

        {/* Block 1: KPI Pulse */}
        <KpiCards data={overview.data} isLoading={overview.isLoading} />

        {/* Block 2: Channels */}
        <div className="lb-section">
          <ChannelChart
            data={channels.data}
            isLoading={channels.isLoading}
            title={counterId ? (counters?.find((c) => c.id === counterId)?.name ?? 'Цифровые ресурсы') : 'Цифровые ресурсы'}
          />
        </div>

        {/* Block 3: User Behavior */}
        <div className="lb-section">
          <div className="lb-section-head">
            <div className="lb-h2">Поведение пользователей</div>
          </div>
          <BehaviorCharts data={behavior.data} isLoading={behavior.isLoading} />
        </div>

        {/* Block 4: VK Stats */}
        {!isFiltered && vkStats.data && !vkStats.isLoading && (
          <div className="lb-section">
            <div className="lb-section-head">
              <div className="lb-h2">ВКонтакте</div>
            </div>
            <VkKpiCards kpis={vkStats.data.kpis} />
            {vkStats.data.reach_trend && vkStats.data.reach_trend.length > 0 && (
              <div className="lb-grid-2" style={{ marginTop: 18 }}>
                <VkReachChart data={vkStats.data.reach_trend} />
                <VkContentChart data={vkStats.data.content_trend} />
              </div>
            )}
          </div>
        )}

        {/* Block 5: Reviews */}
        {!isFiltered && (
          <div className="lb-section">
            <div className="lb-section-head">
              <div className="lb-h2">Отзывы</div>
            </div>
            <ReviewsList data={reviews.data} isLoading={reviews.isLoading} />
          </div>
        )}
      </div>

      <AiDrawer open={aiOpen} onClose={() => setAiOpen(false)} libraryId={libraryId} />
      <ScrollToTop />
    </>
  )
}
