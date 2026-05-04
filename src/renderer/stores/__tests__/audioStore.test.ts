import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAudioStore } from '../audioStore'

// Mock navigator.mediaDevices
const mockAudioTrack = {
  kind: 'audio',
  id: 'mock-audio-track',
  label: 'mock-audio',
  enabled: true,
  muted: false,
  onended: null,
  stop: vi.fn(),
  toggle: vi.fn(),
}

const mockStream = {
  getAudioTracks: () => [mockAudioTrack],
  getVideoTracks: () => [],
  getTracks: () => [mockAudioTrack],
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
}

const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue(mockStream),
  getDisplayMedia: vi.fn(),
  enumerateDevices: vi.fn().mockResolvedValue([
    { kind: 'audioinput', deviceId: 'input-1', label: 'Microphone' },
    { kind: 'audiooutput', deviceId: 'output-1', label: 'Speakers' },
  ]),
}

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
})

describe('useAudioStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-establish default mocks after clearAllMocks
    mockMediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream)
    mockMediaDevices.enumerateDevices = vi.fn().mockResolvedValue([
      { kind: 'audioinput', deviceId: 'input-1', label: 'Microphone' },
      { kind: 'audiooutput', deviceId: 'output-1', label: 'Speakers' },
    ])
    mockAudioTrack.stop = vi.fn()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useAudioStore.getState()

      expect(state.isCapturing).toBe(false)
      expect(state.isMuted).toBe(false)
      expect(state.volume).toBe(100)
      expect(state.inputDeviceId).toBe('')
      expect(state.outputDeviceId).toBe('')
      expect(state.devices).toEqual([])
      expect(state.stream).toBeNull()
    })
  })

  describe('startCapture action', () => {
    it('should start audio capture successfully', async () => {
      const { startCapture } = useAudioStore.getState()
      await startCapture()

      const state = useAudioStore.getState()
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
      expect(state.isCapturing).toBe(true)
      expect(state.stream).toBe(mockStream)
      expect(state.devices.length).toBeGreaterThan(0)
    })

    it('should set default input and output device IDs', async () => {
      const { startCapture } = useAudioStore.getState()
      await startCapture()

      const state = useAudioStore.getState()
      expect(state.inputDeviceId).toBe('input-1')
      expect(state.outputDeviceId).toBe('output-1')
    })

    it('should throw error when getUserMedia fails', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'))

      const { startCapture } = useAudioStore.getState()

      await expect(startCapture()).rejects.toThrow('Permission denied')
    })
  })

  describe('stopCapture action', () => {
    it('should stop audio capture and clear state', async () => {
      const { startCapture, stopCapture } = useAudioStore.getState()

      // First start capture
      await startCapture()

      // Then stop
      await stopCapture()

      const state = useAudioStore.getState()
      expect(mockAudioTrack.stop).toHaveBeenCalled()
      expect(state.stream).toBeNull()
      expect(state.isCapturing).toBe(false)
    })

    it('should not throw when stream is null', async () => {
      const { stopCapture } = useAudioStore.getState()

      await expect(stopCapture()).resolves.not.toThrow()
    })
  })

  describe('setMute action', () => {
    it('should mute audio track', async () => {
      const { startCapture, setMute } = useAudioStore.getState()
      await startCapture()

      setMute(true)

      expect(mockAudioTrack.enabled).toBe(false)
      expect(useAudioStore.getState().isMuted).toBe(true)
    })

    it('should unmute audio track', () => {
      const { setMute } = useAudioStore.getState()

      // First mute
      setMute(true)

      // Then unmute
      setMute(false)

      expect(mockAudioTrack.enabled).toBe(true)
      expect(useAudioStore.getState().isMuted).toBe(false)
    })

    it('should not modify track when stream is null', () => {
      const { setMute } = useAudioStore.getState()

      setMute(true)

      expect(useAudioStore.getState().isMuted).toBe(true)
    })
  })

  describe('setVolume action', () => {
    it('should set volume to specified value', () => {
      const { setVolume } = useAudioStore.getState()
      setVolume(50)

      expect(useAudioStore.getState().volume).toBe(50)
    })

    it('should accept volume values from 0 to 100', () => {
      const { setVolume } = useAudioStore.getState()

      setVolume(0)
      expect(useAudioStore.getState().volume).toBe(0)

      setVolume(100)
      expect(useAudioStore.getState().volume).toBe(100)
    })
  })

  describe('setDevices action', () => {
    it('should set devices array', () => {
      const { setDevices } = useAudioStore.getState()
      const testDevices = [
        { kind: 'audioinput', deviceId: '1', label: 'Device 1' },
        { kind: 'audioinput', deviceId: '2', label: 'Device 2' },
      ]

      setDevices(testDevices)

      expect(useAudioStore.getState().devices).toEqual(testDevices)
    })
  })

  describe('setInputDevice action', () => {
    it('should set input device ID', () => {
      const { setInputDevice } = useAudioStore.getState()
      setInputDevice('device-123')

      expect(useAudioStore.getState().inputDeviceId).toBe('device-123')
    })
  })

  describe('setOutputDevice action', () => {
    it('should set output device ID', () => {
      const { setOutputDevice } = useAudioStore.getState()
      setOutputDevice('device-456')

      expect(useAudioStore.getState().outputDeviceId).toBe('device-456')
    })
  })

  describe('setStream action', () => {
    it('should set stream', () => {
      const { setStream } = useAudioStore.getState()
      setStream(mockStream)

      expect(useAudioStore.getState().stream).toBe(mockStream)
    })

    it('should set stream to null', () => {
      const { setStream } = useAudioStore.getState()
      setStream(null)

      expect(useAudioStore.getState().stream).toBeNull()
    })
  })

  describe('state subscriptions', () => {
    it('should trigger subscription on state change', () => {
      const subscription = vi.fn()
      const unsubscribe = useAudioStore.subscribe(subscription)

      useAudioStore.getState().setVolume(75)

      expect(subscription).toHaveBeenCalled()
      unsubscribe()
    })
  })
})
