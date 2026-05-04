type WebSocketMessageHandler = (data: unknown) => void
type WebSocketEventHandler = () => void

interface WebSocketOptions {
  url: string
  onMessage?: WebSocketMessageHandler
  onOpen?: WebSocketEventHandler
  onClose?: WebSocketEventHandler
  onError?: WebSocketEventHandler
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

  constructor(options: WebSocketOptions) {
    this.options = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options,
    }
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = token
          ? `${this.options.url}?token=${token}`
          : this.options.url

        this.ws = new WebSocket(url)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          this.flushMessageQueue()
          this.options.onOpen?.()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err)
          }
        }

        this.ws.onclose = () => {
          this.options.onClose?.()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.options.onError?.()
          reject(error)
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  private handleMessage(data: { type?: string; payload?: unknown }) {
    // Call global message handler
    this.options.onMessage?.(data)

    // Call type-specific handlers
    if (data.type) {
      const handlers = this.handlers.get(data.type)
      if (handlers) {
        handlers.forEach((handler) => handler(data.payload))
      }
    }
  }

  private attemptReconnect() {
    if (!this.options.reconnect) return
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts ?? 5)) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++

    setTimeout(() => {
      this.connect()
    }, this.options.reconnectInterval)
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      // Queue message for later
      this.messageQueue.push(data)
    }
  }

  on(type: string, handler: WebSocketMessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  off(type: string, handler: WebSocketMessageHandler): void {
    this.handlers.get(type)?.delete(handler)
  }

  disconnect(): void {
    if (this.ws) {
      this.options.reconnect = false
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Factory function to create WebSocket connection
export function createWebSocketConnection(baseUrl?: string): WebSocketService {
  const wsUrl = baseUrl || import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

  return new WebSocketService({
    url: wsUrl,
    reconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  })
}

export type { WebSocketService, WebSocketOptions }
export default WebSocketService