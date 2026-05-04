import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioStore } from '../../stores/audioStore'

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

describe('useAudioStore hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMediaDevices.getUserMedia.mockClear()
    mockAudioTrack.stop.mockClear()
    // Reset store state to initial values
    useAudioStore.setState({
      isCapturing: false,
      isMuted: false,
      volume: 100,
      inputDeviceId: '',
      outputDeviceId: '',
      devices: [],
      stream: null,
    })
  })

  describe('audio state access', () => {
    it('should get isCapturing state', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.isCapturing))

      expect(result.current).toBe(false)
    })

    it('should get isMuted state', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.isMuted))

      expect(result.current).toBe(false)
    })

    it('should get volume state', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.volume))

      expect(result.current).toBe(100)
    })

    it('should get inputDeviceId state', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.inputDeviceId))

      expect(result.current).toBe('')
    })

    it('should get outputDeviceId state', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.outputDeviceId))

      expect(result.current).toBe('')
    })

    it('should get devices state', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.devices))

      expect(result.current).toEqual([])
    })

    it('should get stream state', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.stream))

      expect(result.current).toBeNull()
    })
  })

  describe('startCapture action', async () => {
    it('should start audio capture', async () => {
      const { result } = renderHook(() => useAudioStore((state) => state.isCapturing))

      await act(async () => {
        await useAudioStore.getState().startCapture()
      })

      expect(result.current).toBe(true)
      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
    })

    it('should update devices after capture starts', async () => {
      const { result } = renderHook(() => useAudioStore((state) => state.devices))

      await act(async () => {
        await useAudioStore.getState().startCapture()
      })

      expect(result.current.length).toBeGreaterThan(0)
    })
  })

  describe('stopCapture action', async () => {
    it('should stop audio capture', async () => {
      const { result } = renderHook(() => useAudioStore((state) => state.isCapturing))

      // First start
      await act(async () => {
        await useAudioStore.getState().startCapture()
      })

      // Then stop
      await act(async () => {
        await useAudioStore.getState().stopCapture()
      })

      expect(result.current).toBe(false)
      expect(mockAudioTrack.stop).toHaveBeenCalled()
    })
  })

  describe('setMute action', () => {
    it('should mute audio', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.isMuted))

      act(() => {
        useAudioStore.getState().setMute(true)
      })

      expect(result.current).toBe(true)
    })

    it('should unmute audio', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.isMuted))

      act(() => {
        useAudioStore.getState().setMute(true)
        useAudioStore.getState().setMute(false)
      })

      expect(result.current).toBe(false)
    })
  })

  describe('setVolume action', () => {
    it('should set volume', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.volume))

      act(() => {
        useAudioStore.getState().setVolume(75)
      })

      expect(result.current).toBe(75)
    })

    it('should update volume state', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.volume))

      expect(result.current).toBe(100)

      act(() => {
        useAudioStore.getState().setVolume(50)
      })

      expect(result.current).toBe(50)
    })
  })

  describe('setDevices action', () => {
    it('should set devices', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.devices))
      const testDevices = [
        { kind: 'audioinput', deviceId: '1', label: 'Device 1' },
      ]

      act(() => {
        useAudioStore.getState().setDevices(testDevices)
      })

      expect(result.current).toEqual(testDevices)
    })
  })

  describe('setInputDevice action', () => {
    it('should set input device', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.inputDeviceId))

      act(() => {
        useAudioStore.getState().setInputDevice('device-123')
      })

      expect(result.current).toBe('device-123')
    })
  })

  describe('setOutputDevice action', () => {
    it('should set output device', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.outputDeviceId))

      act(() => {
        useAudioStore.getState().setOutputDevice('device-456')
      })

      expect(result.current).toBe('device-456')
    })
  })

  describe('setStream action', () => {
    it('should set stream', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.stream))

      act(() => {
        useAudioStore.getState().setStream(mockStream)
      })

      expect(result.current).toBe(mockStream)
    })

    it('should set stream to null', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.stream))

      act(() => {
        useAudioStore.getState().setStream(null)
      })

      expect(result.current).toBeNull()
    })
  })

  describe('state subscriptions', () => {
    it('should update when isCapturing changes', async () => {
      const { result } = renderHook(() => useAudioStore((state) => state.isCapturing))

      expect(result.current).toBe(false)

      await act(async () => {
        await useAudioStore.getState().startCapture()
      })

      expect(result.current).toBe(true)
    })

    it('should update when isMuted changes', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.isMuted))

      expect(result.current).toBe(false)

      act(() => {
        useAudioStore.getState().setMute(true)
      })

      expect(result.current).toBe(true)
    })

    it('should update when volume changes', () => {
      const { result } = renderHook(() => useAudioStore((state) => state.volume))

      expect(result.current).toBe(100)

      act(() => {
        useAudioStore.getState().setVolume(60)
      })

      expect(result.current).toBe(60)
    })
  })

  describe('error handling', async () => {
    it('should handle capture failure', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValue(new Error('Permission denied'))

      const { result } = renderHook(() => useAudioStore((state) => state.isCapturing))

      await expect(
        act(async () => {
          await useAudioStore.getState().startCapture()
        })
      ).rejects.toThrow('Permission denied')

      expect(result.current).toBe(false)
    })
  })
})
