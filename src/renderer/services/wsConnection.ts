/**
 * Singleton WebSocket connection manager.
 *
 * Ensures a single WebSocket connection is shared across all hooks
 * (useRoomWebSocket, useScreenShare, useAudioShare, voice chat).
 * Only one connection per (token, roomId) — prevents the reconnect
 * storm caused by multiple hooks each creating their own WebSocket.
 */
import WebSocketService from './websocketService'

class WsConnectionManager {
  private ws: WebSocketService | null = null
  private currentUrl: string | null = null

  /**
   * Get the shared WebSocketService instance, connecting if needed.
   * If the URL differs from the current connection, the old one is
   * torn down and a new one is established.
   */
  getWs(url: string): WebSocketService {
    // Same URL — reuse existing connection
    if (this.ws && this.currentUrl === url && this.ws.isConnected()) {
      return this.ws
    }

    // Different URL or disconnected — tear down old and create new
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
   * Called when the user leaves the room entirely.
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
