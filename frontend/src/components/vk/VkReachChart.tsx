import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { VkReachPoint } from '@/types'
import { formatNumber } from '@/utils/formatters'

interface Props {
  data: VkReachPoint[]
}

export default function VkReachChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Охват и показы</h2>
        <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Охват и показы</h2>
      <p className="text-sm text-gray-500 mb-4">Сколько людей увидели контент</p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
              const date = new Date(value)
              return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="reach" stroke="#3b82f6" name="Охват" strokeWidth={2} />
          <Line type="monotone" dataKey="views" stroke="#10b981" name="Показы" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Средний охват на день</p>
          <p className="font-semibold text-gray-900">
            {formatNumber(Math.round(data.reduce((sum, d) => sum + d.reach, 0) / data.length))}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Средние показы на день</p>
          <p className="font-semibold text-gray-900">
            {formatNumber(Math.round(data.reduce((sum, d) => sum + d.views, 0) / data.length))}
          </p>
        </div>
      </div>
    </div>
  )
}
