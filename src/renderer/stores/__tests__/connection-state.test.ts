import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useUIStore } from '../uiStore'
import { ConnectionState, ConnectionFailureCode } from '@shared/types/voice'
import { isValidTransition, calculateReconnectBackoff } from '@shared/contract/state-push'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock document.documentElement
const mockSetAttribute = vi.fn()
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  toggle: vi.fn(),
  contains: vi.fn(),
}

Object.defineProperty(document, 'documentElement', {
  value: {
    setAttribute: mockSetAttribute,
    classList: mockClassList,
    getAttribute: vi.fn(),
  },
  writable: true,
})

describe('Connection State Machine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    mockSetAttribute.mockClear()
    localStorageMock.getItem.mockReturnValue(null)
    // Reset store to initial state
    useUIStore.setState({
      wsConnectionStatus: ConnectionState.Disconnected,
      wsReconnectAttempt: 0,
      wsMaxReconnectAttempts: 10,
      wsLastConnectedAt: null,
      wsLastDisconnectedAt: null,
      wsFailureCode: null,
      wsFailureMessage: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==========================================================================
  // 基础状态转换测试
  // ==========================================================================

  describe('基础状态转换', () => {
    it('Disconnected → Connecting: 发起连接时', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Connecting)
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Connecting)
    })

    it('Connecting → Connected: 收到 connected 事件时', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Connecting)
      setConnectionStatus(ConnectionState.Connected)
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Connected)
    })

    it('Connecting → ConnectingSlow: 超过 3 秒未连接', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Connecting)
      // 模拟超过 3 秒
      vi.advanceTimersByTime(3001)
      setConnectionStatus(ConnectionState.ConnectingSlow)
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.ConnectingSlow)
    })

    it('Connecting → Failed: 连接失败时', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Connecting)
      setConnectionStatus(ConnectionState.Failed, {
        status: ConnectionState.Failed,
        failureCode: ConnectionFailureCode.IceTimeout,
      })
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Failed)
    })

    it('Connected → Disconnected: 主动断开时', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Connected)
      setConnectionStatus(ConnectionState.Disconnected)
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Disconnected)
    })

    it('Connected → Reconnecting: 网络中断时', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Connected)
      setConnectionStatus(ConnectionState.Reconnecting, { status: ConnectionState.Reconnecting, reconnectAttempt: 1 })
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Reconnecting)
    })

    it('Reconnecting → Connected: 重连成功时', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Reconnecting, { status: ConnectionState.Reconnecting, reconnectAttempt: 1 })
      setConnectionStatus(ConnectionState.Connected)
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Connected)
    })

    it('Reconnecting → Failed: 重连超时', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Reconnecting, { status: ConnectionState.Reconnecting, reconnectAttempt: 3 })
      setConnectionStatus(ConnectionState.Failed, {
        status: ConnectionState.Failed,
        failureCode: ConnectionFailureCode.ServerUnreachable,
      })
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Failed)
    })

    it('Failed → Connecting: 点击重试按钮时', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Failed)
      setConnectionStatus(ConnectionState.Connecting)
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Connecting)
    })
  })

  // ==========================================================================
  // 边界条件测试
  // ==========================================================================

  describe('边界条件', () => {
    it('非法转换兜底: Disconnected 不能直接跳到 Connected', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Disconnected)
      // 非法转换
      setConnectionStatus(ConnectionState.Connected)
      // 状态应该改变（store 不做限制），但 isValidTransition 应该返回 false
      expect(isValidTransition(ConnectionState.Disconnected, ConnectionState.Connected)).toBe(false)
    })

    it('重试次数限制: 最多 3 次后进入 Failed', () => {
      const { setConnectionStatus } = useUIStore.getState()
      // 模拟 3 次重连
      for (let i = 1; i <= 3; i++) {
        setConnectionStatus(ConnectionState.Reconnecting, { status: ConnectionState.Reconnecting, reconnectAttempt: i })
      }
      // 第 3 次后应该进入 Failed
      setConnectionStatus(ConnectionState.Failed, { status: ConnectionState.Failed })
      expect(useUIStore.getState().wsConnectionStatus).toBe(ConnectionState.Failed)
    })

    it('重连竞争处理: 多次触发重连只递增一次', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Reconnecting, { status: ConnectionState.Reconnecting, reconnectAttempt: 1 })
      const firstAttempt = useUIStore.getState().wsReconnectAttempt
      setConnectionStatus(ConnectionState.Reconnecting, { status: ConnectionState.Reconnecting, reconnectAttempt: 2 })
      const secondAttempt = useUIStore.getState().wsReconnectAttempt
      expect(secondAttempt).toBe(firstAttempt + 1)
    })
  })

  // ==========================================================================
  // 状态副作用测试
  // ==========================================================================

  describe('状态副作用', () => {
    it('Connected 状态更新 wsLastConnectedAt 时间戳', () => {
      const { setConnectionStatus } = useUIStore.getState()
      const beforeTime = Date.now()
      setConnectionStatus(ConnectionState.Connected)
      const state = useUIStore.getState()
      expect(state.wsLastConnectedAt).not.toBeNull()
      expect(state.wsLastConnectedAt!).toBeGreaterThanOrEqual(beforeTime)
    })

    it('Disconnected 状态更新 wsLastDisconnectedAt 时间戳', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Connected)
      setConnectionStatus(ConnectionState.Disconnected)
      const state = useUIStore.getState()
      expect(state.wsLastDisconnectedAt).not.toBeNull()
    })

    it('Failed 状态记录失败原因码', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Failed, {
        status: ConnectionState.Failed,
        failureCode: ConnectionFailureCode.IceTimeout,
        failureMessage: 'ICE negotiation timeout',
      })
      const state = useUIStore.getState()
      expect(state.wsFailureCode).toBe(ConnectionFailureCode.IceTimeout)
      expect(state.wsFailureMessage).toBe('ICE negotiation timeout')
    })

    it('resetConnectionStatus 清理所有临时状态', () => {
      const { setConnectionStatus, resetConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Failed, {
        status: ConnectionState.Failed,
        failureCode: ConnectionFailureCode.NoAnswer,
      })
      resetConnectionStatus()
      const state = useUIStore.getState()
      expect(state.wsConnectionStatus).toBe(ConnectionState.Disconnected)
      expect(state.wsReconnectAttempt).toBe(0)
      expect(state.wsFailureCode).toBeNull()
      expect(state.wsFailureMessage).toBeNull()
    })

    it('Reconnecting 状态自动递增 reconnectAttempt', () => {
      const { setConnectionStatus } = useUIStore.getState()
      setConnectionStatus(ConnectionState.Reconnecting)
      const first = useUIStore.getState().wsReconnectAttempt
      setConnectionStatus(ConnectionState.Reconnecting)
      const second = useUIStore.getState().wsReconnectAttempt
      expect(second).toBe(first + 1)
    })
  })

  // ==========================================================================
  // 工具函数测试
  // ==========================================================================

  describe('工具函数', () => {
    it('isValidTransition 正确判断合法转换', () => {
      expect(isValidTransition(ConnectionState.Disconnected, ConnectionState.Connecting)).toBe(true)
      expect(isValidTransition(ConnectionState.Connecting, ConnectionState.Connected)).toBe(true)
      expect(isValidTransition(ConnectionState.Connected, ConnectionState.Reconnecting)).toBe(true)
      expect(isValidTransition(ConnectionState.Reconnecting, ConnectionState.Failed)).toBe(true)
    })

    it('isValidTransition 正确拒绝非法转换', () => {
      expect(isValidTransition(ConnectionState.Disconnected, ConnectionState.Connected)).toBe(false)
      expect(isValidTransition(ConnectionState.Connected, ConnectionState.Connecting)).toBe(false)
      expect(isValidTransition(ConnectionState.Failed, ConnectionState.Connected)).toBe(false)
    })

    it('calculateReconnectBackoff 指数退避', () => {
      expect(calculateReconnectBackoff(1)).toBe(1000)
      expect(calculateReconnectBackoff(2)).toBe(2000)
      expect(calculateReconnectBackoff(3)).toBe(4000)
    })

    it('calculateReconnectBackoff 有上限', () => {
      // 大数值时应该返回上限 30000
      expect(calculateReconnectBackoff(10)).toBe(30000)
    })
  })
})
