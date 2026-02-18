import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { VkEngagementPoint } from '@/types'
import { formatNumber } from '@/utils/formatters'

interface Props {
  data: VkEngagementPoint[]
}

export default function VkEngagementChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Вовлечённость</h2>
        <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Вовлечённость</h2>
      <p className="text-sm text-gray-500 mb-4">Лайки, репосты, комментарии и ER%</p>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}.${date.getMonth() + 1}`
            }}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v)} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'ER%') return [`${value.toFixed(2)}%`, name]
              return [formatNumber(value), name]
            }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            labelFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="likes" fill="#ec4899" name="Лайки" />
          <Bar yAxisId="left" dataKey="reposts" fill="#3b82f6" name="Репосты" />
          <Bar yAxisId="left" dataKey="comments" fill="#10b981" name="Комментарии" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="er"
            stroke="#f59e0b"
            name="ER%"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Всего лайков</p>
          <p className="font-semibold text-pink-600">
            {formatNumber(data.reduce((sum, d) => sum + d.likes, 0))}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Всего репостов</p>
          <p className="font-semibold text-blue-600">
            {formatNumber(data.reduce((sum, d) => sum + d.reposts, 0))}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Всего комментариев</p>
          <p className="font-semibold text-green-600">
            {formatNumber(data.reduce((sum, d) => sum + d.comments, 0))}
          </p>
        </div>
      </div>
    </div>
  )
}
