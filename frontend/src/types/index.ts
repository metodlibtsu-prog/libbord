export type Period = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year'

export type ChannelType = 'website' | 'e_library' | 'catalog' | 'telegram' | 'vk' | 'mobile_app' | 'other'

export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface Library {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface MetricCounter {
  id: string
  library_id: string
  name: string
  yandex_counter_id: string
  is_active: boolean
  last_sync_at: string | null
  sync_status: 'idle' | 'syncing' | 'success' | 'error'
  sync_error_message: string | null
  created_at: string
}

export interface Channel {
  id: string
  library_id: string
  type: ChannelType
  custom_name: string | null
  is_manual: boolean
  created_at: string
}

// Dashboard responses
export interface KpiOverview {
  views: number
  visits: number
  users: number
  active_users: number
  views_delta_pct: number | null
  visits_delta_pct: number | null
  users_delta_pct: number | null
  active_users_delta_pct: number | null
}

export interface ChannelMetric {
  channel_id: string
  channel_type: ChannelType
  custom_name: string | null
  views: number
  visits: number
  users: number
}

export interface ChannelTrendPoint {
  date: string
  views: number
  visits: number
  users: number
}

export interface BehaviorPoint {
  date: string
  avg_time: number
  depth: number
  bounce_rate: number
  return_rate: number
}

export interface CounterBehaviorTimeline {
  counter_id: string
  counter_name: string
  timeline: BehaviorPoint[]
  current_avg_time: number
  current_depth: number
  current_bounce_rate: number
  current_return_rate: number
}

export interface BehaviorData {
  counters: CounterBehaviorTimeline[]
  avg_time_delta_pct: number | null
  depth_delta_pct: number | null
  bounce_rate_delta_pct: number | null
  return_rate_delta_pct: number | null
}

export interface EngagementPoint {
  date: string
  likes: number
  reposts: number
  comments: number
}

export interface EngagementData {
  timeline: EngagementPoint[]
  total_likes: number
  total_reposts: number
  total_comments: number
  likes_delta_pct: number | null
  reposts_delta_pct: number | null
  comments_delta_pct: number | null
}

export interface ReviewItem {
  id: string
  platform: string
  date: string
  rating: number | null
  text: string | null
  sentiment: Sentiment
}

export interface ReviewsResponse {
  items: ReviewItem[]
  total: number
}

export interface Insight {
  block: string
  severity: 'info' | 'warning' | 'alert'
  message: string
}
