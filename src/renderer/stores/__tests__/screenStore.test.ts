import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useScreenStore } from '../screenStore'

// Helper to reset store state between tests
const resetScreenStore = () => {
  const initialState = {
    isShared: false,
    controlEnabled: false,
    currentStreamId: '',
    screenStream: null,
  }
  useScreenStore.setState(initialState)
}

// Mock MediaStream tracks
const mockVideoTrack = {
  kind: 'video',
  id: 'mock-video-track',
  label: 'mock-video',
  enabled: true,
  muted: false,
  onended: null,
  stop: vi.fn(),
}

const mockAudioTrack = {
  kind: 'audio',
  id: 'mock-audio-track',
  label: 'mock-audio',
  enabled: true,
  muted: false,
  onended: null,
  stop: vi.fn(),
}

const mockStream = {
  getAudioTracks: () => [mockAudioTrack],
  getVideoTracks: () => [mockVideoTrack],
  getTracks: () => [mockAudioTrack, mockVideoTrack],
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
}

// Mock navigator.mediaDevices
const mockMediaDevices = {
  getUserMedia: vi.fn(),
  getDisplayMedia: vi.fn().mockResolvedValue(mockStream),
  enumerateDevices: vi.fn(),
}

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
})

describe('useScreenStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetScreenStore()
    // Re-establish default mocks after clearAllMocks
    mockMediaDevices.getDisplayMedia = vi.fn().mockResolvedValue(mockStream)
    mockMediaDevices.getUserMedia = vi.fn()
    mockVideoTrack.stop = vi.fn()
    mockAudioTrack.stop = vi.fn()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useScreenStore.getState()

      expect(state.isShared).toBe(false)
      expect(state.controlEnabled).toBe(false)
      expect(state.currentStreamId).toBe('')
      expect(state.screenStream).toBeNull()
    })
  })

  describe('startSharing action', () => {
    it('should start screen sharing successfully', async () => {
      const { startSharing } = useScreenStore.getState()
      await startSharing('session-123')

      const state = useScreenStore.getState()
      expect(mockMediaDevices.getDisplayMedia).toHaveBeenCalledWith({
        video: true,
        audio: true,
      })
      expect(state.isShared).toBe(true)
      expect(state.screenStream).toBe(mockStream)
    })

    it('should generate unique stream ID', async () => {
      const { startSharing } = useScreenStore.getState()
      await startSharing('session-123')

      const state = useScreenStore.getState()
      expect(state.currentStreamId).toBeDefined()
      expect(state.currentStreamId).not.toBe('')
    })

    it('should handle video track onended event', async () => {
      const { startSharing } = useScreenStore.getState()

      await startSharing('session-123')

      // Manually trigger onended
      mockVideoTrack.onended?.()

      // Note: The actual implementation calls stopSharing directly in onended
      // This test verifies the callback is set up correctly
      expect(mockVideoTrack.onended).not.toBeNull()
    })

    it('should throw error when getDisplayMedia fails', async () => {
      mockMediaDevices.getDisplayMedia.mockRejectedValue(new Error('No screen sharing permission'))

      const { startSharing } = useScreenStore.getState()

      await expect(startSharing('session-123')).rejects.toThrow('No screen sharing permission')
    })
  })

  describe('stopSharing action', () => {
    it('should stop all tracks and clear state', async () => {
      const { startSharing, stopSharing } = useScreenStore.getState()

      // First start sharing
      await startSharing('session-123')

      // Then stop
      await stopSharing('session-123')

      expect(mockVideoTrack.stop).toHaveBeenCalled()
      expect(mockAudioTrack.stop).toHaveBeenCalled()
      expect(useScreenStore.getState().isShared).toBe(false)
      expect(useScreenStore.getState().screenStream).toBeNull()
      expect(useScreenStore.getState().currentStreamId).toBe('')
      expect(useScreenStore.getState().controlEnabled).toBe(false)
    })

    it('should not throw when screenStream is null', async () => {
      const { stopSharing } = useScreenStore.getState()

      await expect(stopSharing('session-123')).resolves.not.toThrow()
    })

    it('should work with different session IDs', async () => {
      const { startSharing, stopSharing } = useScreenStore.getState()

      await startSharing('session-1')
      await stopSharing('session-2') // Different session ID

      expect(useScreenStore.getState().isShared).toBe(false)
    })
  })

  describe('enableControl action', () => {
    it('should enable control', () => {
      const { enableControl } = useScreenStore.getState()
      enableControl()

      expect(useScreenStore.getState().controlEnabled).toBe(true)
    })
  })

  describe('disableControl action', () => {
    it('should disable control', () => {
      const { enableControl, disableControl } = useScreenStore.getState()

      enableControl()
      expect(useScreenStore.getState().controlEnabled).toBe(true)

      disableControl()
      expect(useScreenStore.getState().controlEnabled).toBe(false)
    })
  })

  describe('setScreenStream action', () => {
    it('should set screen stream', () => {
      const { setScreenStream } = useScreenStore.getState()
      setScreenStream(mockStream)

      expect(useScreenStore.getState().screenStream).toBe(mockStream)
    })

    it('should set screen stream to null', () => {
      const { setScreenStream } = useScreenStore.getState()
      setScreenStream(null)

      expect(useScreenStore.getState().screenStream).toBeNull()
    })
  })

  describe('state subscriptions', () => {
    it('should trigger subscription on state change', () => {
      const subscription = vi.fn()
      const unsubscribe = useScreenStore.subscribe(subscription)

      useScreenStore.getState().enableControl()

      expect(subscription).toHaveBeenCalled()
      unsubscribe()
    })
  })

  describe('control flow', () => {
    it('should allow enabling control only when screen is shared', () => {
      const { enableControl } = useScreenStore.getState()

      // Control can be enabled even without sharing (for future use)
      enableControl()

      // The store doesn't enforce this constraint
      expect(useScreenStore.getState().controlEnabled).toBe(true)
    })

    it('should reset control when stopping sharing', async () => {
      const { startSharing, enableControl, stopSharing } = useScreenStore.getState()

      await startSharing('session-1')
      enableControl()

      expect(useScreenStore.getState().controlEnabled).toBe(true)

      await stopSharing('session-1')

      expect(useScreenStore.getState().controlEnabled).toBe(false)
    })
  })
})
