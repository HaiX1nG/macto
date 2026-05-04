import { create } from 'zustand'
import { screenShareService } from '../services'

export interface ScreenState {
  isShared: boolean
  controlEnabled: boolean
  currentStreamId: string
  screenStream: MediaStream | null
  currentRoomId: number | null

  // Actions
  startSharing: (roomId: number) => Promise<void>
  stopSharing: (roomId: number) => Promise<void>
  enableControl: () => void
  disableControl: () => void
  setScreenStream: (stream: MediaStream | null) => void
}

export const useScreenStore = create<ScreenState>((set, get) => ({
  isShared: false,
  controlEnabled: false,
  currentStreamId: '',
  screenStream: null,
  currentRoomId: null,

  startSharing: async (roomId) => {
    try {
      // Get screen media first
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      // Notify backend
      await screenShareService.startScreenShare(roomId)

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        const state = get()
        if (state.currentRoomId) {
          get().stopSharing(state.currentRoomId)
        }
      }

      set({
        isShared: true,
        currentStreamId: crypto.randomUUID(),
        screenStream: stream,
        currentRoomId: roomId,
      })
    } catch (err) {
      console.error('Failed to start screen sharing:', err)
      throw err
    }
  },

  stopSharing: async (roomId) => {
    const { screenStream } = get()

    // Stop local stream
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
    }

    // Notify backend
    try {
      await screenShareService.stopScreenShare(roomId)
    } catch (err) {
      console.error('Failed to notify backend about screen share stop:', err)
    }

    set({
      isShared: false,
      currentStreamId: '',
      screenStream: null,
      controlEnabled: false,
      currentRoomId: null,
    })
  },

  enableControl: () => set({ controlEnabled: true }),
  disableControl: () => set({ controlEnabled: false }),
  setScreenStream: (stream) => set({ screenStream: stream }),
}))
