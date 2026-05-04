import { useEffect, useRef, useCallback } from 'react'
import type { WebSocketService } from '../services';
import { createWebSocketConnection } from '../services'
import { useAuthStore } from '../stores/authStore'

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: () => void
  autoConnect?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocketService | null>(null)
  const { isAuthenticated, getAccessToken } = useAuthStore()
  const { onMessage, autoConnect = true } = options

  const connect = useCallback(() => {
    if (wsRef.current?.isConnected()) return

    const token = getAccessToken()
    wsRef.current = createWebSocketConnection()

    wsRef.current.connect(token || undefined)
  }, [getAccessToken])

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect()
    wsRef.current = null
  }, [])

  const send = useCallback((data: unknown) => {
    wsRef.current?.send(data)
  }, [])

  const subscribe = useCallback((type: string, handler: (data: unknown) => void) => {
    if (!wsRef.current) return () => {}
    return wsRef.current.on(type, handler)
  }, [])

  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, isAuthenticated, connect, disconnect])

  useEffect(() => {
    if (!wsRef.current) return

    if (onMessage) {
      // Subscribe to all messages
      const unsubscribe = wsRef.current.on('*', onMessage)
      return unsubscribe
    }
  }, [onMessage])

  return {
    connect,
    disconnect,
    send,
    subscribe,
    isConnected: wsRef.current?.isConnected() ?? false,
  }
}

export default useWebSocket