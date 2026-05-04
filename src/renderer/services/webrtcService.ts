import apiClient from './apiClient'
import type { WebRTCSignalRequest, ScreenShareResponse } from '@shared/types/api'

export const webrtcService = {
  // Send WebRTC signal to backend (offer, answer, ice-candidate)
  async sendSignal(roomId: number, signal: WebRTCSignalRequest): Promise<void> {
    return apiClient.post<void>(`/rooms/${roomId}/webrtc/signal`, signal)
  },

  // Get screen share info
  async getActiveScreenShare(roomId: number): Promise<ScreenShareResponse | null> {
    return apiClient.get<ScreenShareResponse | null>(`/rooms/${roomId}/screenshare`)
  },
}

export default webrtcService