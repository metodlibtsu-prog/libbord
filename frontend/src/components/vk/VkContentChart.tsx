import { VkContentPoint } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface VkContentChartProps {
  data: VkContentPoint[]
}

export function VkContentChart({ data }: VkContentChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Активность контента</h3>
        <p className="text-gray-500">Нет данных</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Активность контента</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}.${date.getMonth() + 1}`
            }}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => {
              const date = new Date(value as string)
              return date.toLocaleDateString('ru-RU')
            }}
          />
          <Legend />
          <Bar dataKey="posts" fill="#3b82f6" name="Посты" />
          <Bar dataKey="stories" fill="#8b5cf6" name="Истории" />
          <Bar dataKey="clips" fill="#ec4899" name="Клипы" />
          <Bar dataKey="videos" fill="#f59e0b" name="Видео" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
