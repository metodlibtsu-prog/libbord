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

export function useOverview(libraryId: string) {
  const { period, customFrom, customTo } = usePeriod()
  const hasCustom = customFrom && customTo
  return useQuery({
    queryKey: ['overview', libraryId, period, customFrom, customTo],
    queryFn: () => fetchOverview(libraryId, period, hasCustom ? customFrom : undefined, hasCustom ? customTo : undefined),
    enabled: !!libraryId,
  })
}

export function useChannels(libraryId: string) {
  const { period, customFrom, customTo } = usePeriod()
  const hasCustom = customFrom && customTo
  return useQuery({
    queryKey: ['channels', libraryId, period, customFrom, customTo],
    queryFn: () => fetchChannels(libraryId, period, hasCustom ? customFrom : undefined, hasCustom ? customTo : undefined),
    enabled: !!libraryId,
  })
}

export function useBehavior(libraryId: string) {
  const { period, customFrom, customTo } = usePeriod()
  const hasCustom = customFrom && customTo
  return useQuery({
    queryKey: ['behavior', libraryId, period, customFrom, customTo],
    queryFn: () => fetchBehavior(libraryId, period, hasCustom ? customFrom : undefined, hasCustom ? customTo : undefined),
    enabled: !!libraryId,
  })
}

export function useEngagement(libraryId: string) {
  const { period, customFrom, customTo } = usePeriod()
  const hasCustom = customFrom && customTo
  return useQuery({
    queryKey: ['engagement', libraryId, period, customFrom, customTo],
    queryFn: () => fetchEngagement(libraryId, period, hasCustom ? customFrom : undefined, hasCustom ? customTo : undefined),
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

export function useInsights(libraryId: string) {
  const { period, customFrom, customTo } = usePeriod()
  const hasCustom = customFrom && customTo
  return useQuery({
    queryKey: ['insights', libraryId, period, customFrom, customTo],
    queryFn: () => fetchInsights(libraryId, period, hasCustom ? customFrom : undefined, hasCustom ? customTo : undefined),
    enabled: !!libraryId,
  })
}

export function useVkStats(libraryId: string) {
  const { period, customFrom, customTo } = usePeriod()
  const hasCustom = customFrom && customTo
  return useQuery({
    queryKey: ['vk-dashboard', libraryId, period, customFrom, customTo],
    queryFn: () => fetchVkDashboard(libraryId, period, hasCustom ? customFrom : undefined, hasCustom ? customTo : undefined),
    enabled: !!libraryId,
  })
}
