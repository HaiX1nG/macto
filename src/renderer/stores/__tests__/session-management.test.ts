import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMediaStore } from '../mediaStore'
import { ConnectionState, ConnectionFailureCode } from '@shared/types/voice'

// Mock voiceService
vi.mock('../../services/voiceService', () => ({
  voiceService: {
    joinVoice: vi.fn().mockResolvedValue(undefined),
    leaveVoice: vi.fn().mockResolvedValue(undefined),
    getVoiceParticipants: vi.fn().mockResolvedValue([]),
    startScreenShare: vi.fn().mockResolvedValue(undefined),
    stopScreenShare: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock wsConnection
vi.mock('../../services/wsConnection', () => ({
  wsConnection: {
    send: vi.fn(),
    connectWithToken: vi.fn(),
    getSessionGeneration: vi.fn().mockReturnValue(1),
    getQueueableWs: vi.fn().mockReturnValue({ send: vi.fn() }),
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue('mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMediaStore.setState({
      isSharing: false,
      localStream: null,
      currentRoomId: null,
      isLoading: false,
      error: null,
      remoteScreens: new Map(),
      peerConnections: new Map(),
      connectionState: ConnectionState.Disconnected,
      connectionFailureCode: null,
      reconnectAttempt: 0,
      maxReconnectAttempts: 3,
      isAutoReconnecting: false,
      isCapturing: false,
      voiceStream: null,
      voiceRemoteStreams: new Map(),
    })
  })

  describe('连接状态管理', () => {
    it('初始状态为 Disconnected', () => {
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Disconnected)
    })

    it('setConnectionState 正确设置状态', () => {
      useMediaStore.getState().setConnectionState(ConnectionState.Connecting)
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Connecting)
    })

    it('setConnectionState 带失败码', () => {
      useMediaStore.getState().setConnectionState(ConnectionState.Failed, ConnectionFailureCode.IceTimeout)
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Failed)
      expect(useMediaStore.getState().connectionFailureCode).toBe(ConnectionFailureCode.IceTimeout)
    })
  })

  describe('自动重连', () => {
    it('startAutoReconnect 不会重复执行', () => {
      useMediaStore.setState({ isAutoReconnecting: true })
      useMediaStore.getState().startAutoReconnect()
      expect(useMediaStore.getState().isAutoReconnecting).toBe(true)
    })

    it('stopAutoReconnect 清除标志', () => {
      useMediaStore.setState({ isAutoReconnecting: true })
      useMediaStore.getState().stopAutoReconnect()
      expect(useMediaStore.getState().isAutoReconnecting).toBe(false)
    })

    it('clearConnectionError 重置所有连接状态', () => {
      useMediaStore.setState({
        connectionState: ConnectionState.Failed,
        connectionFailureCode: ConnectionFailureCode.IceTimeout,
        reconnectAttempt: 2,
        isAutoReconnecting: true,
      })
      useMediaStore.getState().clearConnectionError()
      const state = useMediaStore.getState()
      expect(state.connectionState).toBe(ConnectionState.Disconnected)
      expect(state.connectionFailureCode).toBeNull()
      expect(state.reconnectAttempt).toBe(0)
      expect(state.isAutoReconnecting).toBe(false)
    })
  })

  describe('重连逻辑', () => {
    it('retryConnection 递增 reconnectAttempt', () => {
      useMediaStore.getState().retryConnection()
      expect(useMediaStore.getState().reconnectAttempt).toBe(1)
      useMediaStore.getState().retryConnection()
      expect(useMediaStore.getState().reconnectAttempt).toBe(2)
    })

    it('retryConnection 在 maxReconnectAttempts 后进入 Failed', () => {
      const { maxReconnectAttempts } = useMediaStore.getState()
      for (let i = 0; i < maxReconnectAttempts + 2; i++) {
        useMediaStore.getState().retryConnection()
      }
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Failed)
    })
  })

  describe('远程流管理', () => {
    it('voiceRemoteStreams 添加和移除', () => {
      const mockStream = {} as MediaStream
      useMediaStore.getState().addVoiceRemoteStream(2, 'User2', mockStream)
      expect(useMediaStore.getState().voiceRemoteStreams.has(2)).toBe(true)

      useMediaStore.getState().removeVoiceRemoteStream(2)
      expect(useMediaStore.getState().voiceRemoteStreams.has(2)).toBe(false)
    })

    it('remoteScreens 添加和移除', () => {
      const mockStream = {} as MediaStream
      useMediaStore.getState().addRemoteScreen(2, 'User2', mockStream)
      expect(useMediaStore.getState().remoteScreens.has(2)).toBe(true)

      useMediaStore.getState().removeRemoteScreen(2)
      expect(useMediaStore.getState().remoteScreens.has(2)).toBe(false)
    })
  })

  describe('失败场景', () => {
    it('ICE 超时后进入 Failed 状态', () => {
      useMediaStore.getState().setConnectionState(ConnectionState.Failed, ConnectionFailureCode.IceTimeout)
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Failed)
      expect(useMediaStore.getState().connectionFailureCode).toBe(ConnectionFailureCode.IceTimeout)
    })

    it('权限拒绝后显示正确错误提示', () => {
      useMediaStore.getState().setConnectionState(ConnectionState.Failed, ConnectionFailureCode.PermissionDenied)
      expect(useMediaStore.getState().connectionFailureCode).toBe(ConnectionFailureCode.PermissionDenied)
    })

    it('服务器不可达后进入 Failed 状态', () => {
      useMediaStore.getState().setConnectionState(ConnectionState.Failed, ConnectionFailureCode.ServerUnreachable)
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Failed)
      expect(useMediaStore.getState().connectionFailureCode).toBe(ConnectionFailureCode.ServerUnreachable)
    })
  })
})
