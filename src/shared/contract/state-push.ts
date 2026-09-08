/**
 * state-push.ts
 *
 * 状态推送语义定义
 *
 * 定义连接状态推送的时机和格式——谁在什么时候推送什么状态给谁。
 * 包括状态推送规则、推送频率限制、状态去重策略等。
 *
 * 来源: 从 renderer/hooks/useRoomWebSocket.ts 和 renderer/stores/uiStore.ts 提取
 */

import { ConnectionState, ConnectionFailureCode } from '@shared/types/voice'

// ============================================================================
// 状态推送规则
// ============================================================================

/**
 * 状态推送时机规则
 *
 * 定义服务器应在何时主动推送连接状态给前端。
 */
export const PushTimingRules = {
  /** WebSocket 连接建立成功时 */
  onConnect: ConnectionState.Connecting,
  /** ICE 连接建立成功时 */
  onIceConnected: ConnectionState.Connected,
  /** ICE 连接断开时 */
  onIceDisconnected: ConnectionState.Reconnecting,
  /** ICE 连接失败时 */
  onIceFailed: ConnectionState.Failed,
  /** WebSocket 断开时 */
  onDisconnect: ConnectionState.Disconnected,
  /** 超过 3 秒未建立连接时 */
  onConnectingSlow: ConnectionState.ConnectingSlow,
  /** 重连成功时 */
  onReconnectSuccess: ConnectionState.Connected,
  /** 重连耗尽时 */
  onReconnectExhausted: ConnectionState.Failed,
} as const

// ============================================================================
// 推送频率限制
// ============================================================================

/** 状态推送最小间隔（毫秒） */
export const PUSH_THROTTLE_MS = 500

/** 连接中→连接较慢的超时时间（毫秒） */
export const CONNECTING_SLOW_TIMEOUT_MS = 3000

/** 最大重连尝试次数 */
export const MAX_RECONNECT_ATTEMPTS = 3

/** 重连退避基数（毫秒） */
export const RECONNECT_BACKOFF_BASE_MS = 1000

/** 重连退避上限（毫秒） */
export const RECONNECT_BACKOFF_MAX_MS = 30000

// ============================================================================
// 状态推送格式
// ============================================================================

/**
 * 状态推送消息格式
 *
 * 服务器通过此格式向客户端推送连接状态变更。
 */
export interface StatePushMessage {
  /** 事件名 */
  event: 'connection_state'
  /** 推送时间戳 */
  timestamp: number
  /** 状态 payload */
  data: {
    status: ConnectionState
    reconnectAttempt?: number
    maxReconnectAttempts?: number
    failureCode?: ConnectionFailureCode
    failureMessage?: string
  }
}

// ============================================================================
// 状态去重策略
// ============================================================================

/**
 * 判断两次状态推送是否重复
 *
 * 用于避免频繁推送相同状态导致 UI 闪烁。
 */
export function isDuplicatePush(
  prev: ConnectionState | undefined,
  curr: ConnectionState,
  prevFailureCode: ConnectionFailureCode | undefined,
  currFailureCode: ConnectionFailureCode | undefined
): boolean {
  if (prev === curr && prevFailureCode === currFailureCode) {
    return true
  }
  return false
}

// ============================================================================
// 重连退避计算
// ============================================================================

/**
 * 计算重连退避时间
 *
 * 使用指数退避算法，避免重连风暴。
 */
export function calculateReconnectBackoff(attempt: number): number {
  const backoff = RECONNECT_BACKOFF_BASE_MS * Math.pow(2, attempt - 1)
  return Math.min(backoff, RECONNECT_BACKOFF_MAX_MS)
}

// ============================================================================
// 状态转换合法性检查
// ============================================================================

/**
 * 合法状态转换表
 *
 * 定义哪些状态可以转换到哪些状态，非法转换会被忽略。
 */
export const ValidTransitions: Record<ConnectionState, ConnectionState[]> = {
  [ConnectionState.Disconnected]: [ConnectionState.Connecting],
  [ConnectionState.Connecting]: [ConnectionState.Connected, ConnectionState.ConnectingSlow, ConnectionState.Failed, ConnectionState.Disconnected],
  [ConnectionState.ConnectingSlow]: [ConnectionState.Connected, ConnectionState.Failed, ConnectionState.Disconnected],
  [ConnectionState.Connected]: [ConnectionState.Reconnecting, ConnectionState.Disconnected, ConnectionState.Failed],
  [ConnectionState.Reconnecting]: [ConnectionState.Connected, ConnectionState.Failed, ConnectionState.Disconnected],
  [ConnectionState.Failed]: [ConnectionState.Connecting, ConnectionState.Disconnected],
}

/**
 * 检查状态转换是否合法
 */
export function isValidTransition(from: ConnectionState, to: ConnectionState): boolean {
  const allowed = ValidTransitions[from]
  return allowed.includes(to)
}
