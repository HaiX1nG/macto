import apiClient from './apiClient'
import type {
  ChannelMessage,
  SendMessageRequest,
  UpdateMessageRequest,
  ReactionRequest,
  MessageListParams,
} from '@shared/types/message'
import type { PaginatedData } from '@shared/types/common'

export const messageService = {
  async getMessages(
    channelId: number,
    params?: MessageListParams
  ): Promise<{ list: ChannelMessage[]; total: number }> {
    const result = await apiClient.get<ChannelMessage[] | PaginatedData<ChannelMessage>>(
      `/channels/${channelId}/messages`,
      params as Record<string, unknown> | undefined
    )
    if (Array.isArray(result)) {
      return { list: result, total: result.length }
    }
    // Backend may return `list: null` for empty channels; normalize to `[]`
    return { list: result.list ?? [], total: result.total }
  },

  async sendMessage(
    channelId: number,
    data: SendMessageRequest
  ): Promise<ChannelMessage> {
    return apiClient.post<ChannelMessage>(`/channels/${channelId}/messages`, data)
  },

  async updateMessage(
    channelId: number,
    messageId: number,
    data: UpdateMessageRequest
  ): Promise<ChannelMessage> {
    return apiClient.put<ChannelMessage>(
      `/channels/${channelId}/messages/${messageId}`,
      data
    )
  },

  async deleteMessage(channelId: number, messageId: number): Promise<void> {
    return apiClient.delete<void>(`/channels/${channelId}/messages/${messageId}`)
  },

  async pinMessage(channelId: number, messageId: number): Promise<void> {
    return apiClient.post<void>(`/channels/${channelId}/messages/${messageId}/pin`)
  },

  async addReaction(
    channelId: number,
    messageId: number,
    data: ReactionRequest
  ): Promise<void> {
    return apiClient.post<void>(
      `/channels/${channelId}/messages/${messageId}/reactions`,
      data
    )
  },

  async removeReaction(
    channelId: number,
    messageId: number,
    emoji: string
  ): Promise<void> {
    return apiClient.delete<void>(
      `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
    )
  },

  async searchMessages(
    query: string,
    channelId?: number
  ): Promise<ChannelMessage[]> {
    const params: Record<string, unknown> = { query }
    if (channelId !== undefined) {
      params.channelId = channelId
    }
    return apiClient.get<ChannelMessage[]>('/messages/search', params)
  },
}

export default messageService
