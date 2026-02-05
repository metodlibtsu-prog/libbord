import type { Channel, ChannelType } from '@/types'
import apiClient from './client'

// Channels
export async function fetchAdminChannels(libraryId: string): Promise<Channel[]> {
  const { data } = await apiClient.get('/channels', { params: { library_id: libraryId } })
  return data
}

export async function createChannel(payload: {
  library_id: string
  type: ChannelType
  custom_name?: string
  is_manual?: boolean
}): Promise<Channel> {
  const { data } = await apiClient.post('/channels', payload)
  return data
}

export async function deleteChannel(channelId: string): Promise<void> {
  await apiClient.delete(`/channels/${channelId}`)
}

// Engagement metrics
export async function createEngagementMetric(payload: {
  library_id: string
  channel_id: string
  date: string
  likes: number
  reposts: number
  comments: number
  notes?: string
}) {
  const { data } = await apiClient.post('/engagement-metrics', payload)
  return data
}

// Reviews
export async function createReview(payload: {
  library_id: string
  platform: string
  date: string
  rating?: number
  text?: string
  sentiment?: string
}) {
  const { data } = await apiClient.post('/reviews', payload)
  return data
}
