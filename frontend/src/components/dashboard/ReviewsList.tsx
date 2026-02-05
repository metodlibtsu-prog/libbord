import type { ReviewsResponse } from '@/types'
import { formatDate, formatPlatform } from '@/utils/formatters'
import { SENTIMENT_COLORS } from '@/utils/colors'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import clsx from 'clsx'

interface Props {
  data?: ReviewsResponse
  isLoading: boolean
}

export default function ReviewsList({ data, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />
  if (!data || data.items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Нет отзывов</p>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Последние отзывы
        <span className="ml-2 text-sm font-normal text-gray-400">({data.total})</span>
      </h2>
      <div className="space-y-3">
        {data.items.map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-700">
                {formatPlatform(review.platform)}
              </span>
              {review.rating && (
                <span className="text-sm text-yellow-500">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
              )}
              <span
                className={clsx('text-xs px-2 py-0.5 rounded-full font-medium')}
                style={{
                  backgroundColor: SENTIMENT_COLORS[review.sentiment] + '20',
                  color: SENTIMENT_COLORS[review.sentiment],
                }}
              >
                {review.sentiment === 'positive' ? 'Позитивный' :
                 review.sentiment === 'negative' ? 'Негативный' : 'Нейтральный'}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{formatDate(review.date)}</span>
            </div>
            {review.text && <p className="text-sm text-gray-600">{review.text}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
