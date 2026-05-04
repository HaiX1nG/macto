import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useServerStore } from '../stores/serverStore'
import WebSocketService from '../services/websocketService'

export function useRoomWebSocket() {
  const { isAuthenticated, currentUser } = useAuthStore()
  const { currentServerId } = useServerStore()
  const wsRef = useRef<WebSocketService | null>(null)

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

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    }
  }, [isAuthenticated, currentUser, currentServerId])

  return wsRef.current
}