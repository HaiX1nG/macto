import { create } from 'zustand'
import { WebRTCManager } from '../utils/webrtcManager'
import { wsConnection } from '../services/wsConnection'
import { voiceService } from '../services'
import { useAuthStore } from './authStore'
import type { WebRTCSignalRequest } from '@shared/types/voice'

// ==================== Types ====================

export interface RemoteScreen {
  userId: number
  username: string
  stream: MediaStream
}

export interface RemoteVoiceStream {
  userId: number
  username: string
  stream: MediaStream
}

export interface MediaState {
  // Screen share state
  isSharing: boolean
  controlEnabled: boolean
  currentStreamId: string
  localStream: MediaStream | null
  currentRoomId: number | null
  isLoading: boolean
  error: string | null
  remoteScreens: Map<number, RemoteScreen>
  peerConnections: Map<number, RTCPeerConnection>

  // Audio device state (moved from voiceStore)
  devices: MediaDeviceInfo[]
  inputDeviceId: string | null
  outputDeviceId: string | null
  volume: number
  isCapturing: boolean
  voiceStream: MediaStream | null
  // Mute state - single source of truth for UI mute indicator.
  // The actual audio track muting is applied here too (track.enabled).
  isMuted: boolean

  // Remote voice streams (WebRTC peers)
  voiceRemoteStreams: Map<number, RemoteVoiceStream>

  // Screen share actions
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

  // Audio device actions (moved from voiceStore)
  setDevices: (devices: MediaDeviceInfo[]) => void
  setInputDevice: (deviceId: string) => void
  setOutputDevice: (deviceId: string) => void
  setVolume: (volume: number) => void
  setMute: (muted: boolean) => void
  setStream: (stream: MediaStream | null) => void
  startCapture: (roomId?: number) => Promise<void>
  stopCapture: () => Promise<void>

  // Voice WebRTC actions (moved from voiceStore)
  addVoiceRemoteStream: (userId: number, username: string, stream: MediaStream) => void
  removeVoiceRemoteStream: (userId: number) => void
  handleVoiceSignal: (fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest) => Promise<void>

  clearError: () => void
}

// ==================== WebRTC Manager (module-level, not serializable) ====================

let webrtcManager: WebRTCManager | null = null

function getWebrtcManager(): WebRTCManager | null {
  if (!webrtcManager) {
    const authState = useAuthStore.getState()
    const userId = authState.currentUser?.id
    if (userId === undefined) return null

    webrtcManager = new WebRTCManager(
      userId,
      async (signal: WebRTCSignalRequest) => {
        const ws = wsConnection.getCurrentWs()
        if (!ws) return
        // Event envelope goes in `event` + `data`, matching WebSocketService.send
        // and the backend EventWebRTCSignal handler. (Previously sent { type, payload }
        // as the top-level object → had no `event` field → backend never saw the signal.)
        ws.send({
          event: 'webrtc_signal',
          data: {
            type: signal.type,
            targetId: signal.targetId,
            payload: signal.payload,
          },
        })
      },
      (remoteUserId: number, username: string, stream: MediaStream) => {
        // Remote stream received - route by track kind.
        // A stream carrying video is a screen share → remoteScreens.
        // A pure-audio stream is voice chat → voiceRemoteStreams.
        const hasVideo = stream.getVideoTracks().length > 0
        if (hasVideo) {
          useMediaStore.getState().addRemoteScreen(remoteUserId, username, stream)
          return
        }

        // Pure-audio (voice) remote stream - play it and add to store.
        // Apply the user's output volume before playback starts.
        const audio = new Audio()
        audio.srcObject = stream
        audio.autoplay = true
        // Volume is stored as a percentage (0-100) → map to Web Audio 0..1.
        audio.volume = useMediaStore.getState().volume / 100
        audio.play().catch((err) => {
          console.error('[MediaStore] Failed to play remote audio:', err)
        })
        useMediaStore.getState().addVoiceRemoteStream(remoteUserId, username, stream)
      },
      (userId: number) => {
        // Peer disconnected - clear from both remote voice and remote screens.
        useMediaStore.getState().removeVoiceRemoteStream(userId)
        useMediaStore.getState().removeRemoteScreen(userId)
      }
    )
  }
  return webrtcManager
}

function destroyWebrtcManager(): void {
  if (webrtcManager) {
    webrtcManager.stopVoiceChat()
    webrtcManager.closeAll()
    webrtcManager = null
  }
}

// ==================== Store ====================

export const useMediaStore = create<MediaState>((set, get) => ({
  // Screen share initial state
  isSharing: false,
  controlEnabled: false,
  currentStreamId: '',
  localStream: null,
  currentRoomId: null,
  isLoading: false,
  error: null,
  remoteScreens: new Map(),
  peerConnections: new Map(),

  // Audio device initial state
  devices: [],
  inputDeviceId: null,
  outputDeviceId: null,
  volume: 100,
  isCapturing: false,
  voiceStream: null,
  isMuted: false,

  // Voice WebRTC initial state
  voiceRemoteStreams: new Map(),

  // ==================== Screen Share Actions ====================

  startSharing: async (roomId: number) => {
    set({ isLoading: true, error: null })
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 },
        },
        audio: true,
      })
      set({
        isSharing: true,
        localStream: stream,
        currentStreamId: `stream-${Date.now()}`,
        currentRoomId: roomId,
        isLoading: false,
      })

      const manager = getWebrtcManager()
      if (!manager) {
        set({ isLoading: false, error: 'WebRTC 初始化失败' })
        return
      }

      // 1. Fetch voice participants, excluding self → offer targets
      const currentUserId = useAuthStore.getState().currentUser?.id
      let targetUserIds: number[] = []
      try {
        const participants = await voiceService.getVoiceParticipants(roomId)
        targetUserIds = participants
          .filter((p) => p.userId !== currentUserId)
          .map((p) => p.userId)
      } catch (err) {
        console.warn('[MediaStore] Failed to fetch participants for screen share:', err)
      }

      // 2. Send WebRTC offer to each participant
      if (targetUserIds.length > 0) {
        await manager.startScreenShare(stream, targetUserIds)
      }

      // 3. Notify backend screen share session is active
      try {
        await voiceService.startScreenShare(roomId)
      } catch (err) {
        console.warn('[MediaStore] Failed to notify backend screen share:', err)
      }

      // 4. Broadcast screen_share_start to all channel members via WS
      const ws = wsConnection.getCurrentWs()
      ws?.send({
        event: 'screen_share_start',
        data: {
          channelId: roomId,
          userId: currentUserId,
        },
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '屏幕共享失败',
      })
      throw err
    }
  },

  stopSharing: async (_roomId: number) => {
    const { localStream } = get()

    // 1. Close WebRTC peer connections for the screen share
    try {
      getWebrtcManager()?.stopScreenShare()
    } catch (err) {
      console.warn('[MediaStore] Failed to stop WebRTC screen share:', err)
    }

    // 2. Notify backend screen share session ended
    try {
      await voiceService.stopScreenShare(_roomId)
    } catch (err) {
      console.warn('[MediaStore] Failed to notify backend screen share stop:', err)
    }

    // 3. Broadcast screen_share_stop to all channel members via WS
    const currentUserId = useAuthStore.getState().currentUser?.id
    const ws = wsConnection.getCurrentWs()
    ws?.send({
      event: 'screen_share_stop',
      data: {
        channelId: _roomId,
        userId: currentUserId,
      },
    })

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    set({
      isSharing: false,
      localStream: null,
      currentStreamId: '',
      controlEnabled: false,
    })
  },

  enableControl: () => {
    set({ controlEnabled: true })
  },

  disableControl: () => {
    set({ controlEnabled: false })
  },

  setLocalStream: (stream: MediaStream | null) => {
    set({ localStream: stream })
  },

  setIsSharing: (isSharing: boolean) => {
    set({ isSharing })
  },

  addRemoteScreen: (userId: number, username: string, stream: MediaStream) => {
    set((state) => {
      const newMap = new Map(state.remoteScreens)
      newMap.set(userId, { userId, username, stream })
      return { remoteScreens: newMap }
    })
  },

  removeRemoteScreen: (userId: number) => {
    set((state) => {
      const newMap = new Map(state.remoteScreens)
      newMap.delete(userId)
      return { remoteScreens: newMap }
    })
  },

  addPeerConnection: (userId: number, pc: RTCPeerConnection) => {
    set((state) => {
      const newMap = new Map(state.peerConnections)
      newMap.set(userId, pc)
      return { peerConnections: newMap }
    })
  },

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

  getPeerConnection: (userId: number) => {
    return get().peerConnections.get(userId)
  },

  clearAll: () => {
    const { localStream, peerConnections, voiceStream } = get()
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    if (voiceStream) {
      voiceStream.getTracks().forEach((track) => track.stop())
    }
    peerConnections.forEach((pc) => pc.close())
    destroyWebrtcManager()
    set({
      isSharing: false,
      localStream: null,
      currentStreamId: '',
      controlEnabled: false,
      remoteScreens: new Map(),
      peerConnections: new Map(),
      isCapturing: false,
      voiceStream: null,
      voiceRemoteStreams: new Map(),
    })
  },

  // ==================== Audio Device Actions (from voiceStore) ====================

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
    const { voiceStream } = get()
    if (voiceStream) {
      voiceStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted
      })
    }
    // Single source of truth for mute state lives here in mediaStore.
    set({ isMuted: muted })
  },

  setStream: (stream: MediaStream | null) => {
    set({ voiceStream: stream })
  },

  startCapture: async (roomId?: number) => {
    set({ isLoading: true, error: null })
    try {
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
        voiceStream: stream,
        devices,
        isLoading: false,
        currentRoomId: roomId ?? null,
      })

      // Set up WebRTC voice chat if we have a room ID
      if (roomId) {
        const manager = getWebrtcManager()
        if (manager) {
          manager.setLocalStream(stream)

          try {
            const participants = await voiceService.getVoiceParticipants(roomId)
            const currentUserId = useAuthStore.getState().currentUser?.id
            const targetUserIds = participants
              .filter((p) => p.userId !== currentUserId)
              .map((p) => p.userId)

            if (targetUserIds.length > 0) {
              await manager.startVoiceChat(stream, targetUserIds)
            }
          } catch (err) {
            console.error('[MediaStore] Failed to fetch participants for WebRTC:', err)
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
    const { voiceStream, currentRoomId } = get()

    // Stop WebRTC voice chat
    destroyWebrtcManager()

    if (voiceStream) {
      voiceStream.getTracks().forEach((track) => track.stop())
    }

    set({
      isCapturing: false,
      voiceStream: null,
      voiceRemoteStreams: new Map(),
    })

    // Notify backend that we left voice
    if (currentRoomId) {
      try {
        await voiceService.leaveVoice(currentRoomId)
      } catch (err) {
        console.error('[MediaStore] Failed to leave voice:', err)
      }
      set({ currentRoomId: null })
    }
  },

  // ==================== Voice WebRTC Actions (from voiceStore) ====================

  addVoiceRemoteStream: (userId: number, username: string, stream: MediaStream) => {
    set((state) => {
      const newMap = new Map(state.voiceRemoteStreams)
      newMap.set(userId, { userId, username, stream })
      return { voiceRemoteStreams: newMap }
    })
  },

  removeVoiceRemoteStream: (userId: number) => {
    set((state) => {
      const newMap = new Map(state.voiceRemoteStreams)
      newMap.delete(userId)
      return { voiceRemoteStreams: newMap }
    })
  },

  handleVoiceSignal: async (fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest) => {
    const manager = getWebrtcManager()
    if (!manager) return

    // Ensure the manager has the local stream set when handling offers,
    // so the responder echoes back its own audio in a bidirectional call.
    const { voiceStream } = get()
    if (voiceStream && !manager.getLocalStream()) {
      manager.setLocalStream(voiceStream)
    }

    await manager.handleSignal(fromUserId, fromUsername, signal)
  },

  clearError: () => {
    set({ error: null })
  },
}))
