import { create } from 'zustand'
import { WebRTCManager } from '../utils/webrtcManager'
import { wsConnection } from '../services/wsConnection'
import { voiceService } from '../services'
import { useAuthStore } from './authStore'
import type { WebRTCSignalRequest } from '@shared/types/voice'
import { ConnectionState, ConnectionFailureCode } from '@shared/types/voice'
import { setRemoteAudioElementsRef } from './voiceStore'

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

  // Connection lifecycle state for voice/screen
  connectionState: ConnectionState
  connectionFailureCode: ConnectionFailureCode | null
  reconnectAttempt: number
  maxReconnectAttempts: number
  isAutoReconnecting: boolean

  // Screen share WebRTC action (independent manager, separate from voice)
  handleScreenSignal: (fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest) => Promise<void>
  screenManagerOwnsPeer: (userId: number) => boolean
  closeScreenConnection: (userId: number) => void

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

  // Connection state actions
  setConnectionState: (state: ConnectionState, code?: ConnectionFailureCode) => void
  startAutoReconnect: () => void
  stopAutoReconnect: () => void
  retryConnection: () => void
  clearConnectionError: () => void

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
let webrtcManagerOwnerUserId: number | null = null
let webrtcManagerOwnerGeneration: number | null = null

/**
 * Module-level map of remote user ID → HTMLAudioElement.
 * Used by setVolume / setDeafen to control actual audio output.
 */
const remoteAudioElements = new Map<number, HTMLAudioElement>()

// Export reference for voiceStore.setDeafen (deafen needs direct access to audio elements)
setRemoteAudioElementsRef(remoteAudioElements)

function isMediaOwner(ownerUserId: number | undefined, ownerGeneration: number): ownerUserId is number {
  if (ownerUserId === undefined) return false
  return useAuthStore.getState().currentUser?.id === ownerUserId
    && wsConnection.getSessionGeneration() === ownerGeneration
}

function sendMediaSignal(
  signal: WebRTCSignalRequest,
  mediaType: 'voice' | 'screen',
  ownerUserId: number,
  ownerGeneration: number
): void {
  // A manager can outlive its auth session (for example, a late ICE callback
  // after logout). Never let that callback initialize or use a new user's WS.
  if (!isMediaOwner(ownerUserId, ownerGeneration)) return

  const ws = wsConnection.getQueueableWs()
  if (!ws) return

  try {
    // Event envelope goes in `event` + `data`, matching WebSocketService.send
    // and the backend EventWebRTCSignal handler. (Previously sent { type, payload }
    // as the top-level object → had no `event` field → backend never saw the signal.)
    ws.send({
      event: 'webrtc_signal',
      data: {
        type: signal.type,
        targetId: signal.targetId,
        payload: signal.payload,
        mediaType,
      },
    })
  } catch (error) {
    // WebSocket.send can throw synchronously if the transport changes state
    // between the ready-state check and the underlying send call.
    console.error('[MediaStore] Failed to send WebRTC signal:', error)
  }
}

function sendScreenShareEvent(
  event: 'screen_share_start' | 'screen_share_stop',
  channelId: number,
  ownerUserId: number | undefined,
  ownerGeneration: number
): void {
  if (!isMediaOwner(ownerUserId, ownerGeneration)) return

  try {
    const ws = wsConnection.getQueueableWs()
    ws?.send({
      event,
      data: {
        channelId,
        userId: ownerUserId,
      },
    })
  } catch (error) {
    console.error('[MediaStore] Failed to send screen-share event:', error)
  }
}

function getWebrtcManager(): WebRTCManager | null {
  const authState = useAuthStore.getState()
  const userId = authState.currentUser?.id
  if (userId === undefined) return null

  const ownerGeneration = wsConnection.getSessionGeneration()
  if (
    webrtcManager
    && (webrtcManagerOwnerUserId !== userId || webrtcManagerOwnerGeneration !== ownerGeneration)
  ) {
    destroyWebrtcManager()
  }

  if (!webrtcManager) {
    webrtcManagerOwnerUserId = userId
    webrtcManagerOwnerGeneration = ownerGeneration
    webrtcManager = new WebRTCManager(
      userId,
      (signal: WebRTCSignalRequest) => {
        sendMediaSignal(signal, 'voice', userId, ownerGeneration)
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
        // Store the audio element so volume/deafen can control it.
        remoteAudioElements.set(remoteUserId, audio)
        useMediaStore.getState().addVoiceRemoteStream(remoteUserId, username, stream)
      },
      (userId: number) => {
        // Peer disconnected - clear from both remote voice and remote screens.
        useMediaStore.getState().removeVoiceRemoteStream(userId)
        useMediaStore.getState().removeRemoteScreen(userId)
      },
      'voice'
    )
  }
  return webrtcManager
}

function destroyWebrtcManager(): void {
  if (webrtcManager) {
    webrtcManager.stopVoiceChat()
    webrtcManager.closeAll()
    webrtcManager = null
    webrtcManagerOwnerUserId = null
    webrtcManagerOwnerGeneration = null
  }
  // Clean up all remote audio elements
  remoteAudioElements.forEach((audio) => {
    audio.pause()
    audio.srcObject = null
  })
  remoteAudioElements.clear()
}

// ==================== Screen WebRTC Manager (independent of voice) ====================
// Screen sharing keeps its own manager + peerConnections map, separate from the
// voice `getWebrtcManager()` singleton. This fixes the bug where a screen offer
// was routed onto the existing voice peer (handleAnswer branch, no ontrack) and
// the remote video was never received. The two tracks/peers no longer collide.

let screenManager: WebRTCManager | null = null
let screenStopPromise: Promise<void> | null = null
let screenManagerOwnerUserId: number | null = null
let screenManagerOwnerGeneration: number | null = null

/** Reconnect timer ID for cleanup */
let reconnectTimerId: ReturnType<typeof setTimeout> | null = null

function getScreenManager(): WebRTCManager | null {
  const authState = useAuthStore.getState()
  const userId = authState.currentUser?.id
  if (userId === undefined) return null

  const ownerGeneration = wsConnection.getSessionGeneration()
  if (
    screenManager
    && (screenManagerOwnerUserId !== userId || screenManagerOwnerGeneration !== ownerGeneration)
  ) {
    destroyScreenManager()
  }

  if (!screenManager) {
    screenManagerOwnerUserId = userId
    screenManagerOwnerGeneration = ownerGeneration
    screenManager = new WebRTCManager(
      userId,
      (signal: WebRTCSignalRequest) => {
        sendMediaSignal(signal, 'screen', userId, ownerGeneration)
      },
      // onRemoteStream → a screen peer only ever delivers video; route to remoteScreens.
      (remoteUserId: number, username: string, stream: MediaStream) => {
        useMediaStore.getState().addRemoteScreen(remoteUserId, username, stream)
      },
      // onDisconnected → clear the remote screen.
      (remoteUserId: number) => {
        useMediaStore.getState().removeRemoteScreen(remoteUserId)
      },
      'screen'
    )
  }
  return screenManager
}

function destroyScreenManager(): void {
  if (screenManager) {
    screenManager.closeAll()
    screenManager = null
  }
  screenManagerOwnerUserId = null
  screenManagerOwnerGeneration = null
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

  // Connection lifecycle initial state
  connectionState: ConnectionState.Disconnected,
  connectionFailureCode: null,
  reconnectAttempt: 0,
  maxReconnectAttempts: 3,
  isAutoReconnecting: false,

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
    const ownerUserId = useAuthStore.getState().currentUser?.id
    const ownerGeneration = wsConnection.getSessionGeneration()
    set({ isLoading: true, error: null })
    let stream: MediaStream | null = null
    let reservationCreated = false

    const rollback = async (): Promise<void> => {
      // Roll back every local side effect before reporting the failure. In
      // particular, don't leave an offered screen peer or a live capture
      // behind when the backend reservation is rejected.
      try {
        screenManager?.stopScreenShare()
      } catch (rollbackError) {
        console.warn('[MediaStore] Failed to roll back screen peers:', rollbackError)
      }
      destroyScreenManager()

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.onended = null
          track.stop()
        })
      }
      if (reservationCreated) {
        try {
          await voiceService.stopScreenShare(roomId)
        } catch (rollbackError) {
          console.warn('[MediaStore] Failed to roll back screen-share reservation:', rollbackError)
        }
      }

      set({
        isLoading: false,
        isSharing: false,
        localStream: null,
        currentStreamId: '',
        controlEnabled: false,
        error: '屏幕共享失败',
      })
    }

    try {
      const displayVideoConstraints = {
        cursor: 'always' as const,
        logicalSurface: true,
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
      } as unknown as MediaTrackConstraints

      stream = await navigator.mediaDevices.getDisplayMedia({
        video: displayVideoConstraints,
        // System audio is opt-in; screen share must not capture it by default.
        audio: false,
      })

      // Fetch voice participants, excluding self → offer targets.
      const currentUserId = useAuthStore.getState().currentUser?.id
      let targetUserIds: number[] = []
      try {
        const participants = await voiceService.getVoiceParticipants(roomId)
        targetUserIds = participants
          .filter((p) => p.userId !== currentUserId)
          .map((p) => p.userId)
      } catch (participantError) {
        console.warn('[MediaStore] Failed to fetch participants for screen share:', participantError)
      }

      // Reserve the backend session before creating offers or broadcasting the
      // start event. A rejected reservation therefore cannot advertise a share.
      await voiceService.startScreenShare(roomId)
      reservationCreated = true

      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.onended = () => {
          void get().stopSharing(roomId)
        }
      }

      set({
        isSharing: true,
        localStream: stream,
        currentStreamId: `stream-${Date.now()}`,
        currentRoomId: roomId,
      })

      // Send WebRTC offers through the dedicated screen manager. This manager
      // never shares a peer map with the voice manager.
      if (targetUserIds.length > 0) {
        const screenManagerInstance = getScreenManager()
        if (screenManagerInstance) {
          await screenManagerInstance.startScreenShare(stream, targetUserIds)
        }
      }

      sendScreenShareEvent('screen_share_start', roomId, ownerUserId, ownerGeneration)
      set({ isLoading: false })
    } catch (err) {
      await rollback()
      console.error('[MediaStore] Screen share error:', err)
      throw err
    }
  },

  stopSharing: async (_roomId: number) => {
    if (screenStopPromise) return screenStopPromise

    const ownerUserId = useAuthStore.getState().currentUser?.id
    const ownerGeneration = wsConnection.getSessionGeneration()
    screenStopPromise = (async () => {
      const { localStream, isSharing } = get()
      if (!isSharing && !localStream && !screenManager) return

      // Close peers and stop capture before notifying the backend. This also
      // makes native track `onended` cleanup idempotent with an explicit stop.
      try {
        screenManager?.stopScreenShare()
      } catch (err) {
        console.warn('[MediaStore] Failed to stop WebRTC screen share:', err)
      }
      destroyScreenManager()

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.onended = null
          track.stop()
        })
      }
      set({
        isSharing: false,
        localStream: null,
        currentStreamId: '',
        controlEnabled: false,
        isLoading: false,
      })

      try {
        await voiceService.stopScreenShare(_roomId)
      } catch (err) {
        console.warn('[MediaStore] Failed to notify backend screen share stop:', err)
      }

      sendScreenShareEvent('screen_share_stop', _roomId, ownerUserId, ownerGeneration)
    })()

    try {
      await screenStopPromise
    } finally {
      screenStopPromise = null
    }
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
    destroyScreenManager()
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
    // Apply volume to all remote audio elements (0-100 → 0..1)
    remoteAudioElements.forEach((audio) => {
      audio.volume = volume / 100
    })
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
      // Detect specific error types and set appropriate failure codes
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          set({
            connectionState: ConnectionState.Failed,
            connectionFailureCode: ConnectionFailureCode.PermissionDenied,
            error: '需要麦克风/屏幕录制权限',
          })
        } else if (err.name === 'NotFoundError') {
          set({
            connectionState: ConnectionState.Failed,
            connectionFailureCode: ConnectionFailureCode.DeviceNotFound,
            error: '未找到麦克风设备',
          })
        }
      }
      destroyWebrtcManager()
      const staleStream = get().voiceStream
      staleStream?.getTracks().forEach((track) => track.stop())
      set({
        isCapturing: false,
        voiceStream: null,
        voiceRemoteStreams: new Map(),
        currentRoomId: null,
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

    // Clean up remote audio elements (also done in destroyWebrtcManager, but
    // belt-and-suspenders for direct stopCapture callers).
    remoteAudioElements.forEach((audio) => {
      audio.pause()
      audio.srcObject = null
    })
    remoteAudioElements.clear()

    set({
      isCapturing: false,
      voiceStream: null,
      voiceRemoteStreams: new Map(),
    })

    // Notify backend that we left voice. Keep currentRoomId until the REST
    // request succeeds so a failed leave remains retryable and observable.
    if (currentRoomId !== null) {
      try {
        await voiceService.leaveVoice(currentRoomId)
        set({ currentRoomId: null })
      } catch (err) {
        const error = err instanceof Error ? err.message : '离开语音频道失败'
        set({ error })
        console.error('[MediaStore] Failed to leave voice:', err)
        throw err
      }
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
      return { voiceRemoteStreams: new Map(newMap) }
    })
    // Clean up the remote audio element for this user
    const audio = remoteAudioElements.get(userId)
    if (audio) {
      audio.pause()
      audio.srcObject = null
      remoteAudioElements.delete(userId)
    }
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

  // ==================== Screen WebRTC Signal Handler (independent manager) ====================
  // Route incoming webrtc_signal for an active screen-share offer/renegotiation
  // to the dedicated screen manager, NOT the voice manager. Because screen and
  // voice managers have separate peerConnection maps, B's screen offer lands on a
  // fresh peer where ontrack is registered → onRemoteStream(video) → remoteScreens.

  handleScreenSignal: async (fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest) => {
    const manager = getScreenManager()
    if (!manager) return
    await manager.handleSignal(fromUserId, fromUsername, signal)
  },

  screenManagerOwnsPeer: (userId: number) => {
    const user = screenManager?.getConnectedUserIds() ?? []
    return user.includes(userId)
  },

  closeScreenConnection: (userId: number) => {
    screenManager?.closeConnection(userId)
    useMediaStore.getState().removeRemoteScreen(userId)
  },

  clearError: () => {
    set({ error: null })
  },

  // ==================== Connection State Actions ====================

  setConnectionState: (state: ConnectionState, code?: ConnectionFailureCode) => {
    set({
      connectionState: state,
      connectionFailureCode: code ?? null,
      reconnectAttempt: state === ConnectionState.Reconnecting ? get().reconnectAttempt + 1 : 0,
    })
  },

  startAutoReconnect: () => {
    if (get().isAutoReconnecting) return
    set({ isAutoReconnecting: true })
    const attempt = get().reconnectAttempt + 1
    const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 30000)
    reconnectTimerId = setTimeout(() => {
      get().retryConnection()
    }, backoff)
  },

  stopAutoReconnect: () => {
    if (reconnectTimerId) { clearTimeout(reconnectTimerId); reconnectTimerId = null }
    set({ isAutoReconnecting: false })
  },

  retryConnection: () => {
    const { reconnectAttempt, maxReconnectAttempts } = get()
    if (reconnectAttempt >= maxReconnectAttempts) {
      set({
        connectionState: ConnectionState.Failed,
        connectionFailureCode: ConnectionFailureCode.ServerUnreachable,
        isAutoReconnecting: false,
      })
      return
    }
    set({
      connectionState: ConnectionState.Connecting,
      reconnectAttempt: reconnectAttempt + 1,
    })
  },

  clearConnectionError: () => {
    set({
      connectionState: ConnectionState.Disconnected,
      connectionFailureCode: null,
      reconnectAttempt: 0,
      isAutoReconnecting: false,
    })
  },
}))
