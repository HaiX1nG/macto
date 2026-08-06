import { create } from 'zustand'

export interface RemoteScreen {
  userId: number
  username: string
  stream: MediaStream
}

export interface MediaState {
  // State
  isSharing: boolean
  controlEnabled: boolean
  currentStreamId: string
  localStream: MediaStream | null
  currentRoomId: number | null
  activeShare: unknown | null
  isLoading: boolean
  error: string | null
  remoteScreens: Map<number, RemoteScreen>
  peerConnections: Map<number, RTCPeerConnection>

  // Actions
  startSharing: (roomId: number) => Promise<void>
  stopSharing: (roomId: number) => Promise<void>
  enableControl: () => void
  disableControl: () => void
  setLocalStream: (stream: MediaStream | null) => void
  setIsSharing: (isSharing: boolean) => void
  addRemoteScreen: (userId: number, username: string, stream: MediaStream) => void
  removeRemoteScreen: (userId: number) => void
  addPeerConnection: (userId: number, pc: RTCPeerConnection) => void
  removePeerConnection: (userId: number) => void
  getPeerConnection: (userId: number) => RTCPeerConnection | undefined
  clearAll: () => void
}

export const useMediaStore = create<MediaState>((set, get) => ({
  // Initial state
  isSharing: false,
  controlEnabled: false,
  currentStreamId: '',
  localStream: null,
  currentRoomId: null,
  activeShare: null,
  isLoading: false,
  error: null,
  remoteScreens: new Map(),
  peerConnections: new Map(),

  // Start sharing
  startSharing: async (roomId: number) => {
    set({ isLoading: true, error: null })
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
      set({
        isSharing: true,
        localStream: stream,
        currentStreamId: `stream-${Date.now()}`,
        currentRoomId: roomId,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '屏幕共享失败',
      })
      throw err
    }
  },

  // Stop sharing
  stopSharing: async (_roomId: number) => {
    const { localStream } = get()
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    set({
      isSharing: false,
      localStream: null,
      currentStreamId: '',
      controlEnabled: false,
    })
  },

  // Enable control
  enableControl: () => {
    set({ controlEnabled: true })
  },

  // Disable control
  disableControl: () => {
    set({ controlEnabled: false })
  },

  // Set local stream
  setLocalStream: (stream: MediaStream | null) => {
    set({ localStream: stream })
  },

  // Set is sharing
  setIsSharing: (isSharing: boolean) => {
    set({ isSharing })
  },

  // Add remote screen
  addRemoteScreen: (userId: number, username: string, stream: MediaStream) => {
    set((state) => {
      const newMap = new Map(state.remoteScreens)
      newMap.set(userId, { userId, username, stream })
      return { remoteScreens: newMap }
    })
  },

  // Remove remote screen
  removeRemoteScreen: (userId: number) => {
    set((state) => {
      const newMap = new Map(state.remoteScreens)
      newMap.delete(userId)
      return { remoteScreens: newMap }
    })
  },

  // Add peer connection
  addPeerConnection: (userId: number, pc: RTCPeerConnection) => {
    set((state) => {
      const newMap = new Map(state.peerConnections)
      newMap.set(userId, pc)
      return { peerConnections: newMap }
    })
  },

  // Remove peer connection
  removePeerConnection: (userId: number) => {
    set((state) => {
      const newMap = new Map(state.peerConnections)
      const pc = newMap.get(userId)
      if (pc) {
        pc.close()
      }
      newMap.delete(userId)
      return { peerConnections: newMap }
    })
  },

  // Get peer connection
  getPeerConnection: (userId: number) => {
    return get().peerConnections.get(userId)
  },

  // Clear all
  clearAll: () => {
    const { localStream, peerConnections } = get()
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    peerConnections.forEach(pc => pc.close())
    set({
      isSharing: false,
      localStream: null,
      currentStreamId: '',
      controlEnabled: false,
      remoteScreens: new Map(),
      peerConnections: new Map(),
    })
  },
}))
