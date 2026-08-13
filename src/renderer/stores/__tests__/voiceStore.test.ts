import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVoiceStore } from '../voiceStore'
import { useMediaStore } from '../mediaStore'
import { voiceService } from '../../services/voiceService'

// Mock voiceService so joinVoice/leaveVoice never hit real network calls
vi.mock('../../services/voiceService', () => ({
  voiceService: {
    joinVoice: vi.fn(),
    leaveVoice: vi.fn(),
    getVoiceParticipants: vi.fn(),
  },
}))

const mockVoiceService = vi.mocked(voiceService)

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

describe('useVoiceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset voice store state
    useVoiceStore.setState({
      currentVoiceChannelId: null,
      participants: [],
      isDeafened: false,
      isSpeaking: false,
      isInVoice: false,
      error: null,
    })
    // Reset media store mute state
    useMediaStore.setState({ isMuted: false })

    // Re-setup voiceService mocks for each test
    mockVoiceService.joinVoice.mockReset()
    mockVoiceService.leaveVoice.mockReset()
    mockVoiceService.getVoiceParticipants.mockReset()
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useVoiceStore.getState()

      expect(state.currentVoiceChannelId).toBeNull()
      expect(state.participants).toEqual([])
      expect(state.isDeafened).toBe(false)
      expect(state.isSpeaking).toBe(false)
      expect(state.isInVoice).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setMute action (delegates to mediaStore)', () => {
    it('should set mediaStore isMuted to true', () => {
      useVoiceStore.getState().setMute(true)

      expect(useMediaStore.getState().isMuted).toBe(true)
    })

    it('should set mediaStore isMuted to false', () => {
      useVoiceStore.getState().setMute(true)
      useVoiceStore.getState().setMute(false)

      expect(useMediaStore.getState().isMuted).toBe(false)
    })
  })

  describe('setDeafen action', () => {
    it('should set isDeafened to true', () => {
      const { setDeafen } = useVoiceStore.getState()
      setDeafen(true)

      expect(useVoiceStore.getState().isDeafened).toBe(true)
    })
  })

  describe('setSpeaking action', () => {
    it('should set isSpeaking to true', () => {
      const { setSpeaking } = useVoiceStore.getState()
      setSpeaking(true)

      expect(useVoiceStore.getState().isSpeaking).toBe(true)
    })
  })

  describe('clearError action', () => {
    it('should clear error', () => {
      useVoiceStore.setState({ error: 'test error' })
      const { clearError } = useVoiceStore.getState()
      clearError()

      expect(useVoiceStore.getState().error).toBeNull()
    })
  })

  describe('onParticipantJoined', () => {
    it('should add participant when in the same voice channel', () => {
      useVoiceStore.setState({ currentVoiceChannelId: 123, isInVoice: true })
      const { onParticipantJoined } = useVoiceStore.getState()

      onParticipantJoined(123, {
        id: 1,
        channelId: 123,
        userId: 456,
        username: 'testuser',
        avatarUrl: '',
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
        volume: 100,
        joinedAt: new Date().toISOString(),
      })

      expect(useVoiceStore.getState().participants).toHaveLength(1)
      expect(useVoiceStore.getState().participants[0].userId).toBe(456)
    })

    it('should not add participant when in a different voice channel', () => {
      useVoiceStore.setState({ currentVoiceChannelId: 123, isInVoice: true })
      const { onParticipantJoined } = useVoiceStore.getState()

      onParticipantJoined(999, {
        id: 1,
        channelId: 999,
        userId: 456,
        username: 'testuser',
        avatarUrl: '',
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
        volume: 100,
        joinedAt: new Date().toISOString(),
      })

      expect(useVoiceStore.getState().participants).toHaveLength(0)
    })

    it('should not add duplicate participant', () => {
      useVoiceStore.setState({ currentVoiceChannelId: 123, isInVoice: true })
      const { onParticipantJoined } = useVoiceStore.getState()

      const participant = {
        id: 1,
        channelId: 123,
        userId: 456,
        username: 'testuser',
        avatarUrl: '',
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
        volume: 100,
        joinedAt: new Date().toISOString(),
      }

      onParticipantJoined(123, participant)
      onParticipantJoined(123, participant)

      expect(useVoiceStore.getState().participants).toHaveLength(1)
    })
  })

  describe('onParticipantLeft', () => {
    it('should remove participant when in the same voice channel', () => {
      useVoiceStore.setState({
        currentVoiceChannelId: 123,
        isInVoice: true,
        participants: [
          {
            id: 1,
            channelId: 123,
            userId: 456,
            username: 'testuser',
            avatarUrl: '',
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
            volume: 100,
            joinedAt: new Date().toISOString(),
          },
        ],
      })
      const { onParticipantLeft } = useVoiceStore.getState()

      onParticipantLeft(123, 456)

      expect(useVoiceStore.getState().participants).toHaveLength(0)
    })

    it('should not remove participant when in a different voice channel', () => {
      useVoiceStore.setState({
        currentVoiceChannelId: 123,
        isInVoice: true,
        participants: [
          {
            id: 1,
            channelId: 123,
            userId: 456,
            username: 'testuser',
            avatarUrl: '',
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
            volume: 100,
            joinedAt: new Date().toISOString(),
          },
        ],
      })
      const { onParticipantLeft } = useVoiceStore.getState()

      onParticipantLeft(999, 456)

      expect(useVoiceStore.getState().participants).toHaveLength(1)
    })
  })

  describe('joinVoice action', () => {
    it('should join voice channel successfully: call voiceService.joinVoice + mediaStore.startCapture, set isInVoice=true', async () => {
      const mockParticipants = [
        {
          id: 1,
          channelId: 123,
          userId: 456,
          username: 'otheruser',
          avatarUrl: '',
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
          volume: 100,
          joinedAt: new Date().toISOString(),
        },
      ]
      mockVoiceService.joinVoice.mockResolvedValue(undefined)
      mockVoiceService.getVoiceParticipants.mockResolvedValue(mockParticipants)
      const startCaptureSpy = vi
        .spyOn(useMediaStore.getState(), 'startCapture')
        .mockResolvedValue(undefined)

      await useVoiceStore.getState().joinVoice(123)

      expect(mockVoiceService.joinVoice).toHaveBeenCalledWith(123)
      expect(startCaptureSpy).toHaveBeenCalledWith(123)
      expect(mockVoiceService.getVoiceParticipants).toHaveBeenCalledWith(123)
      expect(useVoiceStore.getState().isInVoice).toBe(true)
      expect(useVoiceStore.getState().currentVoiceChannelId).toBe(123)
      expect(useVoiceStore.getState().participants).toEqual(mockParticipants)
    })

    it('should set currentVoiceChannelId even if startCapture fails (so leaveVoice can resolve it)', async () => {
      mockVoiceService.joinVoice.mockResolvedValue(undefined)
      const startCaptureSpy = vi
        .spyOn(useMediaStore.getState(), 'startCapture')
        .mockRejectedValue(new Error('mic denied'))

      await expect(useVoiceStore.getState().joinVoice(123)).rejects.toThrow('mic denied')

      expect(startCaptureSpy).toHaveBeenCalledWith(123)
      expect(useVoiceStore.getState().currentVoiceChannelId).toBe(123)
      expect(useVoiceStore.getState().isInVoice).toBe(false)
      expect(useVoiceStore.getState().error).not.toBeNull()
    })

    it('should not set isInVoice when voiceService.joinVoice fails', async () => {
      mockVoiceService.joinVoice.mockRejectedValue(new Error('join failed'))

      await expect(useVoiceStore.getState().joinVoice(123)).rejects.toThrow('join failed')

      expect(useVoiceStore.getState().isInVoice).toBe(false)
      expect(useVoiceStore.getState().currentVoiceChannelId).toBeNull()
      expect(useVoiceStore.getState().error).not.toBeNull()
    })
  })

  describe('leaveVoice action', () => {
    it('should leave voice channel successfully: call mediaStore.stopCapture, reset state', async () => {
      useVoiceStore.setState({ currentVoiceChannelId: 123, isInVoice: true })
      const stopCaptureSpy = vi
        .spyOn(useMediaStore.getState(), 'stopCapture')
        .mockResolvedValue(undefined)

      await useVoiceStore.getState().leaveVoice()

      expect(stopCaptureSpy).toHaveBeenCalled()
      expect(useVoiceStore.getState().currentVoiceChannelId).toBeNull()
      expect(useVoiceStore.getState().isInVoice).toBe(false)
      expect(useVoiceStore.getState().participants).toEqual([])
    })

    it('should do nothing when not in a voice channel', async () => {
      useVoiceStore.setState({ currentVoiceChannelId: null })
      const stopCaptureSpy = vi
        .spyOn(useMediaStore.getState(), 'stopCapture')
        .mockResolvedValue(undefined)

      await useVoiceStore.getState().leaveVoice()

      expect(stopCaptureSpy).not.toHaveBeenCalled()
    })

    it('should set error when stopCapture fails', async () => {
      useVoiceStore.setState({ currentVoiceChannelId: 123 })
      const stopCaptureSpy = vi
        .spyOn(useMediaStore.getState(), 'stopCapture')
        .mockRejectedValue(new Error('stop failed'))

      await expect(useVoiceStore.getState().leaveVoice()).rejects.toThrow('stop failed')

      expect(stopCaptureSpy).toHaveBeenCalled()
      expect(useVoiceStore.getState().error).not.toBeNull()
    })
  })

  describe('state subscriptions', () => {
    it('should trigger subscription on state change', () => {
      const subscription = vi.fn()
      const unsubscribe = useVoiceStore.subscribe(subscription)

      useVoiceStore.getState().setDeafen(true)

      expect(subscription).toHaveBeenCalled()
      unsubscribe()
    })
  })
})
