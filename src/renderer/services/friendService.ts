import apiClient from './apiClient'
import type {
  FriendRequest,
  Friendship,
  Conversation,
  PrivateMessage,
  SendFriendRequestPayload,
  HandleFriendRequestPayload,
  SendPrivateMessageRequest,
} from '@shared/types/friend'

export const friendService = {
  async getFriends(): Promise<Friendship[]> {
    return apiClient.get<Friendship[]>('/friends')
  },

  async getFriendRequests(): Promise<FriendRequest[]> {
    return apiClient.get<FriendRequest[]>('/friends/requests')
  },

  async sendFriendRequest(data: SendFriendRequestPayload): Promise<void> {
    return apiClient.post<void>('/friends/requests', data)
  },

  async handleFriendRequest(data: HandleFriendRequestPayload): Promise<void> {
    return apiClient.put<void>(`/friends/requests/${data.requestId}`, {
      action: data.action,
    })
  },

  async removeFriend(friendId: number): Promise<void> {
    return apiClient.delete<void>(`/friends/${friendId}`)
  },

  async getConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>('/friends/conversations')
  },

  async getPrivateMessages(userId: number, page?: number): Promise<PrivateMessage[]> {
    const params: Record<string, unknown> = {}
    if (page !== undefined) {
      params.page = page
    }
    return apiClient.get<PrivateMessage[]>(`/friends/${userId}/messages`, params)
  },

  async sendPrivateMessage(data: SendPrivateMessageRequest): Promise<PrivateMessage> {
    return apiClient.post<PrivateMessage>(`/friends/${data.toUserId}/messages`, {
      content: data.content,
      type: data.type,
    })
  },
}

export default friendService
