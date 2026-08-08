import apiClient from './apiClient'
import type {
  VoiceParticipant,
  SetMuteRequest,
  ScreenShareSession,
} from '@shared/types/voice'

export const voiceService = {
  async joinVoice(channelId: number): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/voice/join`)
  },

  async leaveVoice(channelId: number): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/voice/leave`)
  },

  async getVoiceParticipants(channelId: number): Promise<VoiceParticipant[]> {
    return apiClient.get<VoiceParticipant[]>(`/channels/${channelId}/voice/participants`)
  },

  async setMute(channelId: number, data: SetMuteRequest): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/voice/mute`, data)
  },

  async startScreenShare(channelId: number): Promise<ScreenShareSession> {
    return apiClient.post<ScreenShareSession>(`/channels/${channelId}/screenshare/start`)
  },

  async stopScreenShare(channelId: number): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/screenshare/stop`)
  },

  async getActiveScreenShare(channelId: number): Promise<ScreenShareSession | null> {
    return apiClient.get<ScreenShareSession | null>(`/channels/${channelId}/screenshare`)
  },
}

export default voiceService
