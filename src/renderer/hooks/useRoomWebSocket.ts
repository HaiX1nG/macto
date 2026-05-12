import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useServerStore } from '../stores/serverStore'
import { useChatStore } from '../stores/chatStore'
import WebSocketService from '../services/websocketService'
import type { MessageType } from '@shared/types/api'

interface NewMessagePayload {
  id: number
  roomId: number
  senderUserId: number
  senderName: string
  messageType: MessageType
  content: string
  createdAt: string
}

export function useRoomWebSocket() {
  const { isAuthenticated, currentUser } = useAuthStore()
  const { currentServerId } = useServerStore()
  const { currentRoomId, addMessage } = useChatStore()
  const wsRef = useRef<WebSocketService | null>(null)

  /**
   * Show desktop notification for new message
   */
  const showNewMessageNotification = useCallback(
    (message: NewMessagePayload) => {
      // Don't notify for own messages
      if (message.senderUserId === currentUser?.userId) {
        return
      }

      // Don't notify if the message is for the current room and window is focused
      if (message.roomId === currentRoomId && document.hasFocus()) {
        return
      }

      // Get notification settings
      const savedSettings = localStorage.getItem('notification-settings')
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          // Check if notifications are enabled
          if (!settings.enableNotifications || !settings.enableDesktop) {
            return
          }
          // Check message notification setting
          if (settings.messageNotification === 'none') {
            return
          }
          // Check if only mentions are enabled
          if (settings.messageNotification === 'mentions') {
            // Check if current user is mentioned
            const mentionPattern = new RegExp(`@${currentUser?.username}\\b`, 'i')
            if (!mentionPattern.test(message.content)) {
              return
            }
          }
        } catch {
          // Use default behavior if settings parse fails
        }
      }

      // Use Electron notification API
      if (window.electronAPI?.sendNotification) {
        // Truncate message content for preview
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
    [currentUser, currentRoomId]
  )

  useEffect(() => {
    // Only connect when user is authenticated and has selected a server/room
    if (!isAuthenticated || !currentUser || !currentServerId) {
      // Disconnect if no server selected
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
      return
    }

    // Already connected to this room
    if (wsRef.current?.isConnected()) {
      return
    }

    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Connect to WebSocket with room_id to set user online status
    const wsUrl = `ws://localhost:8080/ws?token=${token}&room_id=${currentServerId}`
    const ws = new WebSocketService({
      url: wsUrl,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
    })
    wsRef.current = ws

    ws.connect().then(() => {
      // WebSocket connected, user is now marked as online in this room
    }).catch((err) => {
      console.error('WebSocket connection failed:', err)
    })

    // Listen for participant updates
    ws.on('participant_update', (_data: unknown) => {
      // Could trigger member list refresh here
    })

    // Listen for new messages
    ws.on('new_message', (data: unknown) => {
      const message = data as NewMessagePayload
      // Add message to store if it's for the current room
      if (message.roomId === currentRoomId) {
        addMessage(message)
      }
      // Show notification for the new message
      showNewMessageNotification(message)
    })

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    }
  }, [isAuthenticated, currentUser, currentServerId, currentRoomId, addMessage, showNewMessageNotification])

  return wsRef.current
}