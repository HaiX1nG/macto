import { create } from 'zustand'

export interface RemoteScreen {
  userId: number
  username: string
  stream: MediaStream
}

interface WebRTCState {
  // Local stream (screen being shared by current user)
  localStream: MediaStream | null
  isSharing: boolean

  // Remote streams (screens being shared by other users)
  remoteScreens: Map<number, RemoteScreen>

  // Peer connections
  peerConnections: Map<number, RTCPeerConnection>

  // Actions
  setLocalStream: (stream: MediaStream | null) => void
  setIsSharing: (sharing: boolean) => void
  addRemoteScreen: (userId: number, username: string, stream: MediaStream) => void
  removeRemoteScreen: (userId: number) => void
  addPeerConnection: (userId: number, pc: RTCPeerConnection) => void
  removePeerConnection: (userId: number) => void
  getPeerConnection: (userId: number) => RTCPeerConnection | undefined
  clearAll: () => void
}

export const useWebRTCStore = create<WebRTCState>((set, get) => ({
  localStream: null,
  isSharing: false,
  remoteScreens: new Map(),
  peerConnections: new Map(),

  setLocalStream: (stream) => set({ localStream: stream }),
  setIsSharing: (sharing) => set({ isSharing: sharing }),

  addRemoteScreen: (userId, username, stream) => set((state) => {
    const newScreens = new Map(state.remoteScreens)
    newScreens.set(userId, { userId, username, stream })
    return { remoteScreens: newScreens }
  }),

  removeRemoteScreen: (userId) => set((state) => {
    const newScreens = new Map(state.remoteScreens)
    newScreens.delete(userId)
    return { remoteScreens: newScreens }
  }),

  addPeerConnection: (userId, pc) => set((state) => {
    const newConnections = new Map(state.peerConnections)
    newConnections.set(userId, pc)
    return { peerConnections: newConnections }
  }),

  removePeerConnection: (userId) => set((state) => {
    const newConnections = new Map(state.peerConnections)
    newConnections.delete(userId)
    return { peerConnections: newConnections }
  }),

  getPeerConnection: (userId) => get().peerConnections.get(userId),

  clearAll: () => {
    const state = get()
    // Stop local stream
    state.localStream?.getTracks().forEach(track => track.stop())
    // Close all peer connections
    state.peerConnections.forEach(pc => pc.close())
    // Clear state
    set({
      localStream: null,
      isSharing: false,
      remoteScreens: new Map(),
      peerConnections: new Map(),
    })
  },
}))

export default useWebRTCStore