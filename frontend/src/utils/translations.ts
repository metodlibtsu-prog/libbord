/**
 * Русские переводы для Libboard
 */

import { ChannelType } from '../types';

/**
 * Переводы типов каналов
 */
export const channelTypeLabels: Record<ChannelType, string> = {
  website: 'Сайт библиотеки',
  e_library: 'Электронная библиотека',
  catalog: 'Электронный каталог',
  telegram: 'Telegram-канал',
  vk: 'ВКонтакте',
  mobile_app: 'Мобильное приложение',
  other: 'Другой ресурс',
};

/**
 * Переводы платформ для отзывов
 */
export const platformLabels: Record<string, string> = {
  yandex_maps: 'Яндекс Карты',
  google_maps: 'Google Maps',
  '2gis': '2ГИС',
  other: 'Другое',
};

/**
 * Переводы тональности отзывов
 */
export const sentimentLabels = {
  positive: 'Положительный',
  neutral: 'Нейтральный',
  negative: 'Негативный',
};

/**
 * Переводы статусов синхронизации
 */
export const syncStatusLabels = {
  idle: 'Готов к синхронизации',
  syncing: 'Синхронизация...',
  success: 'Синхронизировано',
  error: 'Ошибка синхронизации',
};

/**
 * Перевести тип канала на русский
 */
export function translateChannelType(type: ChannelType): string {
  return channelTypeLabels[type] || type;
}

/**
 * Перевести платформу на русский
 */
export function translatePlatform(platform: string): string {
  return platformLabels[platform] || platform;
}

/**
 * Перевести тональность на русский
 */
export function translateSentiment(sentiment: string): string {
  return sentimentLabels[sentiment as keyof typeof sentimentLabels] || sentiment;
}

/**
 * Перевести статус синхронизации на русский
 */
export function translateSyncStatus(status: string): string {
  return syncStatusLabels[status as keyof typeof syncStatusLabels] || status;
}
