import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useServerStore } from '../stores/serverStore'
import { useChatStore } from '../stores/chatStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useWebSocketStore } from '../stores/websocketStore'
import WebSocketService from '../services/websocketService'
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
  const { addParticipant: addVoiceParticipant, removeParticipant: removeVoiceParticipant, participants: voiceParticipants, updateVoiceParticipant } = useVoiceStore()
  const { setConnectionStatus } = useWebSocketStore()
  const wsRef = useRef<WebSocketService | null>(null)
  const currentRoomIdRef = useRef<number | null>(currentRoomId)

  useEffect(() => {
    currentRoomIdRef.current = currentRoomId
  }, [currentRoomId])

  const showNewMessageNotification = useCallback(
    (message: NewMessagePayload) => {
      if (message.senderUserId === currentUser?.userId) {
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
          userId: data.userId,
          username: data.username,
          joinedAt: new Date().toISOString(),
        })
      } else if (data.action === 'leave') {
        const participant = voiceParticipants.find(p => p.userId === data.userId)
        if (participant) {
          removeVoiceParticipant(participant)
        }
      } else if (data.action === 'mute' || data.action === 'unmute') {
        if (currentUser?.userId !== data.userId) {
          updateVoiceParticipant(data.userId, { isMuted: data.action === 'mute' })
        }
      } else if (data.action === 'speaking' || data.action === 'stopped_speaking') {
        updateVoiceParticipant(data.userId, { isSpeaking: data.action === 'speaking' })
      }
    },
    [addVoiceParticipant, removeVoiceParticipant, voiceParticipants, updateVoiceParticipant, currentUser]
  )

  const handleTyping = useCallback(
    (data: TypingPayload) => {
      if (data.userId === currentUser?.userId) {
        return
      }

      if (data.isTyping) {
        addTypingUser(data.roomId, {
          userId: data.userId,
          username: data.username,
          timestamp: Date.now(),
        })
      } else {
        removeTypingUser(data.roomId, data.userId)
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
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
        setConnectionStatus('disconnected', { status: 'disconnected' })
      }
      return
    }

    if (wsRef.current?.isConnected()) {
      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) return

    const wsUrl = `ws://localhost:8080/ws?token=${token}&room_id=${currentServerId}`
    const ws = new WebSocketService({
      url: wsUrl,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      onConnectionStateChange: (status, payload) => {
        setConnectionStatus(status, payload)

        if (status === 'connected' && currentRoomIdRef.current) {
          fetchParticipants(currentRoomIdRef.current)
        }
      },
    })
    wsRef.current = ws

    ws.connect().catch((err) => {
      console.error('WebSocket connection failed:', err)
    })

    ws.on('new_message', (data: unknown) => {
      const message = data as NewMessagePayload
      if (message.roomId === currentRoomIdRef.current) {
        addMessage(message)
      }
      showNewMessageNotification(message)
    })

    ws.on('participant_update', (data: unknown) => {
      handleParticipantUpdate(data as ParticipantUpdatePayload)
    })

    ws.on('voice_state', (data: unknown) => {
      handleVoiceState(data as VoiceStatePayload)
    })

    ws.on('typing', (data: unknown) => {
      handleTyping(data as TypingPayload)
    })

    ws.on('screen_share', () => {
      handleScreenShare()
    })

    ws.on('state_sync', (data: unknown) => {
      handleStateSync(data as StateSyncPayload)
    })

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
        setConnectionStatus('disconnected', { status: 'disconnected' })
      }
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
      wsRef.current?.sendTyping(roomId, isTyping)
    },
    []
  )

  return {
    ws: wsRef.current,
    sendTyping,
  }
}