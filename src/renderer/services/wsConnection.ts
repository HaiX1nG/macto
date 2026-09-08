/**
 * Singleton WebSocket connection manager.
 *
 * KOOK-style: single per-app connection, not bound to room_id.
 * Token is the only connection parameter. Channel subscription
 * is managed via join_channel/leave_channel events.
 */
import WebSocketService from './websocketService'

class WsConnectionManager {
  private ws: WebSocketService | null = null
  private currentUrl: string | null = null

  /**
   * Get the shared WebSocketService instance, connecting if needed.
   * URL should include the token query parameter: `${wsBaseUrl}?token=${token}`
   */
  getWs(url: string): WebSocketService {
    // Same URL - reuse existing instance even if it's reconnecting/connecting,
    // so registered on() handlers and pending reconnects are preserved.
    if (this.ws && this.currentUrl === url) {
      return this.ws
    }

    // Different URL - tear down old and create new
    if (this.ws) {
      this.ws.disconnect()
      this.ws = null
      this.currentUrl = null
    }

    this.ws = new WebSocketService({
      url,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
    })
    this.currentUrl = url
    this.ws.connect().catch((err) => {
      console.error('[wsConnection] WebSocket connection failed:', err)
    })

    return this.ws
  }

  /**
   * Convenience method: connect using just a token.
   * Builds the URL from VITE_WS_URL + token query param.
   */
  connectWithToken(token: string): WebSocketService {
    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws'
    const url = this.buildUrl(wsBaseUrl, token)
    return this.getWs(url)
  }

  /**
   * Build a connection URL, encoding the token and preserving any existing
   * query string on the base URL.
   */
  private buildUrl(baseUrl: string, token: string): string {
    const url = new URL(baseUrl)
    url.searchParams.set('token', token)
    return url.toString()
  }

  /**
   * Get the current connected WebSocketService without initiating a connection.
   * Returns null if not connected.
   */
  getCurrentWs(): WebSocketService | null {
    if (this.ws && this.ws.isConnected()) {
      return this.ws
    }
    return null
  }

  /**
   * Disconnect and clear the shared connection.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.disconnect()
      this.ws = null
      this.currentUrl = null
    }
  }
}

// Export singleton
export const wsConnection = new WsConnectionManager()
export default wsConnection
