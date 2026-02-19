import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCounters, fetchLibraries } from '@/api/dashboard'
import apiClient from '@/api/client'
import LoadingSpinner from '@/components/common/LoadingSpinner'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export default function AdminCountersPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [counterId, setCounterId] = useState('')
  const [syncResult, setSyncResult] = useState<{ message: string; rows: number; days: number } | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: fetchLibraries })
  const libraryId = libraries?.[0]?.id || ''

  const { data: counters, isLoading } = useQuery({
    queryKey: ['counters', libraryId],
    queryFn: () => fetchCounters(libraryId),
    enabled: !!libraryId,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/metric-counters', {
        library_id: libraryId,
        name,
        yandex_counter_id: counterId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counters'] })
      setName('')
      setCounterId('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/metric-counters/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['counters'] }),
  })

  const syncMutation = useMutation({
    mutationFn: async (params: { date_from?: string; date_to?: string }) => {
      setSyncResult(null)
      setSyncError(null)
      const query = new URLSearchParams({ library_id: libraryId })
      if (params.date_from) query.set('date_from', params.date_from)
      if (params.date_to) query.set('date_to', params.date_to)
      const res = await apiClient.post(`/sync/trigger?${query.toString()}`)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['counters'] })
      setSyncResult({
        message: data.message,
        rows: data.diagnostics?.traffic_metrics_rows ?? 0,
        days: data.period?.days ?? 0,
      })
    },
    onError: (err: any) => {
      setSyncError(err?.response?.data?.detail || 'Ошибка синхронизации')
    },
  })

  const handleSyncRecent = () => {
    syncMutation.mutate({})
  }

  const handleSyncYear = () => {
    const today = new Date()
    const yearAgo = new Date(today)
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)
    syncMutation.mutate({
      date_from: formatDate(yearAgo),
      date_to: formatDate(today),
    })
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Счётчики Яндекс.Метрики</h1>

      {/* Sync Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Синхронизация данных</h2>
        <p className="text-xs text-gray-500 mb-4">
          Загрузка статистики с серверов Яндекс.Метрики в базу данных дашборда.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={handleSyncRecent}
            disabled={syncMutation.isPending || !libraryId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {syncMutation.isPending ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Синхронизировать (7 дней)
          </button>

          <button
            onClick={handleSyncYear}
            disabled={syncMutation.isPending || !libraryId}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {syncMutation.isPending ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            Загрузить за последний год
          </button>
        </div>

        {/* Sync result */}
        {syncMutation.isPending && (
          <p className="mt-3 text-xs text-blue-600">
            Загрузка данных... Это может занять до минуты при большом периоде.
          </p>
        )}
        {syncResult && (
          <div className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
            ✓ {syncResult.message} — загружено {syncResult.days} дн., всего записей в базе: {syncResult.rows.toLocaleString('ru-RU')}
          </div>
        )}
        {syncError && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            ✗ {syncError}
          </div>
        )}
      </div>

      {/* Add counter */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Добавить счётчик</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Основной сайт"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ID счётчика</label>
            <input
              value={counterId}
              onChange={(e) => setCounterId(e.target.value)}
              placeholder="12345678"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-40"
            />
          </div>
          <button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !name || !counterId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Counters table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Название</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">ID счётчика</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Статус</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Последняя синхр.</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {counters?.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-gray-600">{c.yandex_counter_id}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.sync_status === 'success' ? 'bg-green-100 text-green-700' :
                    c.sync_status === 'error'   ? 'bg-red-100 text-red-700' :
                    c.sync_status === 'syncing' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {c.sync_status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {c.last_sync_at ? new Date(c.last_sync_at).toLocaleString('ru-RU') : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
