import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMediaStore } from '../mediaStore'

// Helper to reset store state between tests
const resetMediaStore = () => {
  useMediaStore.setState({
    isSharing: false,
    controlEnabled: false,
    currentStreamId: '',
    localStream: null,
    currentRoomId: null,
    isLoading: false,
    error: null,
    remoteScreens: new Map(),
    peerConnections: new Map(),
    devices: [],
    inputDeviceId: null,
    outputDeviceId: null,
    volume: 100,
    isCapturing: false,
    voiceStream: null,
    voiceRemoteStreams: new Map(),
  })
}

// Mock MediaStream tracks
const mockVideoTrack = {
  kind: 'video' as const,
  id: 'mock-video-track',
  label: 'mock-video',
  enabled: true,
  muted: false,
  onended: null as (() => void) | null,
  stop: vi.fn(),
} as unknown as MediaStreamTrack

const mockAudioTrack = {
  kind: 'audio' as const,
  id: 'mock-audio-track',
  label: 'mock-audio',
  enabled: true,
  muted: false,
  onended: null as (() => void) | null,
  stop: vi.fn(),
} as unknown as MediaStreamTrack

const mockStream = {
  active: true,
  id: 'mock-stream-id',
  onaddtrack: null,
  onremovetrack: null,
  onactive: null,
  oninactive: null,
  getAudioTracks: () => [mockAudioTrack],
  getVideoTracks: () => [mockVideoTrack],
  getTracks: () => [mockAudioTrack, mockVideoTrack],
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  getTrackById: vi.fn(),
  clone: vi.fn(),
} as unknown as MediaStream

// Mock navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue(mockStream),
  getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
  enumerateDevices: vi.fn().mockResolvedValue([
    { kind: 'audioinput', deviceId: 'input-1', label: 'Microphone', groupId: 'group-1', toJSON: () => ({}) } as MediaDeviceInfo,
    { kind: 'audiooutput', deviceId: 'output-1', label: 'Speakers', groupId: 'group-1', toJSON: () => ({}) } as MediaDeviceInfo,
  ]),
}

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
})

describe('useMediaStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMediaStore()
    // Re-establish default mocks after clearAllMocks
    mockMediaDevices.getDisplayMedia = vi.fn().mockResolvedValue(mockStream)
    mockMediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream)
    mockMediaDevices.enumerateDevices = vi.fn().mockResolvedValue([
      { kind: 'audioinput', deviceId: 'input-1', label: 'Microphone', groupId: 'group-1', toJSON: () => ({}) } as MediaDeviceInfo,
      { kind: 'audiooutput', deviceId: 'output-1', label: 'Speakers', groupId: 'group-1', toJSON: () => ({}) } as MediaDeviceInfo,
    ])
    mockVideoTrack.stop = vi.fn()
    mockAudioTrack.stop = vi.fn()
    mockAudioTrack.enabled = true
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useMediaStore.getState()

      // Screen share defaults
      expect(state.isSharing).toBe(false)
      expect(state.controlEnabled).toBe(false)
      expect(state.currentStreamId).toBe('')
      expect(state.localStream).toBeNull()
      expect(state.remoteScreens.size).toBe(0)
      expect(state.peerConnections.size).toBe(0)

      // Audio device defaults
      expect(state.devices).toEqual([])
      expect(state.inputDeviceId).toBeNull()
      expect(state.outputDeviceId).toBeNull()
      expect(state.volume).toBe(100)
      expect(state.isCapturing).toBe(false)
      expect(state.voiceStream).toBeNull()

      // Voice WebRTC defaults
      expect(state.voiceRemoteStreams.size).toBe(0)
    })
  })

  describe('startSharing action', () => {
    it('should start screen sharing successfully', async () => {
      const { startSharing } = useMediaStore.getState()
      await startSharing(123)

      const state = useMediaStore.getState()
      expect(mockMediaDevices.getDisplayMedia).toHaveBeenCalled()
      expect(state.isSharing).toBe(true)
      expect(state.localStream).toBe(mockStream)
    })

    it('should generate unique stream ID', async () => {
      const { startSharing } = useMediaStore.getState()
      await startSharing(123)

      const state = useMediaStore.getState()
      expect(state.currentStreamId).toBeDefined()
      expect(state.currentStreamId).not.toBe('')
    })

    it('should throw error when getDisplayMedia fails', async () => {
      mockMediaDevices.getDisplayMedia.mockRejectedValue(new Error('No screen sharing permission'))

      const { startSharing } = useMediaStore.getState()

      await expect(startSharing(123)).rejects.toThrow('No screen sharing permission')
    })
  })

  describe('stopSharing action', () => {
    it('should stop all tracks and clear state', async () => {
      const { startSharing, stopSharing } = useMediaStore.getState()

      await startSharing(123)
      await stopSharing(123)

      expect(mockVideoTrack.stop).toHaveBeenCalled()
      expect(mockAudioTrack.stop).toHaveBeenCalled()
      expect(useMediaStore.getState().isSharing).toBe(false)
      expect(useMediaStore.getState().localStream).toBeNull()
      expect(useMediaStore.getState().currentStreamId).toBe('')
      expect(useMediaStore.getState().controlEnabled).toBe(false)
    })

    it('should not throw when localStream is null', async () => {
      const { stopSharing } = useMediaStore.getState()

      await expect(stopSharing(123)).resolves.not.toThrow()
    })
  })

  describe('enableControl / disableControl actions', () => {
    it('should enable control', () => {
      const { enableControl } = useMediaStore.getState()
      enableControl()

      expect(useMediaStore.getState().controlEnabled).toBe(true)
    })

    it('should disable control', () => {
      const { enableControl, disableControl } = useMediaStore.getState()

      enableControl()
      expect(useMediaStore.getState().controlEnabled).toBe(true)

      disableControl()
      expect(useMediaStore.getState().controlEnabled).toBe(false)
    })
  })

  describe('remote screens management', () => {
    it('should add remote screen', () => {
      const { addRemoteScreen } = useMediaStore.getState()
      addRemoteScreen(1, 'testuser', mockStream)

      const state = useMediaStore.getState()
      expect(state.remoteScreens.size).toBe(1)
      expect(state.remoteScreens.get(1)).toEqual({
        userId: 1,
        username: 'testuser',
        stream: mockStream,
      })
    })

    it('should remove remote screen', () => {
      const { addRemoteScreen, removeRemoteScreen } = useMediaStore.getState()
      addRemoteScreen(1, 'testuser', mockStream)
      removeRemoteScreen(1)

      expect(useMediaStore.getState().remoteScreens.size).toBe(0)
    })
  })

  describe('peer connections management', () => {
    it('should add peer connection', () => {
      const mockPC = { close: vi.fn() } as unknown as RTCPeerConnection
      const { addPeerConnection } = useMediaStore.getState()
      addPeerConnection(1, mockPC)

      expect(useMediaStore.getState().peerConnections.size).toBe(1)
    })

    it('should remove peer connection and close it', () => {
      const mockPC = { close: vi.fn() } as unknown as RTCPeerConnection
      const { addPeerConnection, removePeerConnection } = useMediaStore.getState()
      addPeerConnection(1, mockPC)
      removePeerConnection(1)

      expect(useMediaStore.getState().peerConnections.size).toBe(0)
      expect(mockPC.close).toHaveBeenCalled()
    })

    it('should get peer connection', () => {
      const mockPC = { close: vi.fn() } as unknown as RTCPeerConnection
      const { addPeerConnection, getPeerConnection } = useMediaStore.getState()
      addPeerConnection(1, mockPC)

      const pc = getPeerConnection(1)
      expect(pc).toBe(mockPC)
    })
  })

  describe('clearAll action', () => {
    it('should clear all state and close connections', async () => {
      const mockPC = { close: vi.fn() } as unknown as RTCPeerConnection
      const { startSharing, addRemoteScreen, addPeerConnection, clearAll } = useMediaStore.getState()

      await startSharing(123)
      addRemoteScreen(1, 'testuser', mockStream)
      addPeerConnection(1, mockPC)

      clearAll()

      const state = useMediaStore.getState()
      expect(state.isSharing).toBe(false)
      expect(state.localStream).toBeNull()
      expect(state.remoteScreens.size).toBe(0)
      expect(state.peerConnections.size).toBe(0)
      expect(mockPC.close).toHaveBeenCalled()
    })
  })

  describe('audio device actions', () => {
    it('should set devices array', () => {
      const { setDevices } = useMediaStore.getState()
      const testDevices: MediaDeviceInfo[] = [
        { kind: 'audioinput', deviceId: '1', label: 'Device 1', groupId: 'group-1', toJSON: () => ({}) } as MediaDeviceInfo,
        { kind: 'audioinput', deviceId: '2', label: 'Device 2', groupId: 'group-2', toJSON: () => ({}) } as MediaDeviceInfo,
      ]

      setDevices(testDevices)

      expect(useMediaStore.getState().devices).toEqual(testDevices)
    })

    it('should set input device ID', () => {
      const { setInputDevice } = useMediaStore.getState()
      setInputDevice('device-123')

      expect(useMediaStore.getState().inputDeviceId).toBe('device-123')
    })

    it('should set output device ID', () => {
      const { setOutputDevice } = useMediaStore.getState()
      setOutputDevice('device-456')

      expect(useMediaStore.getState().outputDeviceId).toBe('device-456')
    })

    it('should set volume', () => {
      const { setVolume } = useMediaStore.getState()
      setVolume(50)

      expect(useMediaStore.getState().volume).toBe(50)
    })

    it('should set stream', () => {
      const { setStream } = useMediaStore.getState()
      setStream(mockStream)

      expect(useMediaStore.getState().voiceStream).toBe(mockStream)
    })
  })

  describe('startCapture action', () => {
    it('should start audio capture successfully', async () => {
      const { startCapture } = useMediaStore.getState()
      await startCapture()

      const state = useMediaStore.getState()
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }),
        })
      )
      expect(state.isCapturing).toBe(true)
      expect(state.voiceStream).toBe(mockStream)
      expect(state.devices.length).toBeGreaterThan(0)
    })

    it('should enumerate devices on startCapture', async () => {
      const { startCapture } = useMediaStore.getState()
      await startCapture()

      const state = useMediaStore.getState()
      expect(state.devices.length).toBeGreaterThan(0)
      expect(state.inputDeviceId).toBeNull()
      expect(state.outputDeviceId).toBeNull()
    })

    it('should throw error when getUserMedia fails', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'))

      const { startCapture } = useMediaStore.getState()

      await expect(startCapture()).rejects.toThrow('Permission denied')
    })
  })

  describe('stopCapture action', () => {
    it('should stop audio capture and clear state', async () => {
      const { startCapture, stopCapture } = useMediaStore.getState()

      await startCapture()
      await stopCapture()

      const state = useMediaStore.getState()
      expect(mockAudioTrack.stop).toHaveBeenCalled()
      expect(state.voiceStream).toBeNull()
      expect(state.isCapturing).toBe(false)
    })

    it('should not throw when stream is null', async () => {
      const { stopCapture } = useMediaStore.getState()

      await expect(stopCapture()).resolves.not.toThrow()
    })
  })

  describe('voice remote streams management', () => {
    it('should add voice remote stream', () => {
      const { addVoiceRemoteStream } = useMediaStore.getState()
      addVoiceRemoteStream(1, 'testuser', mockStream)

      const state = useMediaStore.getState()
      expect(state.voiceRemoteStreams.size).toBe(1)
      expect(state.voiceRemoteStreams.get(1)).toEqual({
        userId: 1,
        username: 'testuser',
        stream: mockStream,
      })
    })

    it('should remove voice remote stream', () => {
      const { addVoiceRemoteStream, removeVoiceRemoteStream } = useMediaStore.getState()
      addVoiceRemoteStream(1, 'testuser', mockStream)
      removeVoiceRemoteStream(1)

      expect(useMediaStore.getState().voiceRemoteStreams.size).toBe(0)
    })
  })

  describe('state subscriptions', () => {
    it('should trigger subscription on state change', () => {
      const subscription = vi.fn()
      const unsubscribe = useMediaStore.subscribe(subscription)

      useMediaStore.getState().enableControl()

      expect(subscription).toHaveBeenCalled()
      unsubscribe()
    })
  })
})
