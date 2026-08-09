import type {
  WebSocketMessage,
  WebSocketMessageHandler,
  WebSocketEventHandler,
  WebSocketConnectionStatus,
  ConnectionStatePayload,
} from '../types/websocket'

interface WebSocketOptions {
  url: string
  onMessage?: WebSocketMessageHandler
  onOpen?: WebSocketEventHandler
  onClose?: WebSocketEventHandler
  onError?: WebSocketEventHandler
  onConnectionStateChange?: (status: WebSocketConnectionStatus, payload?: ConnectionStatePayload) => void
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

class WebSocketService {
  private ws: WebSocket | null = null
  private options: WebSocketOptions
  private reconnectAttempts = 0
  private messageQueue: unknown[] = []
  private handlers: Map<string, Set<WebSocketMessageHandler>> = new Map()
  private connectionStatus: WebSocketConnectionStatus = 'disconnected'
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null
  /**
   * Auth token carried in the connection URL query (`?token=...`).
   * Persisted across reconnects so a dropped connection re-authenticates.
   */
  private token: string | null = null
  /**
   * Optional external token source (e.g. a function reading localStorage).
   * When set, reconnect reads the freshest token from here instead of the
   * stale `this.token`, so a refreshed token is picked up automatically.
   */
  private tokenProvider: (() => string | null) | null = null

  constructor(options: WebSocketOptions) {
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options,
    }
  }

  private setConnectionStatus(status: WebSocketConnectionStatus, payload?: ConnectionStatePayload): void {
    this.connectionStatus = status
    this.options.onConnectionStateChange?.(status, payload)
  }

  getConnectionStatus(): WebSocketConnectionStatus {
    return this.connectionStatus
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.setConnectionStatus('connecting')

        // Persist token so reconnect can reuse it
        if (token !== undefined) {
          this.token = token
        }

        // KOOK-style: connection URL only carries token, no room_id
        // Prefer the freshest token from the provider (if any) over the
        // possibly-stale cached token.
        const effectiveToken = token ?? this.tokenProvider?.() ?? this.token
        const url = effectiveToken
          ? `${this.options.url}?token=${encodeURIComponent(effectiveToken)}`
          : this.options.url

        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          this.setConnectionStatus('connected', { status: 'connected' })
          this.flushMessageQueue()
          this.options.onOpen?.()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage
            this.handleMessage(data)
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        }

        this.ws.onclose = () => {
          this.setConnectionStatus('disconnected', { status: 'disconnected' })
          this.options.onClose?.()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.setConnectionStatus('error', { status: 'error' })
          this.options.onError?.()
          reject(error)
        }
      } catch (err) {
        this.setConnectionStatus('error', { status: 'error' })
        reject(err)
      }
    })
  }

  private handleMessage(data: WebSocketMessage): void {
    this.options.onMessage?.(data)

    if (data.event) {
      const handlers = this.handlers.get(data.event)
      if (handlers) {
        handlers.forEach((handler) => handler(data.data))
      }
    }
  }

  private attemptReconnect(): void {
    if (!this.options.reconnect) return
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts ?? 5)) {
      console.error('Max reconnect attempts reached')
      this.setConnectionStatus('error', {
        status: 'error',
        reconnectAttempt: this.reconnectAttempts,
        maxReconnectAttempts: this.options.maxReconnectAttempts,
      })
      return
    }

    this.reconnectAttempts++
    this.setConnectionStatus('reconnecting', {
      status: 'reconnecting',
      reconnectAttempt: this.reconnectAttempts,
      maxReconnectAttempts: this.options.maxReconnectAttempts,
    })

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect().catch(() => {
        // connect() failed — advance to next attempt via onclose
        // onclose already called attemptReconnect, but if connect() threw
        // synchronously, onclose won't fire. Retry after interval.
        this.reconnectTimeoutId = setTimeout(() => {
          this.attemptReconnect()
        }, this.options.reconnectInterval)
      })
    }, this.options.reconnectInterval)
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      this.messageQueue.push(data)
    }
  }

  /**
   * Send a channel-scoped chat message via WebSocket.
   */
  sendChatMessage(channelId: number, type: number, content: string, replyToId?: number): void {
    this.send({
      event: 'chat_message',
      data: { channelId, type, content, replyToId },
    })
  }

  /**
   * Subscribe to a channel's events.
   */
  joinChannel(channelId: number): void {
    this.send({
      event: 'join_channel',
      data: { channelId },
    })
  }

  /**
   * Unsubscribe from a channel's events.
   */
  leaveChannel(channelId: number): void {
    this.send({
      event: 'leave_channel',
      data: { channelId },
    })
  }

  /**
   * Send a typing indicator.
   */
  sendTyping(channelId: number, isTyping: boolean): void {
    this.send({
      event: 'typing',
      data: { channelId, isTyping },
    })
  }

  /**
   * Send a WebRTC signal to a target user.
   */
  sendWebRTCSignal(
    type: 'offer' | 'answer' | 'ice-candidate',
    targetId: number,
    payload: string
  ): void {
    this.send({
      event: 'webrtc_signal',
      data: { type, targetId, payload },
    })
  }

  on(event: string, handler: WebSocketMessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  off(event: string, handler: WebSocketMessageHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  /**
   * Set the auth token used for (re)connection. Also registers an optional
   * token provider so reconnects always read the freshest token.
   */
  setToken(token: string | null, tokenProvider?: () => string | null): void {
    this.token = token
    if (tokenProvider !== undefined) {
      this.tokenProvider = tokenProvider
    }
  }

  /**
   * Clear the cached auth token. Call on logout so a reconnect never
   * re-authenticates with a stale/expired token.
   */
  clearToken(): void {
    this.token = null
    this.tokenProvider = null
  }

  disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = null
    }
    if (this.ws) {
      this.options.reconnect = false
      this.ws.close()
      this.ws = null
    }
    this.token = null
    this.setConnectionStatus('disconnected', { status: 'disconnected' })
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export function createWebSocketConnection(baseUrl?: string): WebSocketService {
  const wsUrl = baseUrl || import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws'

  return new WebSocketService({
    url: wsUrl,
    reconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  })
}

export type { WebSocketService, WebSocketOptions }
export default WebSocketService
