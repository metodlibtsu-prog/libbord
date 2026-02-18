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
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Контент-анализ</h2>
      <p className="text-sm text-gray-500 mb-4">Топ-{posts.length} постов по вовлечённости</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-2 font-semibold text-gray-700">Дата</th>
              <th className="pb-2 font-semibold text-gray-700">Тип</th>
              <th className="pb-2 font-semibold text-gray-700 text-right">Охват</th>
              <th className="pb-2 font-semibold text-gray-700 text-right">ER%</th>
              <th className="pb-2 font-semibold text-gray-700 text-right">Лайки</th>
              <th className="pb-2 font-semibold text-gray-700 text-right">Комм</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, idx) => (
              <tr
                key={`${post.date}-${idx}`}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2.5 text-gray-900">
                  {new Date(post.date).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </td>
                <td className="py-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {post.type}
                  </span>
                </td>
                <td className="py-2.5 text-right text-gray-900">{formatNumber(post.reach)}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={`font-semibold ${
                      post.er >= 5
                        ? 'text-green-600'
                        : post.er >= 2
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {post.er.toFixed(2)}%
                  </span>
                </td>
                <td className="py-2.5 text-right text-gray-900">{formatNumber(post.likes)}</td>
                <td className="py-2.5 text-right text-gray-900">{formatNumber(post.comments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Совет:</strong> Форматы с высоким ER% стоит использовать чаще. Обратите внимание
          на тип контента и время публикации лучших постов.
        </p>
      </div>
    </div>
  )
}
