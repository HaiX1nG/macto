export type WebSocketMessageType =
  | 'new_message'
  | 'participant_update'
  | 'voice_state'
  | 'typing'
  | 'screen_share'
  | 'connection_state'
  | 'state_sync'

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType
  payload: T
  timestamp?: number
}

export type WebSocketMessageHandler = (data: unknown) => void
export type WebSocketEventHandler = () => void

export interface NewMessagePayload {
  id: number
  roomId: number
  senderUserId: number
  senderName: string
  messageType: 1 | 2 | 3
  content: string
  createdAt: string
}

export interface ParticipantUpdatePayload {
  roomId: number
  action: 'join' | 'leave'
  participant: {
    userId: number
    username: string
    avatarUrl: string
    role: 1 | 2 | 3
    isMuted: boolean
    isScreenSharing: boolean
    joinedAt: string
  }
}

export interface VoiceStatePayload {
  roomId: number
  userId: number
  username: string
  action: 'join' | 'leave' | 'mute' | 'unmute' | 'speaking' | 'stopped_speaking'
  isMuted?: boolean
  isSpeaking?: boolean
}

export interface TypingPayload {
  roomId: number
  userId: number
  username: string
  isTyping: boolean
}

export interface ScreenSharePayload {
  roomId: number
  userId: number
  username: string
  action: 'start' | 'stop'
  screenShareId?: number
}

export interface ConnectionStatePayload {
  status: WebSocketConnectionStatus
  reconnectAttempt?: number
  maxReconnectAttempts?: number
}

export interface StateSyncPayload {
  roomId: number
  participants: Array<{
    userId: number
    username: string
    avatarUrl: string
    role: 1 | 2 | 3
    isMuted: boolean
    isScreenSharing: boolean
    joinedAt: string
  }>
  voiceParticipants: Array<{
    id: number
    roomId: number
    userId: number
    username: string
    joinedAt: string
  }>
  recentMessages: Array<{
    id: number
    roomId: number
    senderUserId: number
    senderName: string
    messageType: 1 | 2 | 3
    content: string
    createdAt: string
  }>
}

export type WebSocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
