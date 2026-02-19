import type { ReviewsResponse } from '@/types'
import { formatDate, formatPlatform } from '@/utils/formatters'
import { SENTIMENT_COLORS } from '@/utils/colors'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import clsx from 'clsx'
import { motion } from 'framer-motion'

interface Props {
  data?: ReviewsResponse
  isLoading: boolean
}

export default function ReviewsList({ data, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />
  if (!data || data.items.length === 0) {
    return <p className="text-sm text-dark-text-secondary text-center py-8">Нет отзывов</p>
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-lg font-semibold text-dark-text mb-4">
        Последние отзывы
        <span className="ml-2 text-sm font-normal text-dark-text-secondary">({data.total})</span>
      </h2>
      <div className="space-y-3">
        {data.items.map((review, idx) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            className="border-b border-dark-border pb-3 last:border-0 cursor-default"
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-medium text-dark-text">
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
                  backgroundColor: SENTIMENT_COLORS[review.sentiment] + '30',
                  color: SENTIMENT_COLORS[review.sentiment],
                }}
              >
                {review.sentiment === 'positive'
                  ? 'Позитивный'
                  : review.sentiment === 'negative'
                    ? 'Негативный'
                    : 'Нейтральный'}
              </span>
              <span className="text-xs text-dark-text-secondary ml-auto">{formatDate(review.date)}</span>
            </div>
            {review.text && <p className="text-sm text-dark-text-secondary">{review.text}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
