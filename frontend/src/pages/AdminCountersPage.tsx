import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCounters, fetchLibraries } from '@/api/dashboard'
import apiClient from '@/api/client'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AdminCountersPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [counterId, setCounterId] = useState('')

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

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Счётчики Яндекс.Метрики</h1>

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
                    c.sync_status === 'error' ? 'bg-red-100 text-red-700' :
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
