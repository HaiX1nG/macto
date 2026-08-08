import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useServerStore } from '../stores/serverStore'
import { useChatStore } from '../stores/chatStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useWebSocketStore } from '../stores/websocketStore'
import { wsConnection } from '../services/wsConnection'
import type { WebRTCSignalRequest } from '@shared/types/api'
import type {
  NewMessagePayload,
  ParticipantUpdatePayload,
  VoiceStatePayload,
  TypingPayload,
  StateSyncPayload,
} from '../types/websocket'

export function useRoomWebSocket() {
  const { isAuthenticated, currentUser } = useAuthStore()
  const { currentRoomId: currentServerId, addParticipant, removeParticipant, fetchParticipants } = useServerStore()
  const { currentRoomId, addMessage, addTypingUser, removeTypingUser } = useChatStore()
  const { addParticipant: addVoiceParticipant, removeParticipant: removeVoiceParticipant, participants: voiceParticipants, updateVoiceParticipant, isInVoice, currentRoomId: voiceRoomId } = useVoiceStore()
  const { setConnectionStatus } = useWebSocketStore()
  const currentRoomIdRef = useRef<number | null>(currentRoomId)

  useEffect(() => {
    currentRoomIdRef.current = currentRoomId
  }, [currentRoomId])

  const showNewMessageNotification = useCallback(
    (message: NewMessagePayload) => {
      if (String(message.senderUserId) === currentUser?.id) {
        return
      }

      if (message.roomId === currentRoomIdRef.current && document.hasFocus()) {
        return
      }

      const savedSettings = localStorage.getItem('notification-settings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          if (!settings.enableNotifications || !settings.enableDesktop) {
            return
          }
          if (settings.messageNotification === 'none') {
            return
          }
          if (settings.messageNotification === 'mentions') {
            const mentionPattern = new RegExp(`@${currentUser?.username}\\b`, 'i')
            if (!mentionPattern.test(message.content)) {
              return
            }
          }
        } catch (err: unknown) {
          console.error('Failed to parse notification settings:', err)
        }
      }

      if (window.electronAPI?.sendNotification) {
        const maxLength = 50
        const preview =
          message.content.length > maxLength
            ? message.content.substring(0, maxLength) + '...'
            : message.content

        window.electronAPI
          .sendNotification(message.senderName, preview, {
            roomId: message.roomId,
            senderId: message.senderUserId,
          })
          .catch((err: unknown) => {
            console.error('Failed to show notification:', err)
          })
      }
    },
    [currentUser]
  )

  const handleParticipantUpdate = useCallback(
    (data: ParticipantUpdatePayload) => {
      if (data.action === 'join') {
        addParticipant({
          id: String(data.participant.userId),
          name: data.participant.username,
          avatar: data.participant.avatarUrl,
          isMuted: data.participant.isMuted,
          isSpeaking: false,
          volume: 100,
          joinedAt: new Date(data.participant.joinedAt).getTime(),
        })
      } else if (data.action === 'leave') {
        removeParticipant(String(data.participant.userId))
      }
    },
    [addParticipant, removeParticipant]
  )

  const handleVoiceState = useCallback(
    (data: VoiceStatePayload) => {
      if (data.action === 'join') {
        addVoiceParticipant({
          id: Date.now(),
          roomId: data.roomId,
          userId: String(data.userId),
          username: data.username,
          joinedAt: new Date().toISOString(),
        })

        // If we are in voice chat and a new user joins, initiate WebRTC offer
        // to establish a peer connection for voice transmission.
        // Only initiate if the joining user is not us.
        if (isInVoice && voiceRoomId === data.roomId && String(data.userId) !== currentUser?.id) {
          // Defer to next tick to let voiceStore state settle
          setTimeout(() => {
            const state = useVoiceStore.getState()
            if (state.isInVoice && state.stream) {
              // The WebRTCManager is created lazily in voiceStore.startCapture.
              // We trigger the offer by calling startVoiceChat with just this user.
              // But we need access to the manager - use the voiceStore's handleVoiceSignal
              // approach. Instead, we send the offer via the manager.
              // The manager is private, so we use a trick: the voiceStore's getWebrtcManager
              // is not exposed. Instead, we handle this by having the newcomer's startCapture
              // fetch participants and create offers to all existing participants.
              // Existing participants will receive the offer and create answer.
              // So we don't need to do anything here for the existing user.
              // The newcomer's startCapture will create offers to us.
            }
          }, 0)
        }
      } else if (data.action === 'leave') {
        const participant = voiceParticipants.find(p => p.userId === String(data.userId))
        if (participant) {
          removeVoiceParticipant(participant)
        }
      } else if (data.action === 'mute' || data.action === 'unmute') {
        if (currentUser?.id !== String(data.userId)) {
          updateVoiceParticipant(String(data.userId), { isMuted: data.action === 'mute' })
        }
      } else if (data.action === 'speaking' || data.action === 'stopped_speaking') {
        updateVoiceParticipant(String(data.userId), { isSpeaking: data.action === 'speaking' })
      }
    },
    [addVoiceParticipant, removeVoiceParticipant, voiceParticipants, updateVoiceParticipant, currentUser, isInVoice, voiceRoomId]
  )

  const handleTyping = useCallback(
    (data: TypingPayload) => {
      if (String(data.userId) === currentUser?.id) {
        return
      }

      if (data.isTyping) {
        addTypingUser(data.roomId, {
          userId: String(data.userId),
          username: data.username,
          timestamp: Date.now(),
        })
      } else {
        removeTypingUser(data.roomId, String(data.userId))
      }
    },
    [addTypingUser, removeTypingUser, currentUser]
  )

  const handleScreenShare = useCallback(
    () => {
    },
    []
  )

  const handleStateSync = useCallback(
    (data: StateSyncPayload) => {
      data.participants.forEach((p) => {
        addParticipant({
          id: String(p.userId),
          name: p.username,
          avatar: p.avatarUrl,
          isMuted: p.isMuted,
          isSpeaking: false,
          volume: 100,
          joinedAt: new Date(p.joinedAt).getTime(),
        })
      })

      data.recentMessages.forEach((msg) => {
        const existingMessages = useChatStore.getState().messages
        if (!existingMessages.some(m => m.id === msg.id)) {
          addMessage(msg)
        }
      })
    },
    [addParticipant, addMessage]
  )

  useEffect(() => {
    if (!isAuthenticated || !currentUser || !currentServerId) {
      // Disconnect the shared connection when no longer authenticated or in a room
      wsConnection.disconnect()
      setConnectionStatus('disconnected', { status: 'disconnected' })
      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) return

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws'}?token=${token}&room_id=${currentServerId}`

    // Use the singleton connection - this shares the same WS across all hooks
    const ws = wsConnection.getWs(wsUrl)

    // Register message handlers on the shared connection
    // Each .on() returns an unsubscribe function
    const unsubs: Array<() => void> = []

    unsubs.push(ws.on('new_message', (data: unknown) => {
      const message = data as NewMessagePayload
      if (message.roomId === currentRoomIdRef.current) {
        addMessage(message)
      }
      showNewMessageNotification(message)
    }))

    unsubs.push(ws.on('participant_update', (data: unknown) => {
      handleParticipantUpdate(data as ParticipantUpdatePayload)
    }))

    unsubs.push(ws.on('voice_state', (data: unknown) => {
      handleVoiceState(data as VoiceStatePayload)
    }))

    unsubs.push(ws.on('typing', (data: unknown) => {
      handleTyping(data as TypingPayload)
    }))

    unsubs.push(ws.on('screen_share', () => {
      handleScreenShare()
    }))

    // Route WebRTC signals to voiceStore for voice chat P2P connections.
    // Screen share hooks also register their own webrtc_signal handlers
    // on the same shared WS - each WebRTCManager instance only processes
    // signals for peers it knows about, so there is no conflict.
    unsubs.push(ws.on('webrtc_signal', (data: unknown) => {
      const signal = data as { fromUserId: number; fromUsername: string; signal: WebRTCSignalRequest }
      // Route to voice store's WebRTC manager
      const voiceState = useVoiceStore.getState()
      if (voiceState.isInVoice) {
        voiceState.handleVoiceSignal(signal.fromUserId, signal.fromUsername, signal.signal)
      }
    }))

    unsubs.push(ws.on('state_sync', (data: unknown) => {
      handleStateSync(data as StateSyncPayload)
    }))

    // Set up connection state listener using polling since the singleton manages the ws
    const statusInterval = setInterval(() => {
      const status = ws.getConnectionStatus()
      setConnectionStatus(status, { status })

      if (status === 'connected' && currentRoomIdRef.current) {
        fetchParticipants(currentRoomIdRef.current)
      }
    }, 1000)

    return () => {
      clearInterval(statusInterval)
      unsubs.forEach(unsub => unsub())
      // Do NOT disconnect the shared connection here -
      // other hooks may still be using it. The connection is
      // disconnected when the room changes (different URL) or
      // when the user is no longer authenticated.
    }
  }, [
    isAuthenticated,
    currentUser,
    currentServerId,
    addMessage,
    showNewMessageNotification,
    handleParticipantUpdate,
    handleVoiceState,
    handleTyping,
    handleScreenShare,
    handleStateSync,
    setConnectionStatus,
    fetchParticipants,
    addParticipant,
    removeParticipant,
  ])

  const sendTyping = useCallback(
    (roomId: number, isTyping: boolean) => {
      const ws = wsConnection.getCurrentWs()
      ws?.sendTyping(roomId, isTyping)
    },
    []
  )

  return {
    sendTyping,
  }
}
