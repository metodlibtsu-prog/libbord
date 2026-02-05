import { useQuery } from '@tanstack/react-query'
import { fetchLibraries, fetchCounters } from '@/api/dashboard'
import { fetchAdminChannels } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AdminDashboardPage() {
  const { data: libraries, isLoading } = useQuery({
    queryKey: ['libraries'],
    queryFn: fetchLibraries,
  })

  const libraryId = libraries?.[0]?.id || ''

  const { data: channels } = useQuery({
    queryKey: ['admin-channels', libraryId],
    queryFn: () => fetchAdminChannels(libraryId),
    enabled: !!libraryId,
  })

  const { data: counters } = useQuery({
    queryKey: ['counters', libraryId],
    queryFn: () => fetchCounters(libraryId),
    enabled: !!libraryId,
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">
        {libraries?.[0]?.name || 'Библиотека'}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Каналов</p>
          <p className="text-2xl font-bold">{channels?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Счётчиков Я.Метрики</p>
          <p className="text-2xl font-bold">{counters?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Статус</p>
          <p className="text-2xl font-bold text-green-600">Активен</p>
        </div>
      </div>
    </div>
  )
}
