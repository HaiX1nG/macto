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
  /** @deprecated Deafen is local-only and ignored by the REST service. */
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

export type WebRTCMediaType = 'voice' | 'screen'

export interface WebRTCSignalRequest {
  type: 'offer' | 'answer' | 'ice-candidate'
  targetId?: number
  payload: string
  /** Identifies which dedicated peer manager should consume this signal. */
  mediaType?: WebRTCMediaType
}

// ==================== Connection Lifecycle State Machine ====================

/**
 * Connection lifecycle states for voice/screen sharing.
 *
 * State transitions:
 *   disconnected → connecting        : User initiates connection
 *   connecting → connecting_slow     : Connection takes > 3 seconds
 *   connecting → connected           : Connection established
 *   connecting_slow → connected      : Connection established (slow path)
 *   connecting → failed              : Connection failed (unrecoverable)
 *   connecting_slow → failed         : Connection failed after slow attempt
 *   connected → reconnecting         : Connection lost, auto-reconnecting
 *   reconnecting → connected         : Reconnection succeeded
 *   reconnecting → failed            : Reconnection attempts exhausted
 *   failed → connecting              : User clicks retry
 *   any → disconnected               : User manually disconnects
 */
export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  ConnectingSlow = 'connecting_slow',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Failed = 'failed',
}

/**
 * Failure reason codes for connection failures.
 */
export enum ConnectionFailureCode {
  NoAnswer = 'no-answer',
  IceTimeout = 'ice-timeout',
  ServerUnreachable = 'server-unreachable',
  PermissionDenied = 'permission-denied',
  NatTraversalFailed = 'nat-traversal-failed',
  DeviceNotFound = 'device-not-found',
  SignalingTimeout = 'signaling-timeout',
}

/**
 * Extended connection state payload with failure information.
 */
export interface ConnectionStatePayload {
  status: ConnectionState
  reconnectAttempt?: number
  maxReconnectAttempts?: number
  failureCode?: ConnectionFailureCode
  failureMessage?: string
}

/**
 * Helper to get a human-readable status text for a connection state.
 */
export function getConnectionStateText(state: ConnectionState, reconnectAttempt?: number): string {
  switch (state) {
    case ConnectionState.Disconnected:
      return '已断开'
    case ConnectionState.Connecting:
      return '连接中...'
    case ConnectionState.ConnectingSlow:
      return '连接中（网络较慢）...'
    case ConnectionState.Connected:
      return '已连接'
    case ConnectionState.Reconnecting:
      return reconnectAttempt ? `正在重连（${reconnectAttempt}）...` : '正在重连...'
    case ConnectionState.Failed:
      return '连接失败'
    default:
      return '未知状态'
  }
}

/**
 * Helper to get a human-readable error message for a failure code.
 */
export function getConnectionFailureMessage(code: ConnectionFailureCode, reconnectAttempt?: number): string {
  switch (code) {
    case ConnectionFailureCode.IceTimeout:
      return `网络连接失败，正在重试（${reconnectAttempt ?? 0}/3）`
    case ConnectionFailureCode.ServerUnreachable:
      return '无法连接到服务器，请检查网络'
    case ConnectionFailureCode.NoAnswer:
      return '对方已断开，等待重连...'
    case ConnectionFailureCode.PermissionDenied:
      return '需要麦克风/屏幕录制权限'
    case ConnectionFailureCode.NatTraversalFailed:
      return '网络环境受限，建议检查防火墙设置'
    case ConnectionFailureCode.DeviceNotFound:
      return '未找到麦克风设备'
    case ConnectionFailureCode.SignalingTimeout:
      return '信令服务器无响应，正在重连...'
    default:
      return '连接失败'
  }
}
