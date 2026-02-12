import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchLibraries } from '@/api/dashboard'
import { fetchAdminChannels, deleteChannel, triggerSync } from '@/api/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ResourceCard from '@/components/admin/ResourceCard'
import AddResourceModal from '@/components/admin/AddResourceModal'
import YandexOAuthWizard from '@/components/admin/YandexOAuthWizard'
import ManualResourceForm from '@/components/admin/ManualResourceForm'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showYandexWizard, setShowYandexWizard] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [yandexOAuthSuccess, setYandexOAuthSuccess] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const { data: libraries, isLoading } = useQuery({
    queryKey: ['libraries'],
    queryFn: fetchLibraries,
  })

  const libraryId = libraries?.[0]?.id || ''

  const { data: channels, refetch: refetchChannels } = useQuery({
    queryKey: ['admin-channels', libraryId],
    queryFn: () => fetchAdminChannels(libraryId),
    enabled: !!libraryId,
  })

  // Check for Yandex OAuth callback success
  useEffect(() => {
    const yandexSuccess = searchParams.get('yandex_success')
    const yandexError = searchParams.get('yandex_error')

    if (yandexSuccess === 'true') {
      setShowYandexWizard(true)
      setYandexOAuthSuccess(true)
      // Clear URL parameters
      setSearchParams({})
    } else if (yandexError) {
      alert(`Ошибка авторизации Яндекс: ${yandexError}`)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const handleAddResource = () => {
    setShowAddModal(true)
  }

  const handleSelectYandex = () => {
    setShowAddModal(false)
    setShowYandexWizard(true)
  }

  const handleSelectManual = () => {
    setShowAddModal(false)
    setShowManualForm(true)
  }

  const handleDeleteChannel = async (channelId: string) => {
    try {
      await deleteChannel(channelId)
      refetchChannels()
    } catch {
      alert('Ошибка при удалении ресурса')
    }
  }

  const handleSync = async () => {
    if (!libraryId) return
    setSyncing(true)
    try {
      await triggerSync(libraryId)
      alert('Синхронизация завершена!')
    } catch {
      alert('Ошибка синхронизации')
    } finally {
      setSyncing(false)
    }
  }

  const handleSuccess = () => {
    refetchChannels()
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Цифровые ресурсы библиотеки
        </h1>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Синхронизация...' : 'Синхронизировать'}
          </button>
          <button
            onClick={() => navigate('/admin/reviews')}
            className="rounded-md border border-indigo-600 bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            + Добавить отзыв
          </button>
          <button
            onClick={handleAddResource}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            + Добавить ресурс
          </button>
        </div>
      </div>

      {channels && channels.length > 0 ? (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <ResourceCard
              key={channel.id}
              channel={channel}
              onViewData={() => navigate('/')}
              onAddData={() => navigate(`/admin/engagement?channel=${channel.id}`)}
              onDelete={handleDeleteChannel}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 mb-4">
            Ресурсы ещё не добавлены
          </p>
          <button
            onClick={handleAddResource}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Добавить первый ресурс
          </button>
        </div>
      )}

      {/* Modals */}
      <AddResourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectYandex={handleSelectYandex}
        onSelectManual={handleSelectManual}
      />

      <YandexOAuthWizard
        isOpen={showYandexWizard}
        onClose={() => {
          setShowYandexWizard(false)
          setYandexOAuthSuccess(false)
        }}
        onSuccess={handleSuccess}
        libraryId={libraryId}
        oauthSuccess={yandexOAuthSuccess}
      />

      <ManualResourceForm
        isOpen={showManualForm}
        onClose={() => setShowManualForm(false)}
        onSuccess={handleSuccess}
        libraryId={libraryId}
      />
    </div>
  )
}
