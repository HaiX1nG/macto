import apiClient from './apiClient'
import type { VoiceSessionResponse } from '@shared/types/api'

export const voiceService = {
  async joinVoice(roomId: number): Promise<VoiceSessionResponse> {
    return apiClient.post<VoiceSessionResponse>(`/rooms/${roomId}/voice/join`)
  },

  async leaveVoice(roomId: number): Promise<void> {
    return apiClient.post<void>(`/rooms/${roomId}/voice/leave`)
  },

  async getVoiceParticipants(roomId: number): Promise<VoiceSessionResponse[]> {
    return apiClient.get<VoiceSessionResponse[]>(`/rooms/${roomId}/voice/participants`)
  },

  async setMute(roomId: number, isMuted: boolean): Promise<void> {
    return apiClient.post<void>(`/rooms/${roomId}/voice/mute`, { isMuted })
  },
}

export default voiceService