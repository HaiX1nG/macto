import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useServerStore } from '../stores/serverStore'
import { useChatStore } from '../stores/chatStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useMediaStore } from '../stores/mediaStore'
import { useUIStore } from '../stores/uiStore'
import { wsConnection } from '../services/wsConnection'
import type {
  ChatMessageEvent,
  MessageDeleteEvent,
  MessageUpdateEvent,
  ReactionAddEvent,
  ReactionRemoveEvent,
  VoiceUserJoinedEvent,
  VoiceUserLeftEvent,
  VoiceStateUpdateEvent,
  ScreenShareStartEvent,
  ScreenShareStopEvent,
  WebRTCSignalEvent,
  MemberJoinedEvent,
  MemberLeftEvent,
  TypingPayload,
} from '../types/websocket'
import type { VoiceParticipant } from '@shared/types/voice'
import type { ServerMember } from '@shared/types/server'

/**
 * useRoomWebSocket
 *
 * KOOK-style WebSocket event router. Connects via wsConnection.connectWithToken
 * (single per-app connection, not bound to room_id). Channel subscription is
 * managed via join_channel/leave_channel events when currentChannelId changes.
 *
 * Incoming WS events are dispatched to the appropriate store:
 *   chat_message       -> chatStore.onMessageReceived
 *   message_delete     -> chatStore.onMessageDeleted
 *   message_update     -> chatStore.onMessageUpdated
 *   reaction_add       -> chatStore.onReactionAdded
 *   reaction_remove    -> chatStore.onReactionRemoved
 *   typing             -> chatStore.setTyping
 *   voice_user_joined  -> voiceStore.onParticipantJoined
 *   voice_user_left    -> voiceStore.onParticipantLeft
 *   voice_state_update -> voiceStore participant update (mute/deafen/speaking)
 *   screen_share_start -> mediaStore (UI notification)
 *   screen_share_stop  -> mediaStore (cleanup remote screen)
 *   webrtc_signal      -> mediaStore.handleVoiceSignal
 *   member_joined      -> serverStore member update
 *   member_left        -> serverStore member update
 */
export function useRoomWebSocket() {
  const { isAuthenticated, currentUser } = useAuthStore()
  const { currentServerId, fetchMembers } = useServerStore()
  const currentChannelId = useUIStore((s) => s.currentChannelId)
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus)

  const currentChannelIdRef = useRef<number | null>(currentChannelId)
  const previousChannelIdRef = useRef<number | null>(null)

  useEffect(() => {
    currentChannelIdRef.current = currentChannelId
  }, [currentChannelId])

  // ── Notification helper ──────────────────────────────────

  const showNewMessageNotification = useCallback(
    (channelId: number, senderUserId: number, senderName: string, content: string) => {
      if (senderUserId === currentUser?.id) return
      if (channelId === currentChannelIdRef.current && document.hasFocus()) return

      const savedSettings = localStorage.getItem('notification-settings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          if (!settings.enableNotifications || !settings.enableDesktop) return
          if (settings.messageNotification === 'none') return
          if (settings.messageNotification === 'mentions') {
            const mentionPattern = new RegExp(`@${currentUser?.username}\\b`, 'i')
            if (!mentionPattern.test(content)) return
          }
        } catch (err: unknown) {
          console.error('Failed to parse notification settings:', err)
        }
      }

      if (window.electronAPI?.sendNotification) {
        const maxLength = 50
        const preview =
          content.length > maxLength ? content.substring(0, maxLength) + '...' : content

        window.electronAPI
          .sendNotification(senderName, preview, { channelId, senderId: senderUserId })
          .catch((err: unknown) => {
            console.error('Failed to show notification:', err)
          })
      }
    },
    [currentUser]
  )

  // ── Event handlers ───────────────────────────────────────

  const handleChatMessage = useCallback(
    (data: ChatMessageEvent) => {
      useChatStore.getState().onMessageReceived(data.channelId, data.message)
      showNewMessageNotification(
        data.channelId,
        data.message.senderUserId,
        data.message.senderName,
        data.message.content
      )
    },
    [showNewMessageNotification]
  )

  const handleTyping = useCallback(
    (data: TypingPayload) => {
      if (data.isTyping) {
        // We don't know the userId from the S->C event format in the new protocol,
        // but the backend includes it in the data. Access it generically.
        const extendedData = data as TypingPayload & { userId?: number }
        if (extendedData.userId !== undefined && extendedData.userId !== currentUser?.id) {
          useChatStore.getState().setTyping(data.channelId, extendedData.userId, true)
        }
      } else {
        const extendedData = data as TypingPayload & { userId?: number }
        if (extendedData.userId !== undefined) {
          useChatStore.getState().setTyping(data.channelId, extendedData.userId, false)
        }
      }
    },
    [currentUser]
  )

  const handleVoiceUserJoined = useCallback(
    (data: VoiceUserJoinedEvent) => {
      // Convert WS event user data to VoiceParticipant
      const participant: VoiceParticipant = {
        id: data.user.id,
        channelId: data.channelId,
        userId: data.user.userId,
        username: data.user.username,
        avatarUrl: data.user.avatarUrl,
        isMuted: data.user.isMuted,
        isDeafened: data.user.isDeafened,
        isSpeaking: data.user.isSpeaking,
        volume: data.user.volume,
        joinedAt: data.user.joinedAt,
      }
      useVoiceStore.getState().onParticipantJoined(data.channelId, participant)
    },
    []
  )

  const handleVoiceUserLeft = useCallback((data: VoiceUserLeftEvent) => {
    useVoiceStore.getState().onParticipantLeft(data.channelId, data.userId)
  }, [])

  const handleVoiceStateUpdate = useCallback(
    (data: VoiceStateUpdateEvent) => {
      const voiceState = useVoiceStore.getState()
      if (voiceState.currentVoiceChannelId !== data.channelId) return

      // Update the participant's state in the voice store
      if (data.isMuted !== undefined || data.isDeafened !== undefined || data.isSpeaking !== undefined) {
        // We need to update participants array directly
        const updatedParticipants = voiceState.participants.map((p) => {
          if (p.userId !== data.userId) return p
          return {
            ...p,
            isMuted: data.isMuted ?? p.isMuted,
            isDeafened: data.isDeafened ?? p.isDeafened,
            isSpeaking: data.isSpeaking ?? p.isSpeaking,
          }
        })
        useVoiceStore.setState({ participants: updatedParticipants })
      }
    },
    []
  )

  const handleScreenShareStart = useCallback(
    (data: ScreenShareStartEvent) => {
      // If someone else started screen sharing, we may need to set up a WebRTC connection
      // The mediaStore/WebRTCManager handles this via webrtc_signal events
      if (data.userId !== currentUser?.id) {
        console.warn('[WS] Screen share started by user:', data.userId)
      }
    },
    [currentUser]
  )

  const handleScreenShareStop = useCallback(
    (data: ScreenShareStopEvent) => {
      // Remove remote screen from mediaStore
      if (data.userId !== currentUser?.id) {
        useMediaStore.getState().removeRemoteScreen(data.userId)
      }
    },
    [currentUser]
  )

  const handleWebRTCSignal = useCallback((data: WebRTCSignalEvent) => {
    // Route to mediaStore's WebRTC manager for voice chat
    const mediaState = useMediaStore.getState()
    const voiceState = useVoiceStore.getState()
    if (voiceState.isInVoice) {
      mediaState.handleVoiceSignal(data.fromUserId, data.fromUsername, {
        type: data.signal.type,
        payload: data.signal.payload,
      })
    }
  }, [])

  const handleMemberJoined = useCallback(
    (data: MemberJoinedEvent) => {
      // Refresh members for the server if it's the current server
      const { currentServerId } = useServerStore.getState()
      if (currentServerId === data.serverId) {
        fetchMembers(data.serverId)
      }
    },
    [fetchMembers]
  )

  const handleMemberLeft = useCallback(
    (data: MemberLeftEvent) => {
      const { currentServerId, members } = useServerStore.getState()
      if (currentServerId === data.serverId) {
        // Remove member from local state
        const updatedMembers = members.filter((m: ServerMember) => m.userId !== data.userId)
        useServerStore.setState({ members: updatedMembers })
      }
    },
    []
  )

  // ── Main effect: connect WS and register event handlers ──

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      wsConnection.disconnect()
      setConnectionStatus('disconnected', { status: 'disconnected' })
      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Connect via token-only (KOOK style, no room_id in URL)
    const ws = wsConnection.connectWithToken(token)
    // Register a token provider so reconnects read the freshest token from
    // localStorage instead of a stale cached one.
    ws.setToken(token, () => localStorage.getItem('accessToken'))

    const unsubs: Array<() => void> = []

    // Chat events
    unsubs.push(
      ws.on('chat_message', (d: unknown) => {
        handleChatMessage(d as ChatMessageEvent)
      })
    )
    unsubs.push(
      ws.on('message_delete', (d: unknown) => {
        const data = d as MessageDeleteEvent
        useChatStore.getState().onMessageDeleted(data.channelId, data.messageId)
      })
    )
    unsubs.push(
      ws.on('message_update', (d: unknown) => {
        const data = d as MessageUpdateEvent
        useChatStore.getState().onMessageUpdated(data.channelId, data.message)
      })
    )
    unsubs.push(
      ws.on('reaction_add', (d: unknown) => {
        const data = d as ReactionAddEvent
        // Find channelId from messages map - reaction events may not include channelId
        // The backend should include channelId; if not, we search all channels
        const messages = useChatStore.getState().messages
        let channelId = 0
        for (const [chId, msgs] of messages) {
          if (msgs.some((m) => m.id === data.messageId)) {
            channelId = chId
            break
          }
        }
        if (channelId) {
          useChatStore.getState().onReactionAdded(channelId, data.messageId, data.emoji, data.userId)
        }
      })
    )
    unsubs.push(
      ws.on('reaction_remove', (d: unknown) => {
        const data = d as ReactionRemoveEvent
        const messages = useChatStore.getState().messages
        let channelId = 0
        for (const [chId, msgs] of messages) {
          if (msgs.some((m) => m.id === data.messageId)) {
            channelId = chId
            break
          }
        }
        if (channelId) {
          useChatStore.getState().onReactionRemoved(channelId, data.messageId, data.emoji, data.userId)
        }
      })
    )

    // Typing
    unsubs.push(
      ws.on('typing', (d: unknown) => {
        handleTyping(d as TypingPayload)
      })
    )

    // Voice events
    unsubs.push(
      ws.on('voice_user_joined', (d: unknown) => {
        handleVoiceUserJoined(d as VoiceUserJoinedEvent)
      })
    )
    unsubs.push(
      ws.on('voice_user_left', (d: unknown) => {
        handleVoiceUserLeft(d as VoiceUserLeftEvent)
      })
    )
    unsubs.push(
      ws.on('voice_state_update', (d: unknown) => {
        handleVoiceStateUpdate(d as VoiceStateUpdateEvent)
      })
    )

    // Screen share events
    unsubs.push(
      ws.on('screen_share_start', (d: unknown) => {
        handleScreenShareStart(d as ScreenShareStartEvent)
      })
    )
    unsubs.push(
      ws.on('screen_share_stop', (d: unknown) => {
        handleScreenShareStop(d as ScreenShareStopEvent)
      })
    )

    // WebRTC signal routing
    unsubs.push(
      ws.on('webrtc_signal', (d: unknown) => {
        handleWebRTCSignal(d as WebRTCSignalEvent)
      })
    )

    // Member events
    unsubs.push(
      ws.on('member_joined', (d: unknown) => {
        handleMemberJoined(d as MemberJoinedEvent)
      })
    )
    unsubs.push(
      ws.on('member_left', (d: unknown) => {
        handleMemberLeft(d as MemberLeftEvent)
      })
    )

    // Connection status polling (the singleton manages its own reconnect,
    // but we poll to update the store for UI display)
    const statusInterval = setInterval(() => {
      const status = ws.getConnectionStatus()
      setConnectionStatus(status, { status })

      if (status === 'connected' && currentChannelIdRef.current && previousChannelIdRef.current !== currentChannelIdRef.current) {
        // Channel changed - subscribe to new channel, unsubscribe from old
        if (previousChannelIdRef.current) {
          ws.leaveChannel(previousChannelIdRef.current)
        }
        ws.joinChannel(currentChannelIdRef.current)
        previousChannelIdRef.current = currentChannelIdRef.current
      }
    }, 1000)

    return () => {
      clearInterval(statusInterval)
      unsubs.forEach((unsub) => unsub())
      // Do NOT disconnect the shared connection here -
      // other hooks may still be using it.
    }
  }, [
    isAuthenticated,
    currentUser,
    currentServerId,
    setConnectionStatus,
    handleChatMessage,
    handleTyping,
    handleVoiceUserJoined,
    handleVoiceUserLeft,
    handleVoiceStateUpdate,
    handleScreenShareStart,
    handleScreenShareStop,
    handleWebRTCSignal,
    handleMemberJoined,
    handleMemberLeft,
  ])

  // ── Channel subscription effect ──────────────────────────
  // When currentChannelId changes, send join_channel/leave_channel
  useEffect(() => {
    if (!isAuthenticated) return

    const ws = wsConnection.getCurrentWs()
    if (!ws) return

    const prevId = previousChannelIdRef.current
    const newId = currentChannelId

    // Leave previous channel
    if (prevId !== null && prevId !== newId) {
      ws.leaveChannel(prevId)
    }

    // Join new channel
    if (newId !== null && prevId !== newId) {
      ws.joinChannel(newId)
    }

    previousChannelIdRef.current = newId
  }, [currentChannelId, isAuthenticated])

  // ── Typing sender ────────────────────────────────────────

  const sendTyping = useCallback(
    (channelId: number, isTyping: boolean) => {
      const ws = wsConnection.getCurrentWs()
      ws?.sendTyping(channelId, isTyping)
    },
    []
  )

  return {
    sendTyping,
  }
}
