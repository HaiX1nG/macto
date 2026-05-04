import apiClient from './apiClient'
import type {
  SendMessageRequest,
  MessageResponse,
  MessageListRequest,
} from '@shared/types/api'

export const chatService = {
  async getMessages(roomId: number, params?: MessageListRequest): Promise<MessageResponse[]> {
    return apiClient.get<MessageResponse[]>(`/rooms/${roomId}/messages`, params)
  },

  async sendMessage(roomId: number, data: SendMessageRequest): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(`/rooms/${roomId}/messages`, data)
  },
}

export default chatService