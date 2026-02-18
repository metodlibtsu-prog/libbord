import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { uploadVkCsv } from '@/api/vk'
import { fetchLibraries } from '@/api/dashboard'
import { fetchAdminChannels } from '@/api/admin'

interface Props {
  onSuccess?: () => void
  onClose?: () => void
}

export default function VkUploadForm({ onSuccess, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [channelId, setChannelId] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const queryClient = useQueryClient()

  const { data: libraries } = useQuery({ queryKey: ['libraries'], queryFn: fetchLibraries })
  const libraryId = libraries?.[0]?.id || ''

  const { data: channels } = useQuery({
    queryKey: ['admin-channels', libraryId],
    queryFn: () => fetchAdminChannels(libraryId),
    enabled: !!libraryId,
  })

  // Filter only VK channels
  const vkChannels = channels?.filter((ch) => ch.type === 'vk') || []

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file || !channelId) throw new Error('File and channel required')
      return uploadVkCsv(libraryId, channelId, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vk-stats'] })
      queryClient.invalidateQueries({ queryKey: ['vk-uploads'] })
      setFile(null)
      setChannelId('')
      onSuccess?.()
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    uploadMutation.mutate()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Загрузить CSV ВКонтакте</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Channel selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Канал ВКонтакте</label>
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Выберите канал</option>
            {vkChannels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.custom_name || 'ВКонтакте'}
              </option>
            ))}
          </select>
          {vkChannels.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Сначала создайте канал ВКонтакте в разделе "Каналы"
            </p>
          )}
        </div>

        {/* File upload area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CSV файл</label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📄</div>
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} МБ
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Перетащите CSV файл сюда или нажмите для выбора
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Поддерживается формат CSV</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Upload progress/status */}
        {uploadMutation.isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-blue-700">Загрузка и обработка файла...</span>
            </div>
          </div>
        )}

        {uploadMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">✓ CSV файл успешно загружен и обработан</p>
            {uploadMutation.data && (
              <p className="text-xs text-green-600 mt-1">
                Обработано {uploadMutation.data.vk_metrics_count} дней метрик (
                {uploadMutation.data.period_start} – {uploadMutation.data.period_end})
              </p>
            )}
          </div>
        )}

        {uploadMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              Ошибка: {(uploadMutation.error as Error).message}
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!file || !channelId || uploadMutation.isPending}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить CSV'}
        </button>
      </form>
    </div>
  )
}
