/**
 * signal-events.ts
 *
 * WebSocket 事件清单与 Payload Schema
 *
 * 定义前端 WebSocket 通信的所有事件及其 payload 结构。
 * 本文件是前后端实时通信的单一源真相，所有 WS 事件必须在此注册。
 *
 * 事件方向标记:
 *   S→C: Server to Client (后端推送给前端)
 *   C→S: Client to Server (前端发送给后端)
 *
 * 来源: 从 renderer/types/websocket.ts 和 renderer/services/websocketService.ts 提取
 */

import type { ChannelMessage } from '@shared/types/message'
import type { ServerMember } from '@shared/types/server'
import type { WebRTCMediaType } from '@shared/types/voice'

/** MessageResponse — canonical backend message DTO (from renderer/types/websocket.ts) */
interface MessageResponse {
  id: number
  channelId: number
  senderUserId: number
  senderName: string
  senderAvatar: string | null
  type: number
  content: string
  replyToId?: number | null
  editedAt?: string | null
  isPinned: boolean
  reactions: Array<{ emoji: string; count: number; userIds: number[] }> | null
  attachments: Array<{ id: number; filename: string; url: string; fileSize: number; mimeType: string }> | null
  createdAt: string
}

// ============================================================================
// 事件名联合类型
// ============================================================================

/** S→C 事件名 (Server → Client) */
export type SCEventType =
  | 'chat_message'
  | 'message_delete'
  | 'message_update'
  | 'reaction_add'
  | 'reaction_remove'
  | 'typing'
  | 'voice_user_joined'
  | 'voice_user_left'
  | 'voice_state_update'
  | 'participant_update'
  | 'screen_share_start'
  | 'screen_share_stop'
  | 'webrtc_signal'
  | 'member_joined'
  | 'member_left'
  | 'friend_online'
  | 'friend_request_push'
  | 'friend_request_handled'
  | 'friend_relation_change'
  | 'private_message_push'

/** C→S 事件名 (Client → Server) */
export type CSEventType =
  | 'join_channel'
  | 'leave_channel'
  | 'chat_message'
  | 'typing'
  | 'voice_join'
  | 'voice_leave'
  | 'webrtc_signal'
  | 'screen_share_start'
  | 'screen_share_stop'

/** 所有事件名 */
export type SignalEventType = SCEventType | CSEventType

// ============================================================================
// S→C Payload 定义
// ============================================================================

/** chat_message: 新消息推送 */
export interface ChatMessageEvent {
  channelId: number
  message: MessageResponse
}

/** message_delete: 消息删除 */
export interface MessageDeleteEvent {
  channelId: number
  messageId: number
}

/** message_update: 消息编辑 */
export interface MessageUpdateEvent {
  channelId: number
  message: ChannelMessage
}

/** reaction_add: 添加表情反应 */
export interface ReactionAddEvent {
  messageId: number
  emoji: string
  userId: number
}

/** reaction_remove: 移除表情反应 */
export interface ReactionRemoveEvent {
  messageId: number
  emoji: string
  userId: number
}

/** typing: 正在输入 */
export interface TypingPayload {
  channelId: number
  isTyping: boolean
  userId?: number
}

/** voice_user_joined: 用户加入语音频道 */
export interface VoiceUserJoinedUser {
  id?: number
  userId?: number
  username?: string
  avatarUrl?: string
  isMuted?: boolean
  isDeafened?: boolean
  isSpeaking?: boolean
  volume?: number
  joinedAt?: string
}

/**
 * voice_user_joined: 用户加入语音频道（多态格式）
 *
 * 后端可能发送三种形态:
 * 1. 扁平: { channelId, userId, username, ... }
 * 2. 嵌套: { data: { channelId, user: {...} } }
 * 3. 混合: { channelId, user: {...}, username, ... }
 *
 * 消费者应使用 normalizeVoiceUserJoined() 统一处理
 */
export interface VoiceUserJoinedEvent {
  channelId?: number
  userId?: number
  username?: string
  avatarUrl?: string
  isMuted?: boolean
  isDeafened?: boolean
  isSpeaking?: boolean
  volume?: number
  joinedAt?: string
  user?: VoiceUserJoinedUser
  data?: {
    channelId?: number
    userId?: number
    username?: string
    avatarUrl?: string
    isMuted?: boolean
    isDeafened?: boolean
    isSpeaking?: boolean
    volume?: number
    joinedAt?: string
    user?: VoiceUserJoinedUser
  }
}

/** voice_user_left: 用户离开语音频道 */
export interface VoiceUserLeftEvent {
  channelId: number
  userId: number
}

/** voice_state_update: 语音状态变更（静音/ deafen/ speaking） */
export interface VoiceStateUpdateEvent {
  channelId: number
  userId: number
  isMuted?: boolean
  isDeafened?: boolean
  isSpeaking?: boolean
  volume?: number
}

/** participant_update: 全量参与者列表刷新 */
export interface ParticipantUpdateEvent {
  channelId: number
  participants: Array<{
    id: number
    channelId: number
    userId: number
    username: string
    avatarUrl?: string
    isMuted?: boolean
    isDeafened?: boolean
    isSpeaking?: boolean
    volume?: number
    joinedAt?: string
  }>
}

/** screen_share_start: 屏幕共享开始 */
export interface ScreenShareStartEvent {
  channelId: number
  userId: number
  username?: string
}

/** screen_share_stop: 屏幕共享结束 */
export interface ScreenShareStopEvent {
  channelId: number
  userId: number
}

/** webrtc_signal: WebRTC 信令消息 */
export interface WebRTCSignalEvent {
  fromUserId: number
  fromUsername: string
  mediaType?: WebRTCMediaType
  signal: {
    type: 'offer' | 'answer' | 'ice-candidate'
    payload: string
    mediaType?: WebRTCMediaType
  }
}

/** member_joined: 成员加入服务器 */
export interface MemberJoinedEvent {
  serverId: number
  member: ServerMember
}

/** member_left: 成员离开服务器 */
export interface MemberLeftEvent {
  serverId: number
  userId: number
}

/** friend_online: 好友上下线通知 */
export interface FriendOnlineEvent {
  userId: number
  isOnline: boolean
}

/** friend_request_push: 好友请求推送 */
export interface FriendRequestPushEvent {
  id: number
  senderId: number
  senderName: string
  message: string
  createdAt: string
}

/** friend_request_handled: 好友请求处理结果 */
export interface FriendRequestHandledEvent {
  requestId: number
  senderId: number
  accepted: boolean
}

/** friend_relation_change: 好友关系变更 */
export interface FriendRelationChangeEvent {
  userId: number
  friendId: number
  change: 'deleted' | 'added'
}

/** private_message_push: 私聊消息推送 */
export interface PrivateMessagePushEvent {
  id: number
  senderId: number
  senderName: string
  receiverId: number
  content: string
  isRead: boolean
  createdAt: string
}

// ============================================================================
// C→S Payload 定义
// ============================================================================

/** join_channel: 加入频道 */
export interface JoinChannelPayload {
  channelId: number
}

/** leave_channel: 离开频道 */
export interface LeaveChannelPayload {
  channelId: number
}

/** chat_message: 发送消息 */
export interface ChatMessagePayload {
  channelId: number
  type: number
  content: string
  replyToId?: number
}

/** voice_join: 加入语音频道 */
export interface VoiceJoinPayload {
  channelId: number
}

/** voice_leave: 离开语音频道 */
export interface VoiceLeavePayload {
  channelId: number
}

/** webrtc_signal: WebRTC 信令消息 */
export interface WebRTCSignalPayload {
  type: 'offer' | 'answer' | 'ice-candidate'
  targetId: number
  payload: string
  mediaType?: WebRTCMediaType
}

/** screen_share_start: 开始屏幕共享 */
export interface ScreenShareStartPayload {
  channelId: number
  userId: number
}

/** screen_share_stop: 停止屏幕共享 */
export interface ScreenShareStopPayload {
  channelId: number
  userId: number
}

// ============================================================================
// 错误码定义
// ============================================================================

/**
 * WebSocket 连接错误码
 *
 * 用于标识连接失败的具体原因，前端根据不同的错误码展示对应的用户提示。
 */
export enum WSErrorCode {
  /** 连接超时 */
  ConnectionTimeout = 'connection_timeout',
  /** 信令服务器无响应 */
  ServerUnreachable = 'server_unreachable',
  /** ICE 协商失败 */
  IceNegotiationFailed = 'ice_negotiation_failed',
  /** NAT 穿透失败 */
  NatTraversalFailed = 'nat_traversal_failed',
  /** 房间已满 */
  RoomFull = 'room_full',
  /** 权限拒绝（麦克风/屏幕录制权限被拒绝） */
  PermissionDenied = 'permission_denied',
  /** 对方无响应 */
  NoAnswer = 'no_answer',
  /** 网络断开 */
  NetworkDisconnected = 'network_disconnected',
  /** 未知错误 */
  Unknown = 'unknown',
}

// ============================================================================
// 事件映射表
// ============================================================================

/** 事件名到 payload 类型的映射 */
export interface SignalEventMap {
  // S→C events
  chat_message: ChatMessageEvent
  message_delete: MessageDeleteEvent
  message_update: MessageUpdateEvent
  reaction_add: ReactionAddEvent
  reaction_remove: ReactionRemoveEvent
  typing: TypingPayload
  voice_user_joined: VoiceUserJoinedEvent
  voice_user_left: VoiceUserLeftEvent
  voice_state_update: VoiceStateUpdateEvent
  participant_update: ParticipantUpdateEvent
  screen_share_start: ScreenShareStartEvent
  screen_share_stop: ScreenShareStopEvent
  webrtc_signal: WebRTCSignalEvent
  member_joined: MemberJoinedEvent
  member_left: MemberLeftEvent
  friend_online: FriendOnlineEvent
  friend_request_push: FriendRequestPushEvent
  friend_request_handled: FriendRequestHandledEvent
  friend_relation_change: FriendRelationChangeEvent
  private_message_push: PrivateMessagePushEvent
  // C→S events
  join_channel: JoinChannelPayload
  leave_channel: LeaveChannelPayload
  voice_join: VoiceJoinPayload
  voice_leave: VoiceLeavePayload
}
