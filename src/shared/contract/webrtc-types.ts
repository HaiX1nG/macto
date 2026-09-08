/**
 * webrtc-types.ts
 *
 * WebRTC 信令消息格式定义
 *
 * 定义 WebRTC 连接建立和维护所需的所有信令消息结构。
 * 包括 SDP Offer/Answer、ICE Candidate、媒体类型等。
 *
 * 来源: 从 shared/types/voice.ts 和 renderer/types/websocket.ts 提取
 */

import { ConnectionState, ConnectionFailureCode } from '@shared/types/voice'

// ============================================================================
// 媒体类型
// ============================================================================

/** WebRTC 媒体类型 */
export type WebRTCMediaType = 'voice' | 'screen'

// ============================================================================
// 信令消息类型
// ============================================================================

/** WebRTC 信令消息类型 */
export type SignalMessageType = 'offer' | 'answer' | 'ice-candidate'

// ============================================================================
// SDP Offer/Answer
// ============================================================================

/** SDP Offer 消息 */
export interface SdpOffer {
  type: 'offer'
  /** SDP 描述字符串 */
  sdp: string
  /** 媒体类型 */
  mediaType: WebRTCMediaType
  /** 发送者用户 ID */
  senderId: number
  /** 接收者用户 ID */
  targetId?: number
}

/** SDP Answer 消息 */
export interface SdpAnswer {
  type: 'answer'
  /** SDP 描述字符串 */
  sdp: string
  /** 媒体类型 */
  mediaType: WebRTCMediaType
  /** 发送者用户 ID */
  senderId: number
  /** 接收者用户 ID */
  targetId?: number
}

// ============================================================================
// ICE Candidate
// ============================================================================

/** ICE Candidate 消息 */
export interface IceCandidate {
  type: 'ice-candidate'
  /** ICE Candidate 字符串 */
  candidate: string
  /** SDP Media Stream 索引 */
  sdpMid?: string
  /** SDP 行索引 */
  sdpMLineIndex?: number
  /** 媒体类型 */
  mediaType: WebRTCMediaType
  /** 发送者用户 ID */
  senderId: number
  /** 接收者用户 ID */
  targetId?: number
}

// ============================================================================
// 统一信令消息
// ============================================================================

/** WebRTC 信令请求（前端发送） */
export interface WebRTCSignalRequest {
  type: SignalMessageType
  targetId?: number
  payload: string
  mediaType?: WebRTCMediaType
}

/** WebRTC 信令事件（服务器推送） */
export interface WebRTCSignalEvent {
  fromUserId: number
  fromUsername: string
  mediaType?: WebRTCMediaType
  signal: {
    type: SignalMessageType
    payload: string
    mediaType?: WebRTCMediaType
  }
}

// ============================================================================
// 连接状态
// ============================================================================

/** 重新导出 ConnectionState 以便信令服务器使用 */
export { ConnectionState, ConnectionFailureCode }

/** 连接状态文本描述 */
export const ConnectionStateText: Record<ConnectionState, string> = {
  [ConnectionState.Disconnected]: '已断开',
  [ConnectionState.Connecting]: '连接中...',
  [ConnectionState.ConnectingSlow]: '连接中（网络较慢）...',
  [ConnectionState.Connected]: '已连接',
  [ConnectionState.Reconnecting]: '正在重连...',
  [ConnectionState.Failed]: '连接失败',
}

/** 连接失败错误文本描述 */
export const ConnectionFailureText: Record<ConnectionFailureCode, string> = {
  [ConnectionFailureCode.NoAnswer]: '对方已断开，等待重连...',
  [ConnectionFailureCode.IceTimeout]: '网络连接失败，正在重试',
  [ConnectionFailureCode.ServerUnreachable]: '无法连接到服务器，请检查网络',
  [ConnectionFailureCode.PermissionDenied]: '需要麦克风/屏幕录制权限',
  [ConnectionFailureCode.NatTraversalFailed]: '网络环境受限，建议检查防火墙设置',
  [ConnectionFailureCode.DeviceNotFound]: '未找到麦克风设备',
  [ConnectionFailureCode.SignalingTimeout]: '信令服务器无响应，正在重连...',
}

// ============================================================================
// Room/Session Types — re-exported from room-types.ts to avoid type drift
// ============================================================================

export {
  RoomState,
  type RoomParticipant,
  type VoiceChannel,
  type ScreenShareSession,
} from './room-types'
