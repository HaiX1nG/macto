/**
 * Shared Participant Types
 *
 * Unified type definitions for participants across the application.
 * This file consolidates participant-related types from various components.
 */

/**
 * User status type for presence indication
 */
export type UserStatus = 'online' | 'away' | 'busy' | 'offline'

/**
 * Base participant interface with common properties
 */
export interface BaseParticipant {
  /** Unique identifier for the participant */
  id: string
  /** Display name of the participant */
  name: string
  /** Optional avatar URL */
  avatar?: string
}

/**
 * Voice channel participant with audio-related properties
 */
export interface VoiceParticipant extends BaseParticipant {
  /** Current status (online, away, busy) */
  status: UserStatus
  /** Whether the participant is muted */
  isMuted?: boolean
  /** Whether the participant is deafened */
  isDeafened?: boolean
  /** Volume level (0-100) */
  volume?: number
}

/**
 * Screen sharing participant with screen-related properties
 */
export interface ScreenParticipant extends BaseParticipant {
  /** Current status (online, away, busy) */
  status: UserStatus
  /** Whether the participant is sharing their screen */
  isSharingScreen?: boolean
}

/**
 * Channel participant for channel views
 */
export interface ChannelParticipant extends BaseParticipant {
  /** Current status (online, away, busy) */
  status: Exclude<UserStatus, 'offline'>
  /** Whether the participant is muted */
  isMuted?: boolean
  /** Whether the participant is deafened */
  isDeafened?: boolean
}

/**
 * Session participant for real-time sessions
 */
export interface SessionParticipant extends BaseParticipant {
  /** Whether the participant is muted */
  isMuted: boolean
  /** Whether the participant is currently speaking */
  isSpeaking: boolean
  /** Volume level (0-100) */
  volume: number
  /** Timestamp when participant joined */
  joinedAt: number
}

/**
 * Full participant with all possible properties
 * Used in ParticipantList component
 */
export interface Participant extends BaseParticipant {
  /** Username (alias for name, used in some contexts) */
  username?: string
  /** Current online status */
  isOnline: boolean
  /** Whether the participant is muted */
  isMuted: boolean
  /** Whether the participant is deafened */
  isDeafened: boolean
  /** Whether the participant is currently speaking */
  isSpeaking: boolean
  /** Whether the participant is streaming */
  isStreaming?: boolean
  /** Whether the participant is screen sharing */
  isScreenSharing?: boolean
}

/**
 * Subcategory participant for subcategory list
 */
export interface SubcategoryParticipant extends BaseParticipant {
  /** Current status (online, away, busy) */
  status: Exclude<UserStatus, 'offline'>
  /** Whether the participant is muted */
  isMuted?: boolean
  /** Whether the participant is deafened */
  isDeafened?: boolean
}

/**
 * Type alias for backward compatibility
 * @deprecated Use specific participant types instead
 */
export type GenericParticipant = VoiceParticipant | ScreenParticipant | ChannelParticipant | SessionParticipant
