/**
 * Channel Domain Types
 *
 * Mirrors backend channel_dto.go and model/channel.go.
 */

export const ChannelType = {
  Text: 1,
  Voice: 2,
  Category: 3,
} as const
export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType]

export interface Channel {
  id: number
  serverId: number
  name: string
  type: ChannelType
  topic: string
  parentId: number | null
  position: number
  bitrate: number
  userLimit: number
  slowMode: number
  createdAt: string
  updatedAt: string
}

export interface ChannelTreeNode extends Channel {
  children?: Channel[]
  unreadCount?: number
}

// ==================== Request / Response DTOs ====================

export interface CreateChannelRequest {
  name: string
  type: ChannelType
  topic?: string
  parentId?: number
  position?: number
}

export interface UpdateChannelRequest {
  name?: string
  topic?: string
  position?: number
}

export interface ReorderChannelsRequest {
  items: { id: number; position: number; parentId?: number | null }[]
}
