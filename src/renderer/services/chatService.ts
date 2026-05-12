import apiClient from './apiClient'
import type {
  SendMessageRequest,
  MessageResponse,
  MessageListRequest,
  PaginatedData,
  SearchMessagesRequest,
  SearchMessagesResponse,
} from '@shared/types/api'

export const chatService = {
  async getMessages(roomId: number, params?: MessageListRequest): Promise<MessageResponse[]> {
    try {
      const result = await apiClient.get<MessageResponse[] | PaginatedData<MessageResponse>>(`/rooms/${roomId}/messages`, params as unknown as Record<string, unknown>)
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

  async searchMessages(params: SearchMessagesRequest): Promise<SearchMessagesResponse> {
    try {
      const result = await apiClient.get<SearchMessagesResponse>('/messages/search', params as unknown as Record<string, unknown>)
      return result
    } catch (err) {
      console.error('Failed to search messages:', err)
      return { messages: [], total: 0 }
    }
  },
}

export default chatService