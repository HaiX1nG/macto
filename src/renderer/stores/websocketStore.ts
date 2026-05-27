import { create } from 'zustand'
import type { WebSocketConnectionStatus, ConnectionStatePayload } from '../types/websocket'

interface WebSocketState {
  connectionStatus: WebSocketConnectionStatus
  reconnectAttempt: number
  maxReconnectAttempts: number
  lastConnectedAt: number | null
  lastDisconnectedAt: number | null

  setConnectionStatus: (status: WebSocketConnectionStatus, payload?: ConnectionStatePayload) => void
  reset: () => void
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  connectionStatus: 'disconnected',
  reconnectAttempt: 0,
  maxReconnectAttempts: 10,
  lastConnectedAt: null,
  lastDisconnectedAt: null,

  setConnectionStatus: (status, payload) => {
    const now = Date.now()
    set((state) => ({
      connectionStatus: status,
      reconnectAttempt: payload?.reconnectAttempt ?? (status === 'reconnecting' ? state.reconnectAttempt + 1 : 0),
      maxReconnectAttempts: payload?.maxReconnectAttempts ?? state.maxReconnectAttempts,
      lastConnectedAt: status === 'connected' ? now : state.lastConnectedAt,
      lastDisconnectedAt: status === 'disconnected' || status === 'error' ? now : state.lastDisconnectedAt,
    }))
  },

  reset: () => set({
    connectionStatus: 'disconnected',
    reconnectAttempt: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
  }),
}))

export default useWebSocketStore