/**
 * WebSocket Types
 *
 * Event protocol for the KOOK-style channel-based WebSocket.
 * Connection is per-app (not per-room); subscription via join_channel/leave_channel.
 */

import type { ChannelMessage } from '@shared/types/message'
import type { ServerMember } from '@shared/types/server'

// ==================== Connection Status ====================

export type WebSocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

// ==================== Generic WS Message ====================

export interface WebSocketMessage<T = unknown> {
  event: string
  data: T
}

export type WebSocketMessageHandler = (data: unknown) => void
export type WebSocketEventHandler = () => void

// ==================== C->S Events ====================

export interface JoinChannelPayload {
  channelId: number
}

export interface LeaveChannelPayload {
  channelId: number
}

export interface ChatMessagePayload {
  channelId: number
  type: number
  content: string
  replyToId?: number
}

export interface TypingPayload {
  channelId: number
  isTyping: boolean
}

export interface WebRTCSignalPayload {
  type: 'offer' | 'answer' | 'ice-candidate'
  targetId: number
  payload: string
}

// ==================== S->C Events ====================

export interface ChatMessageEvent {
  channelId: number
  message: ChannelMessage
}

export interface MessageDeleteEvent {
  channelId: number
  messageId: number
}

export interface MessageUpdateEvent {
  channelId: number
  message: ChannelMessage
}

export interface ReactionAddEvent {
  messageId: number
  emoji: string
  userId: number
}

export interface ReactionRemoveEvent {
  messageId: number
  emoji: string
  userId: number
}

export interface VoiceUserJoinedEvent {
  channelId: number
  user: {
    id: number
    userId: number
    username: string
    avatarUrl: string
    isMuted: boolean
    isDeafened: boolean
    isSpeaking: boolean
    volume: number
    joinedAt: string
  }
}

export interface VoiceUserLeftEvent {
  channelId: number
  userId: number
}

export interface VoiceStateUpdateEvent {
  channelId: number
  userId: number
  isMuted?: boolean
  isDeafened?: boolean
  isSpeaking?: boolean
}

export interface ScreenShareStartEvent {
  channelId: number
  userId: number
}

export interface ScreenShareStopEvent {
  channelId: number
  userId: number
}

export interface WebRTCSignalEvent {
  fromUserId: number
  fromUsername: string
  signal: {
    type: 'offer' | 'answer' | 'ice-candidate'
    payload: string
  }
}

export interface MemberJoinedEvent {
  serverId: number
  member: ServerMember
}

export interface MemberLeftEvent {
  serverId: number
  userId: number
}

// ==================== Connection State ====================

export interface ConnectionStatePayload {
  status: WebSocketConnectionStatus
  reconnectAttempt?: number
  maxReconnectAttempts?: number
}

// ==================== Event Map ====================

export interface WSEventMap {
  // S->C events
  chat_message: ChatMessageEvent
  message_delete: MessageDeleteEvent
  message_update: MessageUpdateEvent
  reaction_add: ReactionAddEvent
  reaction_remove: ReactionRemoveEvent
  voice_user_joined: VoiceUserJoinedEvent
  voice_user_left: VoiceUserLeftEvent
  voice_state_update: VoiceStateUpdateEvent
  screen_share_start: ScreenShareStartEvent
  screen_share_stop: ScreenShareStopEvent
  webrtc_signal: WebRTCSignalEvent
  member_joined: MemberJoinedEvent
  member_left: MemberLeftEvent
  connection_state: ConnectionStatePayload
}
