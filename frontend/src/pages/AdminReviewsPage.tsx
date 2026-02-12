import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchLibraries, fetchReviews } from '@/api/dashboard'
import { createReview } from '@/api/admin'
import { formatDate, formatPlatform } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const platforms = [
  { value: 'yandex_maps', label: 'Яндекс.Карты' },
  { value: 'google_maps', label: 'Google Maps' },
  { value: '2gis', label: '2ГИС' },
  { value: 'other', label: 'Другое' },
]

export default function AdminReviewsPage() {
  const queryClient = useQueryClient()
  const [platform, setPlatform] = useState('yandex_maps')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [sentiment, setSentiment] = useState('positive')
  const [success, setSuccess] = useState(false)

  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: fetchLibraries })
  const libraryId = libraries?.[0]?.id || ''

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', libraryId],
    queryFn: () => fetchReviews(libraryId),
    enabled: !!libraryId,
  })

  const mutation = useMutation({
    mutationFn: () =>
      createReview({
        library_id: libraryId,
        platform,
        date,
        rating,
        text: text || undefined,
        sentiment,
      }),
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      setText('')
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Отзывы</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Добавить отзыв</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Платформа</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {platforms.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Оценка</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тональность</label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="positive"
                    checked={sentiment === 'positive'}
                    onChange={(e) => setSentiment(e.target.value)}
                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Положительный</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="neutral"
                    checked={sentiment === 'neutral'}
                    onChange={(e) => setSentiment(e.target.value)}
                    className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Нейтральный</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="negative"
                    checked={sentiment === 'negative'}
                    onChange={(e) => setSentiment(e.target.value)}
                    className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Негативный</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Текст отзыва</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {success && <p className="text-sm text-green-600">Отзыв сохранён</p>}

            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Последние отзывы ({reviews?.total ?? 0})
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {reviews?.items.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{formatPlatform(r.platform)}</span>
                  {r.rating && <span className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}</span>}
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(r.date)}</span>
                </div>
                {r.text && <p className="text-sm text-gray-600">{r.text}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
