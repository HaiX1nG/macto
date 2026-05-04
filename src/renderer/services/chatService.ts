import apiClient from './apiClient'
import type {
  SendMessageRequest,
  MessageResponse,
  MessageListRequest,
  PaginatedData,
} from '@shared/types/api'

export const chatService = {
  async getMessages(roomId: number, params?: MessageListRequest): Promise<MessageResponse[]> {
    try {
      const result = await apiClient.get<MessageResponse[] | PaginatedData<MessageResponse>>(`/rooms/${roomId}/messages`, params as Record<string, unknown>)
      // Handle both paginated and direct array responses
      if (Array.isArray(result)) {
        return result
      }
      if (result && 'list' in result) {
        return result.list || []
      }
      return []
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      return []
    }
  },

  async sendMessage(roomId: number, data: SendMessageRequest): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(`/rooms/${roomId}/messages`, data)
  },
}

export default chatService