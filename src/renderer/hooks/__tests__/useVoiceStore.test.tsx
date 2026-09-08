import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaStore } from '../../stores/mediaStore'

// Mock navigator.mediaDevices
const mockAudioTrack = {
  kind: 'audio',
  id: 'mock-audio-track',
  label: 'mock-audio',
  enabled: true,
  muted: false,
  onended: null,
  onmute: null,
  onunmute: null,
  readyState: 'live' as MediaStreamTrackState,
  contentHint: '',
  stop: vi.fn(),
  toggle: vi.fn(),
  clone: vi.fn(),
  getCapabilities: vi.fn(),
  getConstraints: vi.fn(),
  getSettings: vi.fn(),
  applyConstraints: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as unknown as MediaStreamTrack

const mockStream: MediaStream = {
  id: 'mock-stream-id',
  active: true,
  onaddtrack: null,
  onremovetrack: null,
  getAudioTracks: () => [mockAudioTrack],
  getVideoTracks: () => [],
  getTracks: () => [mockAudioTrack],
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
  clone: vi.fn(),
  getTrackById: vi.fn(),
} as unknown as MediaStream

const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue(mockStream),
  getDisplayMedia: vi.fn(),
  enumerateDevices: vi.fn().mockResolvedValue([
    { kind: 'audioinput', deviceId: 'input-1', label: 'Microphone', groupId: 'group-1', toJSON: () => ({ kind: 'audioinput', deviceId: 'input-1', label: 'Microphone', groupId: 'group-1' }) } as MediaDeviceInfo,
    { kind: 'audiooutput', deviceId: 'output-1', label: 'Speakers', groupId: 'group-1', toJSON: () => ({ kind: 'audiooutput', deviceId: 'output-1', label: 'Speakers', groupId: 'group-1' }) } as MediaDeviceInfo,
  ]),
}

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
})

describe('useMediaStore audio capture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(mockMediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockClear()
    ;(mockAudioTrack.stop as ReturnType<typeof vi.fn>).mockClear()
    ;(mockMediaDevices.enumerateDevices as ReturnType<typeof vi.fn>).mockClear()
    // Reset store state to initial values
    useMediaStore.setState({
      isCapturing: false,
      volume: 100,
      inputDeviceId: null,
      outputDeviceId: null,
      devices: [],
      voiceStream: null,
      isSharing: false,
      localStream: null,
      currentRoomId: null,
      isLoading: false,
      error: null,
      remoteScreens: new Map(),
      peerConnections: new Map(),
      voiceRemoteStreams: new Map(),
      controlEnabled: false,
      currentStreamId: '',
    })
  })

  describe('audio device state access', () => {
    it('should get isCapturing state', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.isCapturing))
      expect(result.current).toBe(false)
    })

    it('should get volume state', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.volume))
      expect(result.current).toBe(100)
    })

    it('should get inputDeviceId state', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.inputDeviceId))
      expect(result.current).toBeNull()
    })

    it('should get outputDeviceId state', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.outputDeviceId))
      expect(result.current).toBeNull()
    })

    it('should get devices state', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.devices))
      expect(result.current).toEqual([])
    })

    it('should get voiceStream state', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.voiceStream))
      expect(result.current).toBeNull()
    })
  })

  describe('startCapture action', () => {
    it('should start audio capture', async () => {
      const { result } = renderHook(() => useMediaStore((state) => state.isCapturing))

      await act(async () => {
        await useMediaStore.getState().startCapture()
      })

      expect(result.current).toBe(true)
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }),
        })
      )
    })

    it('should update devices after capture starts', async () => {
      const { result } = renderHook(() => useMediaStore((state) => state.devices))

      await act(async () => {
        await useMediaStore.getState().startCapture()
      })

      expect(result.current.length).toBeGreaterThan(0)
    })
  })

  describe('stopCapture action', () => {
    it('should stop audio capture', async () => {
      const { result } = renderHook(() => useMediaStore((state) => state.isCapturing))

      // First start
      await act(async () => {
        await useMediaStore.getState().startCapture()
      })

      // Then stop
      await act(async () => {
        await useMediaStore.getState().stopCapture()
      })

      expect(result.current).toBe(false)
      expect(mockAudioTrack.stop).toHaveBeenCalled()
    })
  })

  describe('setVolume action', () => {
    it('should set volume', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.volume))

      act(() => {
        useMediaStore.getState().setVolume(75)
      })

      expect(result.current).toBe(75)
    })

    it('should update volume state', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.volume))

      expect(result.current).toBe(100)

      act(() => {
        useMediaStore.getState().setVolume(50)
      })

      expect(result.current).toBe(50)
    })
  })

  describe('setDevices action', () => {
    it('should set devices', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.devices))
      const testDevices: MediaDeviceInfo[] = [
        { kind: 'audioinput', deviceId: '1', label: 'Device 1', groupId: 'group-1', toJSON: () => ({}) } as MediaDeviceInfo,
      ]

      act(() => {
        useMediaStore.getState().setDevices(testDevices)
      })

      expect(result.current).toEqual(testDevices)
    })
  })

  describe('setInputDevice action', () => {
    it('should set input device', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.inputDeviceId))

      act(() => {
        useMediaStore.getState().setInputDevice('device-123')
      })

      expect(result.current).toBe('device-123')
    })
  })

  describe('setOutputDevice action', () => {
    it('should set output device', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.outputDeviceId))

      act(() => {
        useMediaStore.getState().setOutputDevice('device-456')
      })

      expect(result.current).toBe('device-456')
    })
  })

  describe('setStream action', () => {
    it('should set stream', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.voiceStream))

      act(() => {
        useMediaStore.getState().setStream(mockStream)
      })

      expect(result.current).toBe(mockStream)
    })

    it('should set stream to null', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.voiceStream))

      act(() => {
        useMediaStore.getState().setStream(null)
      })

      expect(result.current).toBeNull()
    })
  })

  describe('state subscriptions', () => {
    it('should update when isCapturing changes', async () => {
      const { result } = renderHook(() => useMediaStore((state) => state.isCapturing))

      expect(result.current).toBe(false)

      await act(async () => {
        await useMediaStore.getState().startCapture()
      })

      expect(result.current).toBe(true)
    })

    it('should update when volume changes', () => {
      const { result } = renderHook(() => useMediaStore((state) => state.volume))

      expect(result.current).toBe(100)

      act(() => {
        useMediaStore.getState().setVolume(60)
      })

      expect(result.current).toBe(60)
    })
  })

  describe('error handling', () => {
    it('should handle capture failure', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

      const { result } = renderHook(() => useMediaStore((state) => state.isCapturing))

      await expect(
        act(async () => {
          await useMediaStore.getState().startCapture()
        })
      ).rejects.toThrow('Permission denied')

      expect(result.current).toBe(false)
    })
  })
})
