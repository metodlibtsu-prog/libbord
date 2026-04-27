import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchLibraries } from '@/api/dashboard'
import { fetchVkStats } from '@/api/vk'
import { fetchAdminChannels } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import InsightBanner from '@/components/dashboard/InsightBanner'
import VkUploadForm from '@/components/vk/VkUploadForm'
import VkKpiCards from '@/components/vk/VkKpiCards'
import VkReachChart from '@/components/vk/VkReachChart'
import VkContentChart from '@/components/vk/VkContentChart'
import VkTopPostsTable from '@/components/vk/VkTopPostsTable'

const API = import.meta.env.VITE_API_BASE_URL

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

async function getVkConfig(libraryId: string) {
  const r = await fetch(`${API}/vk/config?library_id=${libraryId}`, { headers: authHeader() })
  if (!r.ok) throw new Error('failed')
  return r.json()
}

async function saveVkConfig(libraryId: string, token: string) {
  const r = await fetch(`${API}/vk/config/save?library_id=${libraryId}`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ community_token: token }),
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.detail || 'Ошибка сохранения')
  }
  return r.json()
}

async function triggerVkSync(libraryId: string, dateFrom?: string, dateTo?: string) {
  const r = await fetch(`${API}/vk/sync?library_id=${libraryId}`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ date_from: dateFrom || null, date_to: dateTo || null }),
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.detail || 'Ошибка синхронизации')
  }
  return r.json()
}

function VkApiSetup({ libraryId }: { libraryId: string }) {
  const qc = useQueryClient()
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncPeriod, setSyncPeriod] = useState<'7' | '30' | '365'>('7')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const { data: config, isLoading } = useQuery({
    queryKey: ['vk-config', libraryId],
    queryFn: () => getVkConfig(libraryId),
    enabled: !!libraryId,
  })

  const handleSave = async () => {
    if (!token.trim()) return
    setSaving(true)
    setMsg(null)
    try {
      const res = await saveVkConfig(libraryId, token.trim())
      setMsg({ type: 'ok', text: `Подключено: ${res.community_name || res.community_id}` })
      setToken('')
      qc.invalidateQueries({ queryKey: ['vk-config', libraryId] })
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMsg(null)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const from = new Date(Date.now() - Number(syncPeriod) * 86400_000).toISOString().slice(0, 10)
      const res = await triggerVkSync(libraryId, from, today)
      if (res.status === 'started_background') {
        setMsg({ type: 'ok', text: `Синхронизация запущена в фоне (${res.days} дн.)` })
      } else {
        setMsg({ type: 'ok', text: `Готово: ${res.days_synced} дн. статистики, ${res.posts_synced} дн. постов` })
        qc.invalidateQueries({ queryKey: ['vk-stats'] })
      }
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message })
    } finally {
      setSyncing(false)
    }
  }

  if (isLoading) return <div className="h-8 animate-pulse bg-gray-100 rounded" />

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">Автоматическая синхронизация ВКонтакте</h2>

      {/* Status */}
      {config?.configured && (
        <div className="flex items-center gap-3 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm">
          <span className="text-green-700 font-medium">✓ Подключено:</span>
          <span className="text-green-800">{config.community_name || config.community_id}</span>
          {config.last_sync_at && (
            <span className="ml-auto text-gray-500">
              Последняя синхр.: {new Date(config.last_sync_at).toLocaleString('ru-RU')}
            </span>
          )}
          {config.sync_status === 'error' && (
            <span className="ml-auto text-red-600 text-xs truncate max-w-xs" title={config.sync_error}>
              ⚠ {config.sync_error}
            </span>
          )}
        </div>
      )}

      {/* Token input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {config?.configured ? 'Обновить токен сообщества' : 'Токен сообщества ВКонтакте'}
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="vk1.a.xxxxx..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleSave}
            disabled={saving || !token.trim()}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Сохраняю...' : config?.configured ? 'Обновить' : 'Подключить'}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Настройки сообщества → Работа с API → Ключи доступа → Создать ключ
        </p>
      </div>

      {/* Sync controls */}
      {config?.configured && (
        <div className="flex items-center gap-3">
          <select
            value={syncPeriod}
            onChange={(e) => setSyncPeriod(e.target.value as any)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="7">7 дней</option>
            <option value="30">30 дней</option>
            <option value="365">Последний год</option>
          </select>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? 'Синхронизирую...' : 'Синхронизировать'}
          </button>
          <span className="text-xs text-gray-500">
            Автоматически каждые 4 часа
          </span>
        </div>
      )}

      {msg && (
        <div className={`rounded-md px-4 py-2 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {msg.text}
        </div>
      )}
    </div>
  )
}

export default function AdminVkPage() {
  const [showUploadForm, setShowUploadForm] = useState(false)

  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: fetchLibraries })
  const libraryId = libraries?.[0]?.id || ''

  const { data: channels } = useQuery({
    queryKey: ['admin-channels', libraryId],
    queryFn: () => fetchAdminChannels(libraryId),
    enabled: !!libraryId,
  })

  const vkChannel = channels?.find((ch) => ch.type === 'vk')

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['vk-stats', libraryId, vkChannel?.id],
    queryFn: () => fetchVkStats(libraryId, vkChannel?.id),
    enabled: !!libraryId && !!vkChannel,
  })

  if (!vkChannel && channels) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">ВКонтакте</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-4">
            Сначала создайте канал ВКонтакте в разделе{' '}
            <a href="/admin/channels" className="underline font-semibold">Каналы</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-bold text-gray-900">ВКонтакте</h1>
        <button
          onClick={() => setShowUploadForm(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Загрузить CSV
        </button>
      </div>

      {/* VK API Setup */}
      {libraryId && <VkApiSetup libraryId={libraryId} />}

      {showUploadForm && (
        <VkUploadForm onSuccess={() => setShowUploadForm(false)} onClose={() => setShowUploadForm(false)} />
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && !error && stats && (
        <>
          <VkKpiCards kpis={stats.kpis} />
          {stats.insights && stats.insights.length > 0 && (
            <InsightBanner insights={stats.insights} block="vk" />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VkReachChart data={stats.reach_trend} />
            <VkContentChart data={stats.content_trend} />
          </div>
          {stats.engagement_trend && stats.engagement_trend.length > 0 && (
            <VkTopPostsTable posts={stats.top_posts} />
          )}
        </>
      )}

      {!isLoading && (error || !stats) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            Нет данных ВКонтакте. Синхронизируйте через API или загрузите CSV.
          </p>
        </div>
      )}
    </div>
  )
}
