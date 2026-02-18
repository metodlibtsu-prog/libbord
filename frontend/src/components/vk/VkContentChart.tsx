import { VkContentPoint } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatNumber } from '@/utils/formatters'

interface VkContentChartProps {
  data: VkContentPoint[]
}

export default function VkContentChart({ data }: VkContentChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Активность контента</h2>
        <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
      </div>
    )
  }

  // Calculate averages
  const avgPosts = Math.round(data.reduce((sum, d) => sum + d.posts, 0) / data.length)
  const avgStories = Math.round(data.reduce((sum, d) => sum + d.stories, 0) / data.length)
  const avgClips = Math.round(data.reduce((sum, d) => sum + d.clips, 0) / data.length)
  const avgVideos = Math.round(data.reduce((sum, d) => sum + d.videos, 0) / data.length)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Активность контента</h2>
      <p className="text-sm text-gray-500 mb-4">Количество опубликованного контента</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}.${date.getMonth() + 1}`
            }}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v)} />
          <Tooltip
            formatter={(value: number) => formatNumber(value)}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            labelFormatter={(value) => {
              const date = new Date(value as string)
              return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
            }}
          />
          <Legend />
          <Bar dataKey="posts" fill="#3b82f6" name="Посты" />
          <Bar dataKey="stories" fill="#8b5cf6" name="Истории" />
          <Bar dataKey="clips" fill="#ec4899" name="Клипы" />
          <Bar dataKey="videos" fill="#f59e0b" name="Видео" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Постов в день</p>
          <p className="font-semibold text-gray-900">{formatNumber(avgPosts)}</p>
        </div>
        <div>
          <p className="text-gray-500">Историй в день</p>
          <p className="font-semibold text-gray-900">{formatNumber(avgStories)}</p>
        </div>
        <div>
          <p className="text-gray-500">Клипов в день</p>
          <p className="font-semibold text-gray-900">{formatNumber(avgClips)}</p>
        </div>
        <div>
          <p className="text-gray-500">Видео в день</p>
          <p className="font-semibold text-gray-900">{formatNumber(avgVideos)}</p>
        </div>
      </div>
    </div>
  )
}
