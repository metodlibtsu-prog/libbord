import type { ChannelType } from '@/types'

// Premium gradient colors для каналов (обновлено для темной темы)
export const CHANNEL_COLORS: Record<ChannelType, string> = {
  website: '#00D4FF', // Cyan
  e_library: '#10B981', // Emerald (сохранен)
  catalog: '#F59E0B', // Amber (сохранен)
  telegram: '#0EA5E9', // Sky
  vk: '#7B2FBE', // Purple (gradient)
  mobile_app: '#FF006E', // Pink (gradient)
  other: '#8B949E', // Gray (темнее)
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
  neutral: '#8B949E',
  negative: '#EF4444',
}

// Новые градиентные утилиты
export const GRADIENT_COLORS = {
  primary: 'linear-gradient(135deg, #00D4FF 0%, #7B2FBE 50%, #FF006E 100%)',
  cyan: 'linear-gradient(135deg, #00D4FF 0%, #0EA5E9 100%)',
  purple: 'linear-gradient(135deg, #7B2FBE 0%, #9333EA 100%)',
  pink: 'linear-gradient(135deg, #FF006E 0%, #EC4899 100%)',
}

// Glow colors для анимаций
export const GLOW_COLORS = {
  cyan: 'rgba(0, 212, 255, 0.5)',
  purple: 'rgba(123, 47, 190, 0.5)',
  pink: 'rgba(255, 0, 110, 0.5)',
}

// Неоновые цвета для графиков
export const NEON_COLORS = ['#00D4FF', '#10B981', '#7B2FBE', '#F59E0B', '#FF006E', '#8B5CF6']
