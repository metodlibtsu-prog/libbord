import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ChannelMetric, ChannelType } from '@/types'
import { CHANNEL_COLORS, CHANNEL_LABELS } from '@/utils/colors'
import { formatNumber } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface Props {
  data?: ChannelMetric[]
  isLoading: boolean
}

export default function ChannelChart({ data, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Нет данных по каналам</p>
  }

  const chartData = data.map((ch) => ({
    name: ch.custom_name || CHANNEL_LABELS[ch.channel_type as ChannelType] || ch.channel_type,
    views: ch.views,
    visits: ch.visits,
    users: ch.users,
    fill: CHANNEL_COLORS[ch.channel_type as ChannelType] || CHANNEL_COLORS.other,
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Где библиотеку изучают</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 13 }} />
          <Tooltip
            formatter={(value: number) => formatNumber(value)}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="views" name="Просмотры" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
