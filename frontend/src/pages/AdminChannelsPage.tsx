import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchLibraries } from '@/api/dashboard'
import { createChannel, deleteChannel, fetchAdminChannels } from '@/api/admin'
import { CHANNEL_LABELS } from '@/utils/colors'
import type { ChannelType } from '@/types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const channelTypes: ChannelType[] = ['website', 'e_library', 'catalog', 'telegram', 'vk', 'mobile_app', 'other']

export default function AdminChannelsPage() {
  const queryClient = useQueryClient()
  const [newType, setNewType] = useState<ChannelType>('website')
  const [newName, setNewName] = useState('')
  const [isManual, setIsManual] = useState(false)

  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: fetchLibraries })
  const libraryId = libraries?.[0]?.id || ''

  const { data: channels, isLoading } = useQuery({
    queryKey: ['admin-channels', libraryId],
    queryFn: () => fetchAdminChannels(libraryId),
    enabled: !!libraryId,
  })

  const addMutation = useMutation({
    mutationFn: () =>
      createChannel({
        library_id: libraryId,
        type: newType,
        custom_name: newName || undefined,
        is_manual: isManual,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-channels'] })
      setNewName('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-channels'] }),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Управление каналами</h1>

      {/* Add channel form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Добавить канал</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Тип</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ChannelType)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {channelTypes.map((t) => (
                <option key={t} value={t}>{CHANNEL_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Название (опционально)</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Например: Основной Telegram"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={isManual}
              onChange={(e) => setIsManual(e.target.checked)}
              className="rounded"
            />
            Ручной ввод
          </label>
          <button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Channels list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Тип</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Название</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Ручной</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {channels?.map((ch) => (
              <tr key={ch.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3">{CHANNEL_LABELS[ch.type as ChannelType] || ch.type}</td>
                <td className="px-5 py-3 text-gray-600">{ch.custom_name || '—'}</td>
                <td className="px-5 py-3">{ch.is_manual ? 'Да' : 'Нет'}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => deleteMutation.mutate(ch.id)}
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
