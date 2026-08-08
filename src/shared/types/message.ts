/**
 * Message Domain Types
 *
 * Mirrors backend message_dto.go and model/channel_message.go.
 */

import type { PaginationParams } from './common'

export const MessageType = {
  Text: 1,
  Image: 2,
  System: 3,
} as const
export type MessageType = (typeof MessageType)[keyof typeof MessageType]

export interface MessageAttachment {
  id: number
  messageId: number
  filename: string
  url: string
  fileSize: number
  mimeType: string
  createdAt: string
}

export interface MessageReaction {
  emoji: string
  count: number
  users: number[] // userId list
}

export interface ChannelMessage {
  id: number
  channelId: number
  senderUserId: number
  senderName: string
  senderAvatarUrl: string
  type: MessageType
  content: string
  replyToId: number | null
  replyTo?: ChannelMessage | null
  editedAt: string | null
  isPinned: boolean
  attachments: MessageAttachment[]
  reactions: MessageReaction[]
  createdAt: string
}

// ==================== Request / Response DTOs ====================

export interface SendMessageRequest {
  type: MessageType
  content: string
  replyToId?: number
}

export interface UpdateMessageRequest {
  content: string
}

export interface ReactionRequest {
  emoji: string
}

export interface MessageListParams extends PaginationParams {
  before?: number // cursor pagination: fetch messages before this ID
}
