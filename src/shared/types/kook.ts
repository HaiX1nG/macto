// KOOK 风格应用核心类型定义

// ==================== 用户相关 ====================

export interface User {
  id: string
  name: string
  displayName: string
  avatar?: string
  status: 'online' | 'idle' | 'dnd' | 'offline'
  customStatus?: string
  banner?: string
  bio?: string
}

export interface CurrentUser extends User {
  email?: string
  locale: string
  createdAt: number
}

// ==================== 服务器相关 ====================

export interface Server {
  id: string
  name: string
  icon?: string
  banner?: string
  description?: string
  ownerId: string
  channels: Channel[]
  roles: Role[]
  memberCount: number
  createdAt: number
}

export interface Role {
  id: string
  serverId: string
  name: string
  color: string
  position: number
  permissions: Permission[]
}

export interface Permission {
  name: string
  allowed: boolean
}

export interface ServerMember {
  id: string
  serverId: string
  userId: string
  user: User
  nickname?: string
  roles: string[]
  joinedAt: number
  isOwner: boolean
}

// ==================== 频道相关 ====================

export interface Channel {
  id: string
  serverId: string
  name: string
  type: 'text' | 'voice' | 'category'
  topic?: string
  position: number
  parentId?: string
  unreadCount?: number
  lastMessageId?: string
}

export interface TextChannel extends Channel {
  type: 'text'
  topic?: string
  slowMode?: number
}

export interface VoiceChannel extends Channel {
  type: 'voice'
  bitrate: number
  userLimit?: number
  participants: VoiceParticipant[]
}

export interface VoiceParticipant {
  id: string
  userId: string
  user: User
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  volume: number
  joinedAt: number
}

// ==================== 消息相关 ====================

export interface Message {
  id: string
  channelId: string
  authorId: string
  author: User
  content: string
  timestamp: number
  editedTimestamp?: number
  edited?: boolean
  mentions?: User[]
  attachments?: Attachment[]
  reactions?: Reaction[]
  replyTo?: Message
  pinned?: boolean
}

export interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  type: 'image' | 'video' | 'audio' | 'file'
}

export interface Reaction {
  emoji: string
  count: number
  users: string[]
}

// ==================== UI 状态 ====================

export interface AppState {
  currentServerId: string | null
  currentChannelId: string | null
  currentVoiceChannelId: string | null
  isSidebarCollapsed: boolean
  isMemberListCollapsed: boolean
}

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline'