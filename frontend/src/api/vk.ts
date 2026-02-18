import apiClient from './client'
import type {
  Period,
  VkStatsResponse,
  VkUpload,
  VkUploadSummary,
} from '@/types'

/**
 * Upload VK CSV file
 */
export async function uploadVkCsv(
  libraryId: string,
  channelId: string,
  file: File
): Promise<VkUploadSummary> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<VkUploadSummary>(
    `/vk/upload?library_id=${libraryId}&channel_id=${channelId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data
}

/**
 * Fetch VK statistics
 */
export async function fetchVkStats(
  libraryId: string,
  channelId?: string,
  period: Period = 'month'
): Promise<VkStatsResponse> {
  const params = new URLSearchParams({
    library_id: libraryId,
    period,
  })

  if (channelId) {
    params.append('channel_id', channelId)
  }

  const response = await apiClient.get<VkStatsResponse>(`/vk/stats?${params}`)
  return response.data
}

/**
 * List VK uploads history
 */
export async function listVkUploads(
  libraryId: string,
  channelId?: string,
  limit: number = 10
): Promise<VkUpload[]> {
  const params = new URLSearchParams({
    library_id: libraryId,
    limit: limit.toString(),
  })

  if (channelId) {
    params.append('channel_id', channelId)
  }

  const response = await apiClient.get<VkUpload[]>(`/vk/uploads?${params}`)
  return response.data
}

/**
 * Delete VK upload
 */
export async function deleteVkUpload(uploadId: string): Promise<void> {
  await apiClient.delete(`/vk/uploads/${uploadId}`)
}
