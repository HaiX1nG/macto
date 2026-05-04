import { create } from 'zustand'
import { screenShareService } from '../services'
import type { ScreenShareResponse } from '@shared/types/api'

interface ScreenShareState {
  activeShare: ScreenShareResponse | null
  isSharing: boolean
  isLoading: boolean
  error: string | null

  // Actions
  startScreenShare: (roomId: number) => Promise<void>
  stopScreenShare: (roomId: number) => Promise<void>
  fetchActiveShare: (roomId: number) => Promise<void>
  setActiveShare: (share: ScreenShareResponse | null) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useScreenShareStore = create<ScreenShareState>((set) => ({
  activeShare: null,
  isSharing: false,
  isLoading: false,
  error: null,

  startScreenShare: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      const share = await screenShareService.startScreenShare(roomId)
      set({ activeShare: share, isSharing: true, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start screen share'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  stopScreenShare: async (roomId) => {
    set({ isLoading: true, error: null })
    try {
      await screenShareService.stopScreenShare(roomId)
      set({ activeShare: null, isSharing: false, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop screen share'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  fetchActiveShare: async (roomId) => {
    try {
      const share = await screenShareService.getActiveScreenShare(roomId)
      set({ activeShare: share, isSharing: !!share })
    } catch (err) {
      console.error('Failed to fetch active screen share:', err)
    }
  },

  setActiveShare: (share) => set({ activeShare: share, isSharing: !!share }),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export default useScreenShareStore