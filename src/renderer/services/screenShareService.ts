import apiClient from './apiClient'
import type { ScreenShareResponse } from '@shared/types/api'

export const screenShareService = {
  async startScreenShare(roomId: number): Promise<ScreenShareResponse> {
    return apiClient.post<ScreenShareResponse>(`/rooms/${roomId}/screenshare/start`)
  },

  async stopScreenShare(roomId: number): Promise<void> {
    return apiClient.post<void>(`/rooms/${roomId}/screenshare/stop`)
  },

  async getActiveScreenShare(roomId: number): Promise<ScreenShareResponse | null> {
    return apiClient.get<ScreenShareResponse | null>(`/rooms/${roomId}/screenshare`)
  },
}

export default screenShareService