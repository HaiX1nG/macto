import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { screenShareService } from '../services'
import type { ScreenShareResponse } from '@shared/types/api'

/**
 * Remote screen information (serializable metadata + stream reference)
 * Note: MediaStream objects are stored here for direct access by components,
 * but they should not be persisted or serialized.
 */
export interface RemoteScreen {
  userId: number
  username: string
  stream: MediaStream
}

/**
 * Serializable stream info for persistence/signaling
 */
export interface StreamInfo {
  streamId: string
  hasAudio: boolean
  hasVideo: boolean
}

/**
 * Screen share quality settings
 */
export interface ScreenShareQuality {
  width: number
  height: number
  frameRate: number
}

/**
 * Combined media state for screen sharing and WebRTC
 */
export interface MediaState {
  // === Local Screen Share State ===
  /** Whether the current user is sharing their screen */
  isSharing: boolean
  /** Whether remote control is enabled for the shared screen */
  controlEnabled: boolean
  /** Unique ID for the current screen share stream */
  currentStreamId: string
  /** The local MediaStream being shared (not persisted) */
  localStream: MediaStream | null
  /** The room ID where screen is being shared */
  currentRoomId: number | null
  /** Quality settings for screen share */
  quality: ScreenShareQuality

  // === Backend API State ===
  /** Active screen share info from backend */
  activeShare: ScreenShareResponse | null
  /** Loading state for async operations */
  isLoading: boolean
  /** Error message from last operation */
  error: string | null

  // === Remote Screens (WebRTC) ===
  /** Map of userId to RemoteScreen for other users' shared screens */
  remoteScreens: Map<number, RemoteScreen>

  // === Peer Connections (WebRTC) ===
  /** Map of userId to RTCPeerConnection (not persisted) */
  peerConnections: Map<number, RTCPeerConnection>

  // === Callbacks for WebRTC integration ===
  /** Callback when a remote stream is added */
  onRemoteStreamAdded: ((userId: number, username: string, stream: MediaStream) => void) | null
  /** Callback when a remote stream is removed */
  onRemoteStreamRemoved: ((userId: number) => void) | null

  // === Local Screen Share Actions ===
  startSharing: (roomId: number) => Promise<void>
  stopSharing: (roomId: number) => Promise<void>
  enableControl: () => void
  disableControl: () => void
  setLocalStream: (stream: MediaStream | null) => void
  setIsSharing: (sharing: boolean) => void
  setQuality: (quality: Partial<ScreenShareQuality>) => void

  // === Backend API Actions ===
  fetchActiveShare: (roomId: number) => Promise<void>
  setActiveShare: (share: ScreenShareResponse | null) => void
  setError: (error: string | null) => void
  clearError: () => void

  // === Remote Screen Actions ===
  addRemoteScreen: (userId: number, username: string, stream: MediaStream) => void
  removeRemoteScreen: (userId: number) => void
  updateRemoteScreenStream: (userId: number, streamInfo: StreamInfo) => void

  // === Peer Connection Actions ===
  addPeerConnection: (userId: number, pc: RTCPeerConnection) => void
  removePeerConnection: (userId: number) => void
  getPeerConnection: (userId: number) => RTCPeerConnection | undefined
  clearPeerConnections: () => void

  // === Callback Registration ===
  setOnRemoteStreamAdded: (cb: ((userId: number, username: string, stream: MediaStream) => void) | null) => void
  setOnRemoteStreamRemoved: (cb: ((userId: number) => void) | null) => void

  // === Cleanup ===
  clearAll: () => void
}

const DEFAULT_QUALITY: ScreenShareQuality = {
  width: 1920,
  height: 1080,
  frameRate: 30,
}

export const useMediaStore = create<MediaState>()(
  devtools(
    (set, get) => ({
      // === Initial State ===
      isSharing: false,
      controlEnabled: false,
      currentStreamId: '',
      localStream: null,
      currentRoomId: null,
      quality: DEFAULT_QUALITY,

      activeShare: null,
      isLoading: false,
      error: null,

      remoteScreens: new Map(),
      peerConnections: new Map(),

      onRemoteStreamAdded: null,
      onRemoteStreamRemoved: null,

      // === Local Screen Share Actions ===
      startSharing: async (roomId) => {
        set({ isLoading: true, error: null })
        try {
          const { quality } = get()

          // Get screen media
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: quality.width },
              height: { ideal: quality.height },
              frameRate: { ideal: quality.frameRate },
            },
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
            isSharing: true,
            currentStreamId: crypto.randomUUID(),
            localStream: stream,
            currentRoomId: roomId,
            isLoading: false,
          })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to start screen sharing'
          set({ isLoading: false, error: message })
          throw err
        }
      },

      stopSharing: async (roomId) => {
        const { localStream } = get()

        // Stop local stream
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop())
        }

        // Notify backend
        try {
          await screenShareService.stopScreenShare(roomId)
        } catch (err) {
          console.error('Failed to notify backend about screen share stop:', err)
        }

        set({
          isSharing: false,
          currentStreamId: '',
          localStream: null,
          controlEnabled: false,
          currentRoomId: null,
          activeShare: null,
        })
      },

      enableControl: () => set({ controlEnabled: true }),
      disableControl: () => set({ controlEnabled: false }),

      setLocalStream: (stream) => set({ localStream: stream }),

      setIsSharing: (sharing) => set({ isSharing: sharing }),

      setQuality: (newQuality) => set((state) => ({
        quality: { ...state.quality, ...newQuality },
      })),

      // === Backend API Actions ===
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

      // === Remote Screen Actions ===
      addRemoteScreen: (userId, username, stream) => set((state) => {
        const newScreens = new Map(state.remoteScreens)
        newScreens.set(userId, { userId, username, stream })

        // Notify callback
        state.onRemoteStreamAdded?.(userId, username, stream)

        return { remoteScreens: newScreens }
      }),

      removeRemoteScreen: (userId) => set((state) => {
        const newScreens = new Map(state.remoteScreens)
        newScreens.delete(userId)

        // Notify callback
        state.onRemoteStreamRemoved?.(userId)

        return { remoteScreens: newScreens }
      }),

      updateRemoteScreenStream: (_userId, _streamInfo) => {
        // This can be used to update serializable stream metadata
        // without modifying the actual MediaStream
      },

      // === Peer Connection Actions ===
      addPeerConnection: (userId, pc) => set((state) => {
        const newConnections = new Map(state.peerConnections)
        newConnections.set(userId, pc)
        return { peerConnections: newConnections }
      }),

      removePeerConnection: (userId) => set((state) => {
        const newConnections = new Map(state.peerConnections)
        const pc = newConnections.get(userId)
        if (pc) {
          pc.close()
        }
        newConnections.delete(userId)
        return { peerConnections: newConnections }
      }),

      getPeerConnection: (userId) => get().peerConnections.get(userId),

      clearPeerConnections: () => {
        const { peerConnections } = get()
        peerConnections.forEach(pc => pc.close())
        set({ peerConnections: new Map() })
      },

      // === Callback Registration ===
      setOnRemoteStreamAdded: (cb) => set({ onRemoteStreamAdded: cb }),
      setOnRemoteStreamRemoved: (cb) => set({ onRemoteStreamRemoved: cb }),

      // === Cleanup ===
      clearAll: () => {
        const state = get()

        // Stop local stream
        state.localStream?.getTracks().forEach(track => track.stop())

        // Close all peer connections
        state.peerConnections.forEach(pc => pc.close())

        // Clear all state
        set({
          isSharing: false,
          currentStreamId: '',
          localStream: null,
          controlEnabled: false,
          currentRoomId: null,
          activeShare: null,
          isLoading: false,
          error: null,
          remoteScreens: new Map(),
          peerConnections: new Map(),
        })
      },
    }),
    { name: 'MediaStore', enabled: import.meta.env.DEV }
  )
)

// Re-export for backward compatibility
export const useScreenStore = useMediaStore
export const useScreenShareStore = useMediaStore
export const useWebRTCStore = useMediaStore

export default useMediaStore
