// API Types - Matching Go Backend DTOs

// ==================== Auth Types ====================

export interface RegisterRequest {
  username: string
  password: string
  email: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  userId: number
  username: string
  email: string
  avatarUrl: string
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  avatarUrl?: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface UserInfoResponse {
  userId: number
  username: string
  email: string
  avatarUrl: string
  createdAt: string
}

// ==================== Room Types ====================

export interface CreateRoomRequest {
  roomName: string
  roomType: RoomType
  isPrivate: boolean
  maxParticipants?: number
}

export interface JoinRoomRequest {
  inviteCode?: string
}

export interface RoomInfoResponse {
  id: number
  roomName: string
  roomType: RoomType
  hostUserId: number
  isPrivate: boolean
  inviteCode?: string
  maxParticipants: number
  currentPlaylistItemId?: number
  participantCount: number
  createdAt: string
}

export interface ParticipantResponse {
  userId: number
  username: string
  avatarUrl: string
  role: ParticipantRole
  isMuted: boolean
  isScreenSharing: boolean
  joinedAt: string
}

export interface RoomListRequest {
  page?: number
  pageSize?: number
  roomType?: RoomType
}

export type RoomType = 1 | 2 | 3 | 4 // 1: 语音房, 2: 视频房, 3: 直播房, 4: 自定义
export type ParticipantRole = 1 | 2 | 3 // 1: 房主, 2: 管理员, 3: 普通用户

// ==================== Playlist Types ====================

export interface AddPlaylistItemRequest {
  title: string
  artist?: string
  musicUrl: string
  duration?: number
}

export interface PlaylistItemResponse {
  id: number
  title: string
  artist: string
  musicUrl: string
  duration: number
  playOrder: number
  status: PlaylistItemStatus
  addedBy: number
}

export interface ReorderPlaylistRequest {
  itemIds: number[]
}

export type PlaylistItemStatus = 1 | 2 | 3 // 1: 待播放, 2: 播放中, 3: 已播放

// ==================== Chat Types ====================

export interface SendMessageRequest {
  messageType: MessageType
  content: string
}

export interface MessageResponse {
  id: number
  roomId: number
  senderUserId: number
  senderName: string
  messageType: MessageType
  content: string
  createdAt: string
}

export interface MessageListRequest {
  page?: number
  pageSize?: number
}

export type MessageType = 1 | 2 | 3 // 1: 文本, 2: 图片, 3: 系统

// ==================== Screen Share Types ====================

export interface ScreenShareResponse {
  id: number
  roomId: number
  userId: number
  username: string
  startedAt: string
}

// ==================== Voice Types ====================

export interface VoiceSessionResponse {
  id: number
  roomId: number
  userId: number
  username: string
  joinedAt: string
}

export interface WebRTCSignalRequest {
  type: 'offer' | 'answer' | 'ice-candidate'
  targetId?: number
  payload: string
}

// ==================== Common Types ====================

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
