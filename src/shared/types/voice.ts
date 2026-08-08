/**
 * Voice & Screen Share Domain Types
 *
 * Mirrors backend voice_dto.go and model/voice_participant.go.
 */

export interface VoiceParticipant {
  id: number
  channelId: number
  userId: number
  username: string
  avatarUrl: string
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  volume: number
  joinedAt: string
}

export interface SetMuteRequest {
  isMuted: boolean
  isDeafened?: boolean
}

export interface ScreenShareSession {
  id: number
  channelId: number
  userId: number
  username: string
  startedAt: string
  endedAt: string | null
}

export interface WebRTCSignalRequest {
  type: 'offer' | 'answer' | 'ice-candidate'
  targetId?: number
  payload: string
}
