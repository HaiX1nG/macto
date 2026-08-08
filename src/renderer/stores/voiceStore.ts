import { create } from 'zustand'
import { WebRTCManager } from '../utils/webrtcManager'
import { wsConnection } from '../services/wsConnection'
import { voiceService } from '../services'
import { useAuthStore } from './authStore'
import type { WebRTCSignalRequest } from '@shared/types/api'

export interface VoiceParticipant {
  id: number
  roomId: number
  userId: string
  username: string
  isMuted?: boolean
  isSpeaking?: boolean
  volume?: number
  joinedAt: string
}

/**
 * Remote audio stream info for a connected peer.
 */
export interface RemoteVoiceStream {
  userId: number
  username: string
  stream: MediaStream
}

export interface VoiceState {
  // Audio devices
  devices: MediaDeviceInfo[]
  inputDeviceId: string | null
  outputDeviceId: string | null
  volume: number
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean

  // Voice participants
  participants: VoiceParticipant[]

  // Actions
  setDevices: (devices: MediaDeviceInfo[]) => void
  setInputDevice: (deviceId: string) => void
  setOutputDevice: (deviceId: string) => void
  setVolume: (volume: number) => void
  setMute: (muted: boolean) => void
  setDeafen: (deafened: boolean) => void
  setSpeaking: (speaking: boolean) => void
  addParticipant: (participant: VoiceParticipant) => void
  removeParticipant: (participant: VoiceParticipant) => void
  updateVoiceParticipant: (userId: string, updates: Partial<VoiceParticipant>) => void

  // Audio capture
  isCapturing: boolean
  stream: MediaStream | null
  currentRoomId: number | null
  isInVoice: boolean
  isLoading: boolean
  error: string | null
  startCapture: (roomId?: number) => Promise<void>
  stopCapture: () => Promise<void>
  setStream: (stream: MediaStream | null) => void
  clearError: () => void

  // Remote audio streams from WebRTC peers
  remoteStreams: Map<number, RemoteVoiceStream>
  addRemoteStream: (userId: number, username: string, stream: MediaStream) => void
  removeRemoteStream: (userId: number) => void

  // WebRTC signaling - handle incoming signals for voice chat
  handleVoiceSignal: (fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest) => Promise<void>
}

// WebRTC manager instance - created lazily when voice chat starts.
// Stored outside Zustand because it's not serializable state, just a service handle.
let webrtcManager: WebRTCManager | null = null

/**
 * Get or create the WebRTC manager for voice chat.
 * The manager handles peer connections and signal routing.
 */
function getWebrtcManager(): WebRTCManager | null {
  if (!webrtcManager) {
    // Get the current user ID from the auth store
    const authState = useAuthStore.getState()
    const userIdStr = authState.currentUser?.id
    if (!userIdStr) return null
    const userId = Number(userIdStr)

    webrtcManager = new WebRTCManager(
      userId,
      async (signal: WebRTCSignalRequest) => {
        const ws = wsConnection.getCurrentWs()
        if (!ws) return
        ws.send({
          type: 'webrtc_signal',
          payload: signal,
        })
      },
      (remoteUserId: number, _username: string, stream: MediaStream) => {
        // Remote stream received - play it and add to store
        const audio = new Audio()
        audio.srcObject = stream
        audio.autoplay = true
        audio.play().catch(err => {
          console.error('[VoiceChat] Failed to play remote audio:', err)
        })

        // Add to store so UI can react
        const state = useVoiceStore.getState()
        state.addRemoteStream(remoteUserId, _username, stream)
      },
      (userId: number) => {
        // Peer disconnected
        const state = useVoiceStore.getState()
        state.removeRemoteStream(userId)
      }
    )
  }
  return webrtcManager
}

/**
 * Clean up the WebRTC manager.
 */
function destroyWebrtcManager(): void {
  if (webrtcManager) {
    webrtcManager.stopVoiceChat()
    webrtcManager.closeAll()
    webrtcManager = null
  }
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  // Initial state
  devices: [],
  inputDeviceId: null,
  outputDeviceId: null,
  volume: 100,
  isMuted: false,
  isDeafened: false,
  isSpeaking: false,
  participants: [],
  isCapturing: false,
  stream: null,
  currentRoomId: null,
  isInVoice: false,
  isLoading: false,
  error: null,
  remoteStreams: new Map(),

  // Actions
  setDevices: (devices: MediaDeviceInfo[]) => {
    set({ devices })
  },

  setInputDevice: (deviceId: string) => {
    set({ inputDeviceId: deviceId })
  },

  setOutputDevice: (deviceId: string) => {
    set({ outputDeviceId: deviceId })
  },

  setVolume: (volume: number) => {
    set({ volume })
  },

  setMute: (muted: boolean) => {
    // Mute/unmute the local audio tracks
    const { stream } = get()
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !muted
      })
    }
    set({ isMuted: muted })
  },

  setDeafen: (deafened: boolean) => {
    set({ isDeafened: deafened })
    // Mute all remote audio elements when deafened
    const { remoteStreams } = get()
    remoteStreams.forEach(() => {
      const audios = document.querySelectorAll('audio')
      audios.forEach(audio => {
        audio.muted = deafened
      })
    })
  },

  setSpeaking: (speaking: boolean) => {
    set({ isSpeaking: speaking })
  },

  addParticipant: (participant: VoiceParticipant) => {
    set((state) => ({
      participants: [...state.participants, participant],
    }))
  },

  removeParticipant: (participant: VoiceParticipant) => {
    set((state) => ({
      participants: state.participants.filter(p => p.id !== participant.id),
    }))
  },

  updateVoiceParticipant: (userId: string, updates: Partial<VoiceParticipant>) => {
    set((state) => ({
      participants: state.participants.map(p =>
        p.userId === userId ? { ...p, ...updates } : p
      ),
    }))
  },

  startCapture: async (roomId?: number) => {
    set({ isLoading: true, error: null })
    try {
      // Capture microphone with echo cancellation, noise suppression, and auto gain control
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      })
      const devices = await navigator.mediaDevices.enumerateDevices()
      set({
        isCapturing: true,
        stream,
        devices,
        isLoading: false,
        currentRoomId: roomId ?? null,
        isInVoice: true,
      })

      // Set up WebRTC voice chat if we have a room ID
      if (roomId) {
        const manager = getWebrtcManager()
        if (manager) {
          manager.setLocalStream(stream)

          // Fetch current voice participants and create offers to each
          try {
            const participants = await voiceService.getVoiceParticipants(roomId)
            const currentUserStr = localStorage.getItem('userId')
            const targetUserIds = participants
              .filter(p => String(p.userId) !== currentUserStr)
              .map(p => p.userId)

            if (targetUserIds.length > 0) {
              await manager.startVoiceChat(stream, targetUserIds)
            }
          } catch (err) {
            console.error('[VoiceChat] Failed to fetch participants for WebRTC:', err)
          }
        }
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '启动音频捕获失败',
      })
      throw err
    }
  },

  stopCapture: async () => {
    const { stream, currentRoomId } = get()

    // Stop WebRTC voice chat
    destroyWebrtcManager()

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }

    set({
      isCapturing: false,
      stream: null,
      isInVoice: false,
      currentRoomId: null,
      remoteStreams: new Map(),
    })

    // Notify backend that we left voice
    if (currentRoomId) {
      try {
        await voiceService.leaveVoice(currentRoomId)
      } catch (err) {
        console.error('[VoiceChat] Failed to leave voice room:', err)
      }
    }
  },

  setStream: (stream: MediaStream | null) => {
    set({ stream })
  },

  clearError: () => {
    set({ error: null })
  },

  addRemoteStream: (userId: number, username: string, stream: MediaStream) => {
    set((state) => {
      const newMap = new Map(state.remoteStreams)
      newMap.set(userId, { userId, username, stream })
      return { remoteStreams: newMap }
    })
  },

  removeRemoteStream: (userId: number) => {
    set((state) => {
      const newMap = new Map(state.remoteStreams)
      newMap.delete(userId)
      return { remoteStreams: newMap }
    })
  },

  handleVoiceSignal: async (fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest) => {
    const manager = getWebrtcManager()
    if (!manager) return

    // Ensure the manager has the local stream set when handling offers
    const { stream } = get()
    if (stream && !manager.getLocalStream()) {
      manager.setLocalStream(stream)
    }

    await manager.handleSignal(fromUserId, fromUsername, signal)
  },
}))

// Re-export for backward compatibility
export const useAudioStore = useVoiceStore
