/**
 * Time formatting utilities for chat messages
 */

/**
 * Format relative time (e.g., "刚刚", "5分钟前", "昨天")
 */
export function formatRelativeTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return '刚刚'
  }
  if (minutes < 60) {
    return `${minutes}分钟前`
  }
  if (hours < 24) {
    return `${hours}小时前`
  }
  if (days === 1) {
    return '昨天'
  }
  if (days < 7) {
    return `${days}天前`
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks}周前`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months}个月前`
  }
  const years = Math.floor(days / 365)
  return `${years}年前`
}

/**
 * Format time for display (HH:mm)
 */
export function formatTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format full datetime for tooltip (YYYY-MM-DD HH:mm:ss)
 */
export function formatFullDateTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Format date for message divider (e.g., "2024年1月15日")
 */
export function formatDateDivider(timestamp: number | string | Date): string {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return '今天'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Check if two timestamps are on the same day
 */
export function isSameDay(
  timestamp1: number | string | Date,
  timestamp2: number | string | Date
): boolean {
  const date1 = new Date(timestamp1)
  const date2 = new Date(timestamp2)
  return date1.toDateString() === date2.toDateString()
}

/**
 * Check if timestamp is today
 */
export function isToday(timestamp: number | string | Date): boolean {
  const date = new Date(timestamp)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}
