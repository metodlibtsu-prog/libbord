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
import ScrollToTop from '@/components/common/ScrollToTop'
import VkKpiCards from '@/components/vk/VkKpiCards'
import VkReachChart from '@/components/vk/VkReachChart'
import VkContentChart from '@/components/vk/VkContentChart'
import { useTheme } from '@/context/ThemeContext'
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
  const { isDark } = useTheme()

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

  const overview  = useOverview(libraryId, selectedCounter)
  const channels  = useChannels(libraryId)
  const behavior  = useBehavior(libraryId, selectedCounter)
  const reviews   = useReviews(libraryId)
  const insights  = useInsights(libraryId, selectedCounter)
  const vkStats   = useVkStats(libraryId)

  if (libLoading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-dark-bg relative">
      {/* Animated background gradient — dark only (Tailwind gradient vars don't remap via CSS) */}
      {isDark && (
        <div className="fixed inset-0 bg-gradient-to-br from-dark-bg via-dark-bg to-dark-card opacity-50 pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative z-10">
        <Header
          libraryName={libraryName}
          counters={counters || []}
          selectedCounter={selectedCounter}
          onCounterChange={setSelectedCounter}
        />
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">

          <h2 className="text-2xl font-semibold text-dark-text tracking-tight">Цифровые сервисы библиотеки</h2>

          {/* Block 1: KPI Overview */}
          <section className="space-y-4">
            <KpiCards data={overview.data} isLoading={overview.isLoading} />
            {insights.data && <InsightBanner insights={insights.data} block="overview" />}
          </section>

          {/* Block 2: Channels */}
          <section className="space-y-4">
            <ChannelChart data={channels.data} isLoading={channels.isLoading} />
            {insights.data && <InsightBanner insights={insights.data} block="channels" />}
          </section>

          {/* Block 3: User Behavior */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-dark-text tracking-tight">Поведение пользователей</h2>
            <BehaviorCharts data={behavior.data} isLoading={behavior.isLoading} />
          </section>

          {/* Block 4: VK Stats */}
          {vkStats.data && !vkStats.isLoading && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-dark-text tracking-tight">ВКонтакте</h2>
              <VkKpiCards kpis={vkStats.data.kpis} />
              {vkStats.data.insights && vkStats.data.insights.length > 0 && (
                <InsightBanner insights={vkStats.data.insights} block="vk" />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VkReachChart data={vkStats.data.reach_trend} />
                <VkContentChart data={vkStats.data.content_trend} />
              </div>
            </section>
          )}

          {/* Block 5: Reviews */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-dark-text tracking-tight">Отзывы с геосервисов</h2>
            <ReviewsList data={reviews.data} isLoading={reviews.isLoading} />
          </section>

        </main>
      </div>

      <ScrollToTop />
    </div>
  )
}
