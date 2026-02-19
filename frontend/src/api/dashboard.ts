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

function dateParams(dateFrom?: string, dateTo?: string): Record<string, string> {
  if (dateFrom && dateTo) return { date_from: dateFrom, date_to: dateTo }
  return {}
}

export async function fetchOverview(
  libraryId: string,
  period: Period,
  dateFrom?: string,
  dateTo?: string,
): Promise<KpiOverview> {
  const params = { library_id: libraryId, period, ...dateParams(dateFrom, dateTo) }
  const { data } = await apiClient.get('/dashboard/overview', { params })
  return data
}

export async function fetchChannels(
  libraryId: string,
  period: Period,
  dateFrom?: string,
  dateTo?: string,
): Promise<ChannelMetric[]> {
  const params = { library_id: libraryId, period, ...dateParams(dateFrom, dateTo) }
  const { data } = await apiClient.get('/dashboard/channels', { params })
  return data
}

export async function fetchChannelTrend(
  libraryId: string,
  channelId: string,
  period: Period,
  dateFrom?: string,
  dateTo?: string,
): Promise<ChannelTrendPoint[]> {
  const params = { library_id: libraryId, channel_id: channelId, period, ...dateParams(dateFrom, dateTo) }
  const { data } = await apiClient.get('/dashboard/channels/trend', { params })
  return data
}

export async function fetchBehavior(
  libraryId: string,
  period: Period,
  dateFrom?: string,
  dateTo?: string,
): Promise<BehaviorData> {
  const params = { library_id: libraryId, period, ...dateParams(dateFrom, dateTo) }
  const { data } = await apiClient.get('/dashboard/behavior', { params })
  return data
}

export async function fetchEngagement(
  libraryId: string,
  period: Period,
  dateFrom?: string,
  dateTo?: string,
): Promise<EngagementData> {
  const params = { library_id: libraryId, period, ...dateParams(dateFrom, dateTo) }
  const { data } = await apiClient.get('/dashboard/engagement', { params })
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
  dateFrom?: string,
  dateTo?: string,
): Promise<Insight[]> {
  const params = { library_id: libraryId, period, ...dateParams(dateFrom, dateTo) }
  const { data } = await apiClient.get('/dashboard/insights', { params })
  return data
}

export async function fetchVkDashboard(
  libraryId: string,
  period: Period,
  dateFrom?: string,
  dateTo?: string,
): Promise<VkStatsResponse> {
  const params = { library_id: libraryId, period, ...dateParams(dateFrom, dateTo) }
  const { data } = await apiClient.get('/dashboard/vk', { params })
  return data
}
