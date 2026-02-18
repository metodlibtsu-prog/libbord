import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLibraries } from '@/api/dashboard'
import { fetchVkStats } from '@/api/vk'
import { fetchAdminChannels } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import InsightBanner from '@/components/dashboard/InsightBanner'
import VkUploadForm from '@/components/vk/VkUploadForm'
import VkKpiCards from '@/components/vk/VkKpiCards'
import VkReachChart from '@/components/vk/VkReachChart'
import VkEngagementChart from '@/components/vk/VkEngagementChart'
import VkTopPostsTable from '@/components/vk/VkTopPostsTable'

export default function AdminVkPage() {
  const [showUploadForm, setShowUploadForm] = useState(false)

  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: fetchLibraries })
  const libraryId = libraries?.[0]?.id || ''

  const { data: channels } = useQuery({
    queryKey: ['admin-channels', libraryId],
    queryFn: () => fetchAdminChannels(libraryId),
    enabled: !!libraryId,
  })

  // Get first VK channel
  const vkChannel = channels?.find((ch) => ch.type === 'vk')

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vk-stats', libraryId, vkChannel?.id],
    queryFn: () => fetchVkStats(libraryId, vkChannel?.id),
    enabled: !!libraryId && !!vkChannel,
  })

  const handleUploadSuccess = () => {
    setShowUploadForm(false)
  }

  if (!vkChannel && channels) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">ВКонтакте</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-4">
            Сначала создайте канал ВКонтакте в разделе{' '}
            <a href="/admin/channels" className="underline font-semibold">
              Каналы
            </a>
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ВКонтакте</h1>
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Загрузить CSV
          </button>
        </div>

        {showUploadForm && (
          <VkUploadForm onSuccess={handleUploadSuccess} onClose={() => setShowUploadForm(false)} />
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            Нет данных ВКонтакте. Загрузите CSV файл со статистикой.
          </p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header with upload button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ВКонтакте</h1>
          <div className="mt-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Источник данных:</span> ВКонтакте
              {stats.period_info.upload_date && (
                <span> (загружен {new Date(stats.period_info.upload_date).toLocaleDateString('ru-RU')})</span>
              )}
            </p>
            <p>
              <span className="font-medium">Период:</span>{' '}
              {new Date(stats.period_info.start).toLocaleDateString('ru-RU')} –{' '}
              {new Date(stats.period_info.end).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Обновить данные
          </button>
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Загрузить новый файл
          </button>
        </div>
      </div>

      {/* Upload form modal */}
      {showUploadForm && (
        <VkUploadForm onSuccess={handleUploadSuccess} onClose={() => setShowUploadForm(false)} />
      )}

      {/* KPI Cards */}
      <VkKpiCards kpis={stats.kpis} />

      {/* Insights */}
      {stats.insights && stats.insights.length > 0 && (
        <InsightBanner insights={stats.insights} block="vk" />
      )}

      {/* Reach and Engagement Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VkReachChart data={stats.reach_trend} />
        <VkEngagementChart data={stats.engagement_trend} />
      </div>

      {/* Top Posts Table */}
      <VkTopPostsTable posts={stats.top_posts} />
    </div>
  )
}
