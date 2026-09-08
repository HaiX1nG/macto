/**
 * Status Utility Functions and Constants
 *
 * Shared status color mappings and status-related utilities.
 */

import type { UserStatus } from '@shared/types/auth'

/**
 * Status color mapping for user presence indicators
 *
 * Maps each user status to its corresponding Tailwind CSS background color class.
 */
export const statusColorMap: Record<UserStatus, string> = {
  online: 'bg-[var(--color-online)]',
  idle: 'bg-[var(--color-idle)]',
  dnd: 'bg-[var(--color-dnd)]',
  offline: 'bg-[var(--color-offline)]',
}

/**
 * Extended status colors with shadow effects for indicators
 */
export const statusColorsWithShadow = {
  online: 'bg-[var(--color-online)] shadow-[var(--color-online)]/30',
  offline: 'bg-[var(--color-offline)]',
  speaking: 'bg-[var(--color-primary)] shadow-[var(--color-primary)]/30 animate-pulse',
} as const

/**
 * Status label mapping for display
 */
export const statusLabelMap: Record<UserStatus, string> = {
  online: '在线',
  idle: '离开',
  dnd: '勿扰',
  offline: '离线',
}

/**
 * Audio status label mapping
 */
export const audioStatusLabelMap = {
  muted: '静音',
  deafened: '免提',
  speaking: '说话中',
  speakingNow: '说话中...',
  online: '在线',
} as const

/**
 * Get the status color class for a given user status
 *
 * @param status - The user status
 * @returns Tailwind CSS class string for the status color
 *
 * @example
 * ```tsx
 * const colorClass = getStatusColor('online')
 * // Returns 'bg-[var(--color-online)]'
 * ```
 */
export function getStatusColor(status: UserStatus): string {
  return statusColorMap[status]
}

/**
 * Get the status label for display
 *
 * @param status - The user status
 * @returns Human-readable status label in Chinese
 *
 * @example
 * ```tsx
 * const label = getStatusLabel('online')
 * // Returns '在线'
 * ```
 */
export function getStatusLabel(status: UserStatus): string {
  return statusLabelMap[status]
}

/**
 * Get audio status label based on participant state
 *
 * @param isMuted - Whether the participant is muted
 * @param isDeafened - Whether the participant is deafened
 * @param isSpeaking - Whether the participant is speaking
 * @returns Human-readable audio status label
 *
 * @example
 * ```tsx
 * const label = getAudioStatusLabel(true, false, false)
 * // Returns '静音'
 * ```
 */
export function getAudioStatusLabel(
  isMuted: boolean,
  isDeafened: boolean,
  isSpeaking: boolean
): string {
  if (isMuted) return audioStatusLabelMap.muted
  if (isDeafened) return audioStatusLabelMap.deafened
  if (isSpeaking) return audioStatusLabelMap.speakingNow
  return audioStatusLabelMap.online
}
