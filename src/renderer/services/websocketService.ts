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

        const url = token
          ? `${this.options.url}&token=${token}`
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

    if (data.type) {
      const handlers = this.handlers.get(data.type)
      if (handlers) {
        handlers.forEach((handler) => handler(data.payload))
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
      this.connect()
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

  sendTyping(roomId: number, isTyping: boolean): void {
    this.send({
      type: 'typing',
      payload: { roomId, isTyping },
    })
  }

  on(type: string, handler: WebSocketMessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  off(type: string, handler: WebSocketMessageHandler): void {
    this.handlers.get(type)?.delete(handler)
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
