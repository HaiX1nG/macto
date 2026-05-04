import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
import WebSocketService from '../services/websocketService'

interface StatusChangePayload {
  userId: number
  customStatus: string
}

interface WebSocketOptions {
  url: string
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

const WS_URL = 'ws://localhost:8080/ws'

export function useWebSocketStatus() {
  const { isAuthenticated, currentUser } = useAuthStore()
  const { setStatus } = useUserStore()
  const wsRef = useRef<WebSocketService | null>(null)

  const connect = useCallback(() => {
    if (!isAuthenticated || wsRef.current?.isConnected()) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Create WebSocket connection without room_id for global status sync
    const wsUrl = `${WS_URL}?token=${token}`
    const options: WebSocketOptions = {
      url: wsUrl,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
    }
    const ws = new WebSocketService(options)
    wsRef.current = ws

    ws.connect().then(() => {
      // WebSocket connected for status sync
    }).catch((err) => {
      console.error('WebSocket connection failed:', err)
    })

    // Listen for user status change events
    ws.on('user_status_change', (data: unknown) => {
      const payload = data as StatusChangePayload
      // Received status change

      // If this is about the current user, update local state
      if (currentUser && payload.userId === currentUser.userId) {
        // Map custom status to UI status
        const statusText = payload.customStatus || ''
        if (statusText === '') {
          setStatus('online')
        } else if (statusText === '空闲') {
          setStatus('idle')
        } else if (statusText === '请勿打扰') {
          setStatus('dnd')
        } else if (statusText === '隐身') {
          setStatus('offline')
        }
      }

      // Also update the auth store custom status
      useAuthStore.setState((state) => ({
        currentUser: state.currentUser?.userId === payload.userId
          ? { ...state.currentUser, customStatus: payload.customStatus }
          : state.currentUser
      }))
    })

    // Listen for user online/offline events
    ws.on('user_online', (_data: unknown) => {
      // User came online
    })

    ws.on('user_offline', (_data: unknown) => {
      // User went offline
    })
  }, [isAuthenticated, currentUser, setStatus])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, connect, disconnect])

  return {
    ws: wsRef.current,
    connect,
    disconnect
  }
}
