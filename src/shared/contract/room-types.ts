/**
 * room-types.ts
 *
 * 房间/会话类型定义
 *
 * 定义房间管理相关的数据结构，包括房间状态、参与者信息、
 * 房间操作事件等。
 *
 * 来源: 从 renderer/stores/sessionStore.ts 和 renderer/stores/voiceStore.ts 提取
 */

import type { ConnectionState, ConnectionFailureCode } from '@shared/types/voice'

// ============================================================================
// 房间状态
// ============================================================================

/**
 * 房间生命周期状态
 *
 * State transitions:
 *   idle → joining    : User initiates room join
 *   joining → joined   : Successfully joined room
 *   joining → error    : Failed to join room
 *   joined → leaving   : User initiates room leave
 *   leaving → idle     : Successfully left room
 *   error → joining    : User retries join
 *   any → idle         : Connection lost
 */
export enum RoomState {
  Idle = 'idle',
  Joining = 'joining',
  Joined = 'joined',
  Leaving = 'leaving',
  Error = 'error',
}

// ============================================================================
// 房间参与者
// ============================================================================

/** 房间参与者 */
export interface RoomParticipant {
  /** 用户 ID */
  userId: number
  /** 用户名 */
  username: string
  /** 头像 URL */
  avatarUrl?: string
  /** 是否静音 */
  isMuted: boolean
  /** 是否 deafen */
  isDeafened: boolean
  /** 是否正在说话 */
  isSpeaking: boolean
  /** 音量 0-100 */
  volume: number
  /** 加入时间 */
  joinedAt: string
}

// ============================================================================
// 房间操作事件
// ============================================================================

/** 创建房间请求 */
export interface CreateRoomRequest {
  name: string
}

/** 创建房间响应 */
export interface CreateRoomResponse {
  roomId: string
}

/** 加入房间请求 */
export interface JoinRoomRequest {
  roomId: string
}

/** 加入房间响应 */
export interface JoinRoomResponse {
  success: boolean
  participants?: RoomParticipant[]
  error?: string
}

/** 离开房间请求 */
export interface LeaveRoomRequest {
  roomId: string
}

/** 离开房间响应 */
export interface LeaveRoomResponse {
  success: boolean
}

/** 房间列表响应 */
export interface RoomListResponse {
  rooms: RoomInfo[]
}

/** 房间信息 */
export interface RoomInfo {
  roomId: string
  name: string
  participantCount: number
  maxParticipants: number
}

// ============================================================================
// 语音频道
// ============================================================================

/** 语音频道 */
export interface VoiceChannel {
  channelId: number
  participants: RoomParticipant[]
  state: RoomState
}

// ============================================================================
// 连接状态推送
// ============================================================================

/**
 * 连接状态推送事件
 *
 * 服务器在连接状态变化时主动推送给前端。
 */
export interface ConnectionStatePush {
  status: ConnectionState
  reconnectAttempt?: number
  maxReconnectAttempts?: number
  failureCode?: ConnectionFailureCode
  failureMessage?: string
}

/** 屏幕共享会话 */
export interface ScreenShareSession {
  id: number
  channelId: number
  userId: number
  username: string
  startedAt: string
  endedAt: string | null
}

// ============================================================================
// 房间状态文本
// ============================================================================

/** 房间状态文本描述 */
export const RoomStateText: Record<RoomState, string> = {
  [RoomState.Idle]: '空闲',
  [RoomState.Joining]: '正在加入...',
  [RoomState.Joined]: '已加入',
  [RoomState.Leaving]: '正在离开...',
  [RoomState.Error]: '错误',
}
