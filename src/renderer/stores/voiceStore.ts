import { create } from 'zustand'
import { voiceService } from '../services'
import type { VoiceSessionResponse } from '@shared/types/api'

interface VoiceState {
  participants: VoiceSessionResponse[]
  isInVoice: boolean
  isMuted: boolean
  isLoading: boolean
  error: string | null

  // Actions
  joinVoice: (roomId: number) => Promise<void>
  leaveVoice: (roomId: number) => Promise<void>
  fetchParticipants: (roomId: number) => Promise<void>
  setMute: (roomId: number, isMuted: boolean) => Promise<void>
  toggleMute: () => void
  setIsMuted: (isMuted: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  participants: [],
  isInVoice: false,
  isMuted: false,
  isLoading: false,
  error: null,

  joinVoice: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      await voiceService.joinVoice(roomId)
      set({ isInVoice: true, isLoading: false })
      // Fetch participants after joining
      get().fetchParticipants(roomId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join voice'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  leaveVoice: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      await voiceService.leaveVoice(roomId)
      set({ participants: [], isInVoice: false, isMuted: false, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave voice'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  fetchParticipants: async (roomId) => {
    try {
      const participants = await voiceService.getVoiceParticipants(roomId)
      set({ participants })
    } catch (err) {
      console.error('Failed to fetch voice participants:', err)
    }
  },

  setMute: async (roomId, isMuted) => {
    try {
      await voiceService.setMute(roomId, isMuted)
      set({ isMuted })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set mute'
      set({ error: message })
    }
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setIsMuted: (isMuted) => set({ isMuted }),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export default useVoiceStore