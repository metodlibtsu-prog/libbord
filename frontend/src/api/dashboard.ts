import type {
  BehaviorData,
  ChannelMetric,
  ChannelTrendPoint,
  EngagementData,
  Insight,
  KpiOverview,
  Library,
  MetricCounter,
  Period,
  ReviewsResponse,
  VkStatsResponse,
} from '@/types'
import apiClient from './client'

export async function fetchLibraries(): Promise<Library[]> {
  const { data } = await apiClient.get('/libraries')
  return data
}

export async function fetchCounters(libraryId: string): Promise<MetricCounter[]> {
  const { data } = await apiClient.get(`/libraries/${libraryId}/counters`)
  return data
}

export async function fetchOverview(
  libraryId: string,
  period: Period,
  counterId?: string,
): Promise<KpiOverview> {
  const params: Record<string, string> = { library_id: libraryId, period }
  if (counterId) params.counter_id = counterId
  const { data } = await apiClient.get('/dashboard/overview', { params })
  return data
}

export async function fetchChannels(
  libraryId: string,
  period: Period,
): Promise<ChannelMetric[]> {
  const { data } = await apiClient.get('/dashboard/channels', {
    params: { library_id: libraryId, period },
  })
  return data
}

export async function fetchChannelTrend(
  libraryId: string,
  channelId: string,
  period: Period,
): Promise<ChannelTrendPoint[]> {
  const { data } = await apiClient.get('/dashboard/channels/trend', {
    params: { library_id: libraryId, channel_id: channelId, period },
  })
  return data
}

export async function fetchBehavior(
  libraryId: string,
  period: Period,
  counterId?: string,
): Promise<BehaviorData> {
  const params: Record<string, string> = { library_id: libraryId, period }
  if (counterId) params.counter_id = counterId
  const { data } = await apiClient.get('/dashboard/behavior', { params })
  return data
}

export async function fetchEngagement(
  libraryId: string,
  period: Period,
): Promise<EngagementData> {
  const { data } = await apiClient.get('/dashboard/engagement', {
    params: { library_id: libraryId, period },
  })
  return data
}

export async function fetchReviews(
  libraryId: string,
  limit = 10,
  offset = 0,
): Promise<ReviewsResponse> {
  const { data } = await apiClient.get('/dashboard/reviews', {
    params: { library_id: libraryId, limit, offset },
  })
  return data
}

export async function fetchInsights(
  libraryId: string,
  period: Period,
  counterId?: string,
): Promise<Insight[]> {
  const params: Record<string, string> = { library_id: libraryId, period }
  if (counterId) params.counter_id = counterId
  const { data } = await apiClient.get('/dashboard/insights', { params })
  return data
}

export async function fetchVkDashboard(
  libraryId: string,
  period: Period,
): Promise<VkStatsResponse> {
  const { data } = await apiClient.get('/dashboard/vk', {
    params: { library_id: libraryId, period },
  })
  return data
}
