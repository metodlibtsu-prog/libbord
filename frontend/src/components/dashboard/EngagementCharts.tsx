import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { EngagementData } from '@/types'
import { formatDate, formatDelta, formatNumber } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface Props {
  data?: EngagementData
  isLoading: boolean
}

export default function EngagementCharts({ data, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />
  if (!data || data.timeline.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Нет данных о вовлечённости</p>
  }

  const chartData = data.timeline.map((p) => ({
    ...p,
    date: formatDate(p.date),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Вовлечённость и обратная связь</h2>
      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Лайки: </span>
          <span className="font-semibold">{formatNumber(data.total_likes)}</span>
          {data.likes_delta_pct !== null && (
            <span className="ml-1 text-gray-400">({formatDelta(data.likes_delta_pct)})</span>
          )}
        </div>
        <div>
          <span className="text-gray-500">Репосты: </span>
          <span className="font-semibold">{formatNumber(data.total_reposts)}</span>
          {data.reposts_delta_pct !== null && (
            <span className="ml-1 text-gray-400">({formatDelta(data.reposts_delta_pct)})</span>
          )}
        </div>
        <div>
          <span className="text-gray-500">Комментарии: </span>
          <span className="font-semibold">{formatNumber(data.total_comments)}</span>
          {data.comments_delta_pct !== null && (
            <span className="ml-1 text-gray-400">({formatDelta(data.comments_delta_pct)})</span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => formatNumber(value)}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Legend />
          <Bar dataKey="likes" name="Лайки" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="reposts" name="Репосты" fill="#6366F1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="comments" name="Комментарии" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
