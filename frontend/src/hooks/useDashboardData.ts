import { useQuery } from '@tanstack/react-query'
import {
  fetchBehavior,
  fetchChannels,
  fetchEngagement,
  fetchInsights,
  fetchOverview,
  fetchReviews,
  fetchVkDashboard,
} from '@/api/dashboard'
import { usePeriod } from '@/context/PeriodContext'

export function useOverview(libraryId: string, counterId?: string) {
  const { period } = usePeriod()
  return useQuery({
    queryKey: ['overview', libraryId, period, counterId],
    queryFn: () => fetchOverview(libraryId, period, counterId),
    enabled: !!libraryId,
  })
}

export function useChannels(libraryId: string) {
  const { period } = usePeriod()
  return useQuery({
    queryKey: ['channels', libraryId, period],
    queryFn: () => fetchChannels(libraryId, period),
    enabled: !!libraryId,
  })
}

export function useBehavior(libraryId: string, counterId?: string) {
  const { period } = usePeriod()
  return useQuery({
    queryKey: ['behavior', libraryId, period, counterId],
    queryFn: () => fetchBehavior(libraryId, period, counterId),
    enabled: !!libraryId,
  })
}

export function useEngagement(libraryId: string) {
  const { period } = usePeriod()
  return useQuery({
    queryKey: ['engagement', libraryId, period],
    queryFn: () => fetchEngagement(libraryId, period),
    enabled: !!libraryId,
  })
}

export function useReviews(libraryId: string) {
  return useQuery({
    queryKey: ['reviews', libraryId],
    queryFn: () => fetchReviews(libraryId),
    enabled: !!libraryId,
  })
}

export function useInsights(libraryId: string, counterId?: string) {
  const { period } = usePeriod()
  return useQuery({
    queryKey: ['insights', libraryId, period, counterId],
    queryFn: () => fetchInsights(libraryId, period, counterId),
    enabled: !!libraryId,
  })
}

export function useVkStats(libraryId: string) {
  const { period } = usePeriod()
  return useQuery({
    queryKey: ['vk-dashboard', libraryId, period],
    queryFn: () => fetchVkDashboard(libraryId, period),
    enabled: !!libraryId,
  })
}
