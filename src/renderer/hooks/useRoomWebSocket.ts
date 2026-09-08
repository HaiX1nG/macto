import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useServerStore } from '../stores/serverStore'
import { useChatStore } from '../stores/chatStore'
import { useVoiceStore } from '../stores/voiceStore'
import { useMediaStore } from '../stores/mediaStore'
import { useUIStore } from '../stores/uiStore'
import { ConnectionState } from '@shared/types/voice'
import { useFriendStore } from '../stores/friendStore'
import { useNotificationStore } from '../stores/notificationStore'
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
  ParticipantUpdateEvent,
  ScreenShareStartEvent,
  ScreenShareStopEvent,
  WebRTCSignalEvent,
  MemberJoinedEvent,
  MemberLeftEvent,
  TypingPayload,
  MessageResponse,
  FriendOnlineEvent,
  FriendRequestPushEvent,
  FriendRequestHandledEvent,
  FriendRelationChangeEvent,
  PrivateMessagePushEvent,
} from '../types/websocket'
import type { VoiceParticipant } from '@shared/types/voice'
import type { ServerMember } from '@shared/types/server'
import type { ChannelMessage, MessageType } from '@shared/types/message'
import type { FriendRequest, PrivateMessage } from '@shared/types/friend'

function mapWebSocketMessage(message: MessageResponse): ChannelMessage {
  return {
    id: message.id,
    channelId: message.channelId,
    senderUserId: message.senderUserId,
    senderName: message.senderName,
    senderAvatarUrl: message.senderAvatar ?? '',
    type: message.type as MessageType,
    content: message.content,
    replyToId: message.replyToId ?? null,
    replyTo: null,
    editedAt: message.editedAt ?? null,
    isPinned: message.isPinned,
    reactions: (message.reactions ?? []).map((reaction) => ({
      emoji: reaction.emoji,
      count: reaction.count,
      users: reaction.userIds ?? [],
    })),
    attachments: (message.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      messageId: message.id,
      filename: attachment.filename,
      url: attachment.url,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      createdAt: '',
    })),
    createdAt: message.createdAt,
  }
}

function isMessageResponse(value: unknown): value is MessageResponse {
  if (typeof value !== 'object' || value === null) return false
  const message = value as Partial<MessageResponse>
  const hasReactions = Array.isArray(message.reactions) || message.reactions === null
  const hasAttachments = Array.isArray(message.attachments) || message.attachments === null
  return (
    typeof message.id === 'number' &&
    typeof message.channelId === 'number' &&
    typeof message.senderUserId === 'number' &&
    typeof message.senderName === 'string' &&
    (typeof message.senderAvatar === 'string' || message.senderAvatar === null) &&
    typeof message.type === 'number' &&
    typeof message.content === 'string' &&
    typeof message.isPinned === 'boolean' &&
    hasReactions &&
    hasAttachments &&
    typeof message.createdAt === 'string'
  )
}

function isCanonicalChatMessageEvent(value: unknown): value is ChatMessageEvent {
  if (typeof value !== 'object' || value === null) return false
  const event = value as Partial<ChatMessageEvent>
  return typeof event.channelId === 'number' && isMessageResponse(event.message)
}

/**
 * useRoomWebSocket
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
 *   participant_update -> voiceStore full participant list replacement
 *   screen_share_start -> mediaStore (UI notification)
 *   screen_share_stop  -> mediaStore (cleanup remote screen)
 *   webrtc_signal      -> mediaStore.handleVoiceSignal
 *   member_joined      -> serverStore member update
 *   member_left        -> serverStore member update
 */
export function useRoomWebSocket() {
  const { isAuthenticated, currentUser } = useAuthStore()
  const { fetchMembers } = useServerStore()
  const currentChannelId = useUIStore((s) => s.currentChannelId)
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus)

  const currentChannelIdRef = useRef<number | null>(currentChannelId)

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
    (data: unknown) => {
      if (!isCanonicalChatMessageEvent(data)) return
      const message = mapWebSocketMessage(data.message)
      useChatStore.getState().onMessageReceived(data.channelId, message)
      showNewMessageNotification(
        data.channelId,
        message.senderUserId,
        message.senderName,
        message.content
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
      // The backend broadcasts { channelId, user: { id, userId, username, ... } }.
      // Older deployments wrapped those fields in an additional `data` object or
      // sent them flat. Normalize all supported shapes before the store receives
      // the complete participant record.
      const payload = data.data ?? data
      const user = payload.user ?? data.user
      const channelId = payload.channelId ?? data.channelId ?? 0
      const userId = payload.userId ?? user?.userId ?? user?.id ?? 0
      const participant: VoiceParticipant = {
        id: user?.id ?? userId,
        channelId,
        userId,
        username: payload.username ?? user?.username ?? '',
        avatarUrl: payload.avatarUrl ?? user?.avatarUrl ?? '',
        isMuted: payload.isMuted ?? user?.isMuted ?? false,
        isDeafened: payload.isDeafened ?? user?.isDeafened ?? false,
        isSpeaking: payload.isSpeaking ?? user?.isSpeaking ?? false,
        volume: payload.volume ?? user?.volume ?? 100,
        joinedAt: payload.joinedAt ?? user?.joinedAt ?? '',
      }
      useVoiceStore.getState().onParticipantJoined(channelId, participant)
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
      if (data.isMuted !== undefined || data.isDeafened !== undefined || data.isSpeaking !== undefined || data.volume !== undefined) {
        // We need to update participants array directly
        const updatedParticipants = voiceState.participants.map((p) => {
          if (p.userId !== data.userId) return p
          return {
            ...p,
            isMuted: data.isMuted ?? p.isMuted,
            isDeafened: data.isDeafened ?? p.isDeafened,
            isSpeaking: data.isSpeaking ?? p.isSpeaking,
            volume: data.volume ?? p.volume,
          }
        })
        useVoiceStore.setState({ participants: updatedParticipants })
      }
    },
    []
  )

  const handleScreenShareStart = useCallback(
    (data: ScreenShareStartEvent) => {
      // If someone else started screen sharing, the webrtc_signal events will
      // set up the WebRTC connection. Log the event for UI awareness.
      if (data.userId !== currentUser?.id) {
        console.warn('[WS] Screen share started by user:', data.userId, data.username ?? '')
      }
    },
    [currentUser]
  )

  const handleParticipantUpdate = useCallback(
    (data: ParticipantUpdateEvent) => {
      // Backend sends a full participant list replacement for the channel.
      // Replace voiceStore.participants for matching channelId.
      const voiceState = useVoiceStore.getState()
      if (voiceState.currentVoiceChannelId !== data.channelId) return

      const updatedParticipants: VoiceParticipant[] = data.participants.map((p) => ({
        id: p.id,
        channelId: p.channelId,
        userId: p.userId,
        username: p.username,
        avatarUrl: p.avatarUrl ?? '',
        isMuted: p.isMuted ?? false,
        isDeafened: p.isDeafened ?? false,
        isSpeaking: p.isSpeaking ?? false,
        volume: p.volume ?? 100,
        joinedAt: p.joinedAt ?? '',
      }))
      useVoiceStore.setState({ participants: updatedParticipants })
    },
    []
  )

  const handleScreenShareStop = useCallback(
    (data: ScreenShareStopEvent) => {
      // Remove remote screen from mediaStore
      if (data.userId !== currentUser?.id) {
        useMediaStore.getState().removeRemoteScreen(data.userId)
        useMediaStore.getState().closeScreenConnection?.(data.userId)
      }
    },
    [currentUser]
  )

  const handleWebRTCSignal = useCallback((data: WebRTCSignalEvent) => {
    const mediaState = useMediaStore.getState()
    const mediaType = data.mediaType ?? data.signal.mediaType

    // New signals carry an explicit media type. This is the only reliable way
    // to route a first screen offer when the sender also has a voice peer.
    if (mediaType === 'screen') {
      void mediaState.handleScreenSignal(data.fromUserId, data.fromUsername, {
        type: data.signal.type,
        payload: data.signal.payload,
        mediaType: 'screen',
      })
      return
    }
    if (mediaType === 'voice') {
      void mediaState.handleVoiceSignal(data.fromUserId, data.fromUsername, {
        type: data.signal.type,
        payload: data.signal.payload,
        mediaType: 'voice',
      })
      return
    }

    // Legacy senders omitted mediaType. An offer has enough information in its
    // SDP to distinguish screen video from voice audio. For answer/ICE, use
    // existing screen ownership only; otherwise keep the conservative voice
    // fallback so an existing voice peer is never hijacked by screen routing.
    let isLegacyScreenOffer = false
    let isLegacyVoiceOffer = false
    let isLegacyOfferMediaUnknown = false
    if (data.signal.type === 'offer') {
      try {
        const offer = JSON.parse(data.signal.payload) as { sdp?: unknown }
        if (typeof offer.sdp === 'string') {
          isLegacyScreenOffer = /(?:^|\r?\n)m=video(?:\s|$)/.test(offer.sdp)
          isLegacyVoiceOffer = !isLegacyScreenOffer && /(?:^|\r?\n)m=audio(?:\s|$)/.test(offer.sdp)
          isLegacyOfferMediaUnknown = !isLegacyScreenOffer && !isLegacyVoiceOffer
        } else {
          isLegacyOfferMediaUnknown = true
        }
      } catch {
        isLegacyOfferMediaUnknown = true
      }
    }

    if (
      isLegacyScreenOffer ||
      (!isLegacyVoiceOffer && (data.signal.type !== 'offer' || isLegacyOfferMediaUnknown) && mediaState.screenManagerOwnsPeer(data.fromUserId))
    ) {
      void mediaState.handleScreenSignal(data.fromUserId, data.fromUsername, {
        type: data.signal.type,
        payload: data.signal.payload,
        mediaType: 'screen',
      })
      return
    }

    void mediaState.handleVoiceSignal(data.fromUserId, data.fromUsername, {
      type: data.signal.type,
      payload: data.signal.payload,
      mediaType: 'voice',
    })
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

  // ── Friend event handlers ────────────────────────────────

  const handleFriendOnline = useCallback(
    (data: FriendOnlineEvent) => {
      const friendState = useFriendStore.getState()
      if (data.isOnline) {
        friendState.onFriendOnline(data.userId)
      } else {
        friendState.onFriendOffline(data.userId)
      }
    },
    []
  )

  const handleFriendRequestPush = useCallback(
    (data: FriendRequestPushEvent) => {
      const friendState = useFriendStore.getState()
      const request: FriendRequest = {
        id: data.id,
        senderId: data.senderId,
        senderName: data.senderName,
        receiverId: useAuthStore.getState().currentUser?.id ?? 0,
        receiverName: '',
        status: 0,
        message: data.message,
        createdAt: data.createdAt,
      }
      friendState.onFriendRequestReceived(request)
      // Trigger notification aggregation so the new request appears immediately
      useNotificationStore.getState().loadNotifications()
    },
    []
  )

  const handleFriendRequestHandled = useCallback(
    (data: FriendRequestHandledEvent) => {
      const friendState = useFriendStore.getState()
      friendState.onFriendRequestHandled(data.requestId, data.accepted)
      // Refresh friends list if accepted
      if (data.accepted) {
        friendState.fetchFriends()
      }
    },
    []
  )

  const handleFriendRelationChange = useCallback(
    (data: FriendRelationChangeEvent) => {
      const friendState = useFriendStore.getState()
      if (data.change === 'deleted') {
        friendState.onFriendDeleted(data.friendId)
      } else if (data.change === 'added') {
        // New friend added via another device — refresh the list
        friendState.fetchFriends()
      }
    },
    []
  )

  const handlePrivateMessagePush = useCallback(
    (data: PrivateMessagePushEvent) => {
      const friendState = useFriendStore.getState()
      const currentUser = useAuthStore.getState().currentUser
      const message: PrivateMessage = {
        id: data.id,
        senderId: data.senderId,
        senderName: data.senderName,
        receiverId: data.receiverId,
        content: data.content,
        isRead: data.isRead,
        createdAt: data.createdAt,
      }
      // Determine the other user's ID
      const otherUserId =
        data.senderId === currentUser?.id ? data.receiverId : data.senderId

      // Append to messages if chat with this user is active
      if (friendState.activeChatUserId === otherUserId) {
        friendState.onPrivateMessageReceived(message)
        // Update conversation lastMessage
        const conversations = friendState.conversations.map((c) =>
          c.userId === otherUserId
            ? { ...c, lastMessage: data.content, lastMessageAt: data.createdAt }
            : c,
        )
        useFriendStore.setState({ conversations })
      } else {
        // Not the active chat — update conversation preview and increment unread
        const conversations = friendState.conversations.map((c) =>
          c.userId === otherUserId
            ? {
                ...c,
                lastMessage: data.content,
                lastMessageAt: data.createdAt,
                unreadCount: c.unreadCount + 1,
              }
            : c,
        )
        useFriendStore.setState({ conversations })
      }
    },
    []
  )

  // ── Main effect: connect WS and register event handlers ──

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      wsConnection.disconnect()
      setConnectionStatus(ConnectionState.Disconnected, { status: ConnectionState.Disconnected })
      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) {
      wsConnection.disconnect()
      setConnectionStatus(ConnectionState.Disconnected, { status: ConnectionState.Disconnected })
      return
    }

    // Connect via token-only (KOOK style, no room_id in URL). Record the
    // desired channel before connecting so a fresh singleton joins it on open.
    wsConnection.setDesiredChannel(currentChannelIdRef.current)
    const ws = wsConnection.connectWithToken(token)
    // Register a token provider so reconnects read the freshest token from
    // localStorage instead of a stale cached one.
    ws.setToken(token, () => localStorage.getItem('accessToken'))

    const unsubs: Array<() => void> = []

    // Chat events
    unsubs.push(
      ws.on('chat_message', (d: unknown) => {
        handleChatMessage(d)
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
    unsubs.push(
      ws.on('participant_update', (d: unknown) => {
        handleParticipantUpdate(d as ParticipantUpdateEvent)
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

    // Friend events
    unsubs.push(
      ws.on('friend_online', (d: unknown) => {
        handleFriendOnline(d as FriendOnlineEvent)
      })
    )
    unsubs.push(
      ws.on('friend_request_push', (d: unknown) => {
        handleFriendRequestPush(d as FriendRequestPushEvent)
      })
    )
    unsubs.push(
      ws.on('friend_request_handled', (d: unknown) => {
        handleFriendRequestHandled(d as FriendRequestHandledEvent)
      })
    )
    unsubs.push(
      ws.on('friend_relation_change', (d: unknown) => {
        handleFriendRelationChange(d as FriendRelationChangeEvent)
      })
    )
    unsubs.push(
      ws.on('private_message_push', (d: unknown) => {
        handlePrivateMessagePush(d as PrivateMessagePushEvent)
      })
    )

    // Connection status polling updates the store for UI display. The
    // singleton owns reconnect recovery and channel replay.
    const statusInterval = setInterval(() => {
      const status = ws.getConnectionStatus()
      // Map WebSocketConnectionStatus to ConnectionState
      const mapped = status === 'error' ? ConnectionState.Failed : status as ConnectionState
      setConnectionStatus(mapped, { status: mapped })
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
    setConnectionStatus,
    handleChatMessage,
    handleTyping,
    handleVoiceUserJoined,
    handleVoiceUserLeft,
    handleVoiceStateUpdate,
    handleParticipantUpdate,
    handleScreenShareStart,
    handleScreenShareStop,
    handleWebRTCSignal,
    handleMemberJoined,
    handleMemberLeft,
    handleFriendOnline,
    handleFriendRequestPush,
    handleFriendRequestHandled,
    handleFriendRelationChange,
    handlePrivateMessagePush,
  ])

  // ── Channel subscription effect ──────────────────────────
  // Record desired intent even when no connected socket exists. The singleton
  // sends the transition immediately when open and replays it on reconnect.
  useEffect(() => {
    if (!isAuthenticated) return
    wsConnection.setDesiredChannel(currentChannelId)
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
