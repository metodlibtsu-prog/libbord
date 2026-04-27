import type { VkTopPost } from '@/types'
import { formatNumber } from '@/utils/formatters'

interface Props {
  posts: VkTopPost[]
}

export default function VkTopPostsTable({ posts }: Props) {
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Лучшие посты</h2>
        <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Активность по датам</h2>
      <p className="text-sm text-gray-500 mb-4">Топ-{posts.length} дней по вовлечённости</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-2 font-semibold text-gray-700">Дата</th>
              <th className="pb-2 font-semibold text-gray-700 text-right">Лайки</th>
              <th className="pb-2 font-semibold text-gray-700 text-right">Репосты</th>
              <th className="pb-2 font-semibold text-gray-700 text-right">Комментарии</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, idx) => (
              <tr
                key={`${post.date}-${idx}`}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2.5 text-gray-900">
                  {new Date(post.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                </td>
                <td className="py-2.5 text-right text-pink-600 font-medium">{formatNumber(post.likes)}</td>
                <td className="py-2.5 text-right text-blue-600 font-medium">{formatNumber(post.reposts ?? 0)}</td>
                <td className="py-2.5 text-right text-green-600 font-medium">{formatNumber(post.comments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
