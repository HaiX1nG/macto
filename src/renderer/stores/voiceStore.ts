import { create } from 'zustand'
import type { VoiceParticipant } from '@shared/types/voice'
import { voiceService } from '../services/voiceService'

export interface VoiceState {
  // Voice state (slim - WebRTC and devices moved to mediaStore)
  currentVoiceChannelId: number | null
  participants: VoiceParticipant[]
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  isInVoice: boolean
  error: string | null

  // Actions
  joinVoice: (channelId: number) => Promise<void>
  leaveVoice: () => Promise<void>
  setMute: (muted: boolean) => void
  setDeafen: (deafened: boolean) => void
  setSpeaking: (speaking: boolean) => void

  // WS event handlers
  onParticipantJoined: (channelId: number, participant: VoiceParticipant) => void
  onParticipantLeft: (channelId: number, userId: number) => void

  clearError: () => void
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  // Initial state
  currentVoiceChannelId: null,
  participants: [],
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  isInVoice: false,
  error: null,

  // Join voice channel
  joinVoice: async (channelId: number) => {
    set({ error: null })
    try {
      await voiceService.joinVoice(channelId)
      // Fetch current participants
      const participants = await voiceService.getVoiceParticipants(channelId)
      set({
        currentVoiceChannelId: channelId,
        participants,
        isInVoice: true,
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
      })
      // Note: WebRTC peer establishment is handled by mediaStore
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '加入语音频道失败',
      })
      throw err
    }
  },

  // Leave voice channel
  leaveVoice: async () => {
    const { currentVoiceChannelId } = get()
    if (!currentVoiceChannelId) return

    set({ error: null })
    try {
      await voiceService.leaveVoice(currentVoiceChannelId)
      set({
        currentVoiceChannelId: null,
        participants: [],
        isInVoice: false,
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
      })
      // Note: WebRTC teardown is handled by mediaStore
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '离开语音频道失败',
      })
      throw err
    }
  },

  // Set mute state
  setMute: (muted: boolean) => {
    set({ isMuted: muted })
    // Note: actual audio track muting is handled by mediaStore
  },

  // Set deafen state
  setDeafen: (deafened: boolean) => {
    set({ isDeafened: deafened })
  },

  // Set speaking state
  setSpeaking: (speaking: boolean) => {
    set({ isSpeaking: speaking })
  },

  // WS event: participant joined voice channel
  onParticipantJoined: (channelId: number, participant: VoiceParticipant) => {
    const { currentVoiceChannelId } = get()
    if (currentVoiceChannelId !== channelId) return

    set((state) => {
      // Don't add duplicate
      if (state.participants.some((p) => p.userId === participant.userId)) {
        return state
      }
      return { participants: [...state.participants, participant] }
    })
  },

  // WS event: participant left voice channel
  onParticipantLeft: (channelId: number, userId: number) => {
    const { currentVoiceChannelId } = get()
    if (currentVoiceChannelId !== channelId) return

    set((state) => ({
      participants: state.participants.filter((p) => p.userId !== userId),
    }))
  },

  clearError: () => {
    set({ error: null })
  },
}))

// Backward compatibility: components may still import useAudioStore
// The device/audio capture methods are now in mediaStore, but the voice state
// methods (setMute, setDeafen, etc.) are available here.
export const useAudioStore = useVoiceStore
