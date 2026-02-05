import type { ChannelType } from '@/types'

export const CHANNEL_COLORS: Record<ChannelType, string> = {
  website: '#3B82F6',
  e_library: '#10B981',
  catalog: '#F59E0B',
  telegram: '#0EA5E9',
  vk: '#6366F1',
  mobile_app: '#EC4899',
  other: '#6B7280',
}

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  website: 'Сайт',
  e_library: 'Эл. библиотека',
  catalog: 'Каталог',
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  mobile_app: 'Мобильное приложение',
  other: 'Другое',
}

export const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#10B981',
  neutral: '#6B7280',
  negative: '#EF4444',
}
