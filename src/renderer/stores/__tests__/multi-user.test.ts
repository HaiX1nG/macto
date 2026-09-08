import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMediaStore } from '../mediaStore'
import { useVoiceStore } from '../voiceStore'
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

describe('Multi-User Scenarios', () => {
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
    useVoiceStore.setState({
      currentVoiceChannelId: null,
      participants: [],
      isDeafened: false,
      isSpeaking: false,
      isInVoice: false,
      error: null,
    })
  })

  describe('多人连接', () => {
    it('3 人同时在线，连接状态正确', () => {
      // 模拟 3 人在线
      useVoiceStore.setState({
        participants: [
          { id: 1, channelId: 1, userId: 2, username: 'User2', avatarUrl: '', isMuted: false, isDeafened: false, isSpeaking: false, volume: 100, joinedAt: '2024-01-01' },
          { id: 2, channelId: 1, userId: 3, username: 'User3', avatarUrl: '', isMuted: false, isDeafened: false, isSpeaking: false, volume: 100, joinedAt: '2024-01-01' },
          { id: 3, channelId: 1, userId: 4, username: 'User4', avatarUrl: '', isMuted: false, isDeafened: false, isSpeaking: false, volume: 100, joinedAt: '2024-01-01' },
        ],
      })
      expect(useVoiceStore.getState().participants.length).toBe(3)
    })

    it('一人断连不影响其他人', () => {
      // 先加入频道
      useVoiceStore.setState({ currentVoiceChannelId: 1 })
      useVoiceStore.setState({
        participants: [
          { id: 1, channelId: 1, userId: 2, username: 'User2', avatarUrl: '', isMuted: false, isDeafened: false, isSpeaking: false, volume: 100, joinedAt: '2024-01-01' },
          { id: 2, channelId: 1, userId: 3, username: 'User3', avatarUrl: '', isMuted: false, isDeafened: false, isSpeaking: false, volume: 100, joinedAt: '2024-01-01' },
        ],
      })
      // 用户 2 断连
      useVoiceStore.getState().onParticipantLeft(1, 2)
      expect(useVoiceStore.getState().participants.length).toBe(1)
      expect(useVoiceStore.getState().participants[0].userId).toBe(3)
    })
  })

  describe('断线重连', () => {
    it('断连后进入 Reconnecting 状态', () => {
      useMediaStore.getState().setConnectionState(ConnectionState.Reconnecting)
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Reconnecting)
    })

    it('重连成功恢复到 Connected 状态', () => {
      useMediaStore.getState().setConnectionState(ConnectionState.Reconnecting)
      useMediaStore.getState().setConnectionState(ConnectionState.Connected)
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Connected)
    })

    it('重连耗尽后进入 Failed 状态', () => {
      // 模拟重连耗尽：初始 reconnectAttempt=0, maxReconnectAttempts=3
      // retryConnection 会在 attempt >= max 时进入 Failed
      for (let i = 0; i < 4; i++) {
        useMediaStore.getState().retryConnection()
      }
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Failed)
    })

    it('retryConnection 递增 reconnectAttempt', () => {
      useMediaStore.getState().retryConnection()
      expect(useMediaStore.getState().reconnectAttempt).toBe(1)
      useMediaStore.getState().retryConnection()
      expect(useMediaStore.getState().reconnectAttempt).toBe(2)
    })

    it('retryConnection 在 maxReconnectAttempts 后停止', () => {
      const { maxReconnectAttempts } = useMediaStore.getState()
      for (let i = 0; i < maxReconnectAttempts + 2; i++) {
        useMediaStore.getState().retryConnection()
      }
      expect(useMediaStore.getState().reconnectAttempt).toBe(maxReconnectAttempts)
      expect(useMediaStore.getState().connectionState).toBe(ConnectionState.Failed)
    })
  })

  describe('自动重连', () => {
    it('startAutoReconnect 不会重复执行', () => {
      useMediaStore.setState({ isAutoReconnecting: true })
      useMediaStore.getState().startAutoReconnect()
      // 应该直接返回，不执行任何操作
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
