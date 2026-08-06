/**
 * Shared Types Index
 *
 * Re-exports all shared type definitions.
 */

export * from './api'
export * from './ipc'
export * from './kook'
// Re-export specific types from participant to avoid conflicts with kook.ts
export type {
  BaseParticipant,
  ScreenParticipant,
  ChannelParticipant,
  SessionParticipant,
  SubcategoryParticipant,
  GenericParticipant
} from './participant'
// Export Participant from participant.ts as UnifiedParticipant to avoid conflict with ipc.ts
export type { Participant as UnifiedParticipant } from './participant'
// Export UserStatus from participant.ts as ParticipantStatus to avoid conflict with kook.ts
export type { UserStatus as ParticipantStatus } from './participant'

export * from './view'
