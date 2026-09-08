import { create } from 'zustand'
import type { VoiceParticipant } from '@shared/types/voice'
import { voiceService } from '../services/voiceService'
import { wsConnection } from '../services/wsConnection'
import { useMediaStore } from './mediaStore'

// Module-level reference to remote audio elements from mediaStore.
// This allows voiceStore.setDeafen to control remote audio volumes directly.
let remoteAudioElements: Map<number, HTMLAudioElement> | null = null

// Called by mediaStore to expose its audio elements for deafen control
export function setRemoteAudioElementsRef(elements: Map<number, HTMLAudioElement>): void {
  remoteAudioElements = elements
}

function getQueueableWebSocket() {
  const token = localStorage.getItem('accessToken')
  if (!token) return null
  return wsConnection.connectWithToken(token)
}

function sendVoicePresence(event: 'voice_join' | 'voice_leave', channelId: number): void {
  try {
    getQueueableWebSocket()?.send({
      event,
      data: { channelId },
    })
  } catch (error) {
    // REST membership is authoritative; a socket race must not make a
    // successful leave retry the REST request or reject navigation.
    console.error('[VoiceStore] Failed to send voice presence:', error)
  }
}

let leaveVoiceInFlight: Promise<void> | null = null
let voiceOperationGeneration = 0
let joinInFlight = false
let pendingLeaveRequested = false
let membershipCleanupPromise: Promise<void> | null = null
let membershipCleanupChannelId: number | null = null
// Tracks whether the user was already muted before deafen was enabled,
// so undeafen can restore the original mute state.
let wasMutedBeforeDeafen = false

// ==================== Session Management: Reconnect Recovery ====================

/** Last joined channel ID for auto-rejoin after reconnect */
let lastJoinedChannelId: number | null = null
/** Whether auto-reconnect is currently in flight */
let autoReconnectInFlight: boolean = false
/** Mute state before disconnect for restore */
let wasMutedBeforeDisconnect: boolean = false
/** Deafen state before disconnect for restore */
let wasDeafenedBeforeDisconnect: boolean = false

async function cleanupVoiceMembership(channelId: number): Promise<void> {
  if (membershipCleanupPromise && membershipCleanupChannelId === channelId) {
    return membershipCleanupPromise
  }

  // `currentCleanup` is assigned after the closure is constructed because the
  // IIFE needs a stable reference that the inner finally block can read.
  // eslint-disable-next-line prefer-const
  let currentCleanup: Promise<void>
  const cleanupPromise = (async () => {
    try {
      await voiceService.leaveVoice(channelId)
    } finally {
      void currentCleanup
      if (membershipCleanupPromise === currentCleanup) {
        membershipCleanupPromise = null
        membershipCleanupChannelId = null
      }
    }
  })()
  currentCleanup = cleanupPromise
  membershipCleanupPromise = currentCleanup
  membershipCleanupChannelId = channelId
  return cleanupPromise
}

function isCurrentVoiceOperation(operation: number, channelId: number): boolean {
  return voiceOperationGeneration === operation
    && useVoiceStore.getState().currentVoiceChannelId === channelId
}

function createVoiceJoinCancellationError(): Error {
  return new Error('Voice join cancelled')
}

export interface VoiceState {
  // Voice state (slim - WebRTC, devices AND mute moved to mediaStore)
  currentVoiceChannelId: number | null
  participants: VoiceParticipant[]
  isDeafened: boolean
  isSpeaking: boolean
  isInVoice: boolean
  error: string | null

  // Actions
  joinVoice: (channelId: number) => Promise<void>
  leaveVoice: () => Promise<void>
  /**
   * Legacy alias for mute. Mute state lives in mediaStore (single source of
   * truth); this delegates to it so old call sites keep working.
   */
  setMute: (muted: boolean) => void
  setDeafen: (deafened: boolean) => void
  setSpeaking: (speaking: boolean) => void

  // WS event handlers
  onParticipantJoined: (channelId: number, participant: VoiceParticipant) => void
  onParticipantLeft: (channelId: number, userId: number) => void

  // Reconnect recovery
  autoReconnectOnReconnect: () => Promise<void>
  getLastJoinedChannelId: () => number | null

  clearError: () => void
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  // Initial state
  currentVoiceChannelId: null,
  participants: [],
  isDeafened: false,
  isSpeaking: false,
  isInVoice: false,
  error: null,

  // Join voice channel
  joinVoice: async (channelId: number) => {
    const operationGeneration = ++voiceOperationGeneration
    joinInFlight = true
    set({ error: null })
    let voiceMembershipEstablished = false
    let voicePresenceAnnounced = false
    try {
      await voiceService.joinVoice(channelId)
      voiceMembershipEstablished = true
      // Record the channel id before capture so leaveVoice can resolve it even
      // if capture below fails mid-way.
      set({ currentVoiceChannelId: channelId })
      if (pendingLeaveRequested) {
        pendingLeaveRequested = false
        let cleanupErrorMessage: string | null = null
        try {
          await cleanupVoiceMembership(channelId)
        } catch (leaveError) {
          cleanupErrorMessage =
            leaveError instanceof Error ? leaveError.message : '清理语音成员失败'
          console.warn('[VoiceStore] Failed to roll back voice join:', leaveError)
        }
        useMediaStore.setState({ currentRoomId: null })
        try {
          await useMediaStore.getState().stopCapture()
        } catch (cleanupError) {
          console.warn('[VoiceStore] Failed to clean up voice capture:', cleanupError)
        }
        set({
          currentVoiceChannelId: null,
          participants: [],
          isInVoice: false,
          isDeafened: false,
          isSpeaking: false,
        })
        if (cleanupErrorMessage) {
          set({ error: cleanupErrorMessage })
        }
        throw createVoiceJoinCancellationError()
      }
      // Start real WebRTC audio capture: getUserMedia → setLocalStream →
      // fetch participants → startVoiceChat (offer to each other user).
      // See mediaStore.startCapture.
      await useMediaStore.getState().startCapture(channelId)
      // Send through the shared service's queue so a connecting/reconnecting
      // socket delivers the membership event once it is open.
      sendVoicePresence('voice_join', channelId)
      voicePresenceAnnounced = true
      // Fetch current participants
      const participants = await voiceService.getVoiceParticipants(channelId)
      if (!isCurrentVoiceOperation(operationGeneration, channelId)) {
        throw createVoiceJoinCancellationError()
      }
      set({
        participants,
        isInVoice: true,
        isDeafened: false,
        isSpeaking: false,
      })

      // Record channel for reconnect recovery
      lastJoinedChannelId = channelId
      wasMutedBeforeDisconnect = useMediaStore.getState().isMuted
      wasDeafenedBeforeDisconnect = get().isDeafened
    } catch (err) {
      let cleanupErrorMessage: string | null = null
      const ownsVoiceMembership =
        voiceMembershipEstablished && isCurrentVoiceOperation(operationGeneration, channelId)
      if (ownsVoiceMembership) {
        // stopCapture normally also leaves the backend. Clear its room id first
        // so failed joins perform exactly one REST leave (the one here) while
        // still tearing down local tracks and peer connections.
        try {
          await cleanupVoiceMembership(channelId)
        } catch (leaveError) {
          cleanupErrorMessage =
            leaveError instanceof Error ? leaveError.message : '清理语音成员失败'
          // Cleanup is best effort; preserve and rethrow the original failure.
          console.warn('[VoiceStore] Failed to roll back voice join:', leaveError)
        }

        if (voicePresenceAnnounced) {
          sendVoicePresence('voice_leave', channelId)
        }
        useMediaStore.setState({ currentRoomId: null })
        try {
          await useMediaStore.getState().stopCapture()
        } catch (cleanupError) {
          // Cleanup is best effort; preserve and rethrow the original failure.
          console.warn('[VoiceStore] Failed to clean up voice capture:', cleanupError)
        }

        set({
          currentVoiceChannelId: null,
          participants: [],
          isInVoice: false,
          isDeafened: false,
          isSpeaking: false,
        })
      }

      set({
        error:
          err instanceof Error
            ? cleanupErrorMessage
              ? `${err.message}; ${cleanupErrorMessage}`
              : err.message
            : cleanupErrorMessage
              ? `加入语音频道失败; ${cleanupErrorMessage}`
              : '加入语音频道失败',
      })
      throw err
    } finally {
      joinInFlight = false
    }
  },

  // Leave voice channel
  leaveVoice: async () => {
    voiceOperationGeneration += 1
    if (leaveVoiceInFlight) return leaveVoiceInFlight

    const { currentVoiceChannelId } = get()
    if (currentVoiceChannelId === null) {
      if (joinInFlight) pendingLeaveRequested = true
      return
    }

    const leavePromise = (async () => {
      set({ error: null })
      try {
        // stopCapture stops the mic, tears down WebRTC peers and notifies the
        // backend via voiceService.leaveVoice (single REST leave call).
        await useMediaStore.getState().stopCapture()
        // mediaStore.stopCapture already performs the single REST leave. Send the
        // separate realtime notification through the queueable shared service so
        // it is retained while the socket is connecting or reconnecting.
        sendVoicePresence('voice_leave', currentVoiceChannelId)
        set({
          currentVoiceChannelId: null,
          participants: [],
          isInVoice: false,
          isDeafened: false,
          isSpeaking: false,
        })

        // Clear reconnect recovery state
        lastJoinedChannelId = null
        autoReconnectInFlight = false
        wasMutedBeforeDisconnect = false
        wasDeafenedBeforeDisconnect = false
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : '离开语音频道失败',
        })
        throw err
      }
    })()

    leaveVoiceInFlight = leavePromise
    try {
      await leavePromise
    } finally {
      if (leaveVoiceInFlight === leavePromise) leaveVoiceInFlight = null
    }
  },

  // Set mute state (delegates to mediaStore - single source of truth)
  setMute: (muted: boolean) => {
    useMediaStore.getState().setMute(muted)
  },

  // Set deafen state - deafening mutes the local mic AND silences all remote audio.
  setDeafen: (deafened: boolean) => {
    const mediaStore = useMediaStore.getState()
    const audioElements = remoteAudioElements
    const setAudioVolume = (volume: number) => {
      audioElements?.forEach((audio) => {
        audio.volume = volume
      })
    }
    if (deafened) {
      // Record current mute state so we can restore it on undeafen
      wasMutedBeforeDeafen = mediaStore.isMuted
      // Mute local microphone
      mediaStore.setMute(true)
      // Silence all remote audio elements
      setAudioVolume(0)
      set({ isDeafened: true })
    } else {
      // Restore remote audio volume to the stored volume level
      setAudioVolume(mediaStore.volume / 100)
      // Restore local mute state (only unmute if user was not muted before deafen)
      if (!wasMutedBeforeDeafen) {
        mediaStore.setMute(false)
      }
      set({ isDeafened: false })
    }
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

  // ==================== Reconnect Recovery ====================

  autoReconnectOnReconnect: async () => {
    if (autoReconnectInFlight) return
    if (lastJoinedChannelId === null) return

    autoReconnectInFlight = true
    try {
      console.log('[VoiceStore] Auto-rejoining channel after reconnect:', lastJoinedChannelId)
      await get().joinVoice(lastJoinedChannelId)
      // Restore previous mute/deafen state
      if (wasMutedBeforeDisconnect) {
        useMediaStore.getState().setMute(true)
      }
      if (wasDeafenedBeforeDisconnect) {
        get().setDeafen(true)
      }
    } catch (err) {
      console.error('[VoiceStore] Auto-reconnect failed:', err)
      lastJoinedChannelId = null
    } finally {
      autoReconnectInFlight = false
    }
  },

  getLastJoinedChannelId: () => lastJoinedChannelId,
}))

// Backward compatibility: components may still import useAudioStore
// The device/audio capture methods are now in mediaStore, but the voice state
// methods (setDeafen, setSpeaking, etc.) are available here.
export const useAudioStore = useVoiceStore
