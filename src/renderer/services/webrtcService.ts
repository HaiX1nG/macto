import type { WebRTCSignalRequest } from '@shared/types/voice'

/**
 * WebRTC signaling is now sent via WebSocket events (webrtc_signal),
 * not REST endpoints. This service provides a thin wrapper for
 * constructing signal payloads to send through wsConnection.
 */
export const webrtcService = {
  /**
   * Build a WebRTC signal payload for sending through the WebSocket.
   * The caller is responsible for dispatching via wsConnection.send().
   */
  buildSignal(
    type: WebRTCSignalRequest['type'],
    targetId: number,
    payload: string
  ): { event: 'webrtc_signal'; data: WebRTCSignalRequest & { targetId: number } } {
    return {
      event: 'webrtc_signal',
      data: {
        type,
        targetId,
        payload,
      },
    }
  },
}

export default webrtcService
