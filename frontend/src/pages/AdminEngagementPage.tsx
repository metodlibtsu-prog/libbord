import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchLibraries } from '@/api/dashboard'
import { createEngagementMetric, fetchAdminChannels } from '@/api/admin'
import { CHANNEL_LABELS } from '@/utils/colors'
import type { ChannelType } from '@/types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AdminEngagementPage() {
  const queryClient = useQueryClient()
  const [channelId, setChannelId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [likes, setLikes] = useState(0)
  const [reposts, setReposts] = useState(0)
  const [comments, setComments] = useState(0)
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: fetchLibraries })
  const libraryId = libraries?.[0]?.id || ''

  const { data: channels, isLoading } = useQuery({
    queryKey: ['admin-channels', libraryId],
    queryFn: () => fetchAdminChannels(libraryId),
    enabled: !!libraryId,
  })

  const mutation = useMutation({
    mutationFn: () =>
      createEngagementMetric({
        library_id: libraryId,
        channel_id: channelId,
        date,
        likes,
        reposts,
        comments,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      queryClient.invalidateQueries({ queryKey: ['engagement'] })
    },
  })

  if (isLoading) return <LoadingSpinner />

  const manualChannels = channels?.filter((c) => c.is_manual) || []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Ввод метрик вовлечённости</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Канал</label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Выберите канал</option>
              {manualChannels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.custom_name || CHANNEL_LABELS[ch.type as ChannelType]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Лайки</label>
              <input
                type="number"
                min={0}
                value={likes}
                onChange={(e) => setLikes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Репосты</label>
              <input
                type="number"
                min={0}
                value={reposts}
                onChange={(e) => setReposts(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Комментарии</label>
              <input
                type="number"
                min={0}
                value={comments}
                onChange={(e) => setComments(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заметка</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Комментарий администратора (необязательно)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {success && <p className="text-sm text-green-600">Данные сохранены</p>}
          {mutation.isError && <p className="text-sm text-red-600">Ошибка сохранения</p>}

          <button
            onClick={() => mutation.mutate()}
            disabled={!channelId || mutation.isPending}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
