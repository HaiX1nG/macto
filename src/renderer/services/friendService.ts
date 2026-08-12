import apiClient from './apiClient'
import type {
  FriendItem,
  FriendRequest,
  Conversation,
  PrivateMessage,
  SendFriendRequestPayload,
  SendPrivateMessageRequest,
  SearchResult,
  UserSearchResult,
  FriendsListResponse,
  FriendRequestsResponse,
  PrivateMessagesResponse,
  ConversationsResponse,
} from '@shared/types/friend'

/**
 * friendService - 好友域 API 对接（@/api/v1/friends 前缀）。
 *
 * 响应契约：列表接口返回 `{ docs: [...], total }` 或纯数组，这里统一兜底解包。
 */
export const friendService = {
  /** GET /friends 好友列表 */
  async getFriends(): Promise<FriendItem[]> {
    const res = await apiClient.get<FriendsListResponse | FriendItem[]>('/friends')
    return Array.isArray(res) ? res : (res.friends ?? [])
  },

  /** GET /friends/requests 好友请求列表 */
  async getFriendRequests(): Promise<FriendRequest[]> {
    const res = await apiClient.get<FriendRequestsResponse | FriendRequest[]>('/friends/requests')
    return Array.isArray(res) ? res : (res.requests ?? [])
  },

  /** POST /friends/request 发送好友请求 */
  async sendFriendRequest(data: SendFriendRequestPayload): Promise<void> {
    return apiClient.post<void>('/friends/request', data)
  },

  /** POST /friends/request/:id/handle 接受/拒绝好友请求 */
  async handleFriendRequest(id: number, accept: boolean): Promise<void> {
    return apiClient.post<void>(`/friends/request/${id}/handle`, { accept })
  },

  /** DELETE /friends/:id 删除好友 */
  async removeFriend(id: number): Promise<void> {
    return apiClient.delete<void>(`/friends/${id}`)
  },

  /** GET /friends/conversations 会话列表 */
  async getConversations(): Promise<Conversation[]> {
    const res = await apiClient.get<ConversationsResponse | Conversation[]>('/friends/conversations')
    return Array.isArray(res) ? res : (res.conversations ?? [])
  },

  /** GET /friends/:id/messages 与某好友的私聊消息（兼容 {messages,total} 与纯数组） */
  async getPrivateMessages(userId: number, page = 1, pageSize = 50): Promise<PrivateMessage[]> {
    const res = await apiClient.get<PrivateMessagesResponse | PrivateMessage[]>(
      `/friends/${userId}/messages`,
      { page, pageSize },
    )
    return Array.isArray(res) ? res : (res.messages ?? [])
  },

  /** POST /friends/messages 发送私聊消息 */
  async sendPrivateMessage(data: SendPrivateMessageRequest): Promise<PrivateMessage> {
    return apiClient.post<PrivateMessage>('/friends/messages', data)
  },

  /** GET /friends/search?username= 搜索用户 */
  async searchUsers(username: string): Promise<SearchResult> {
    const res = await apiClient.get<SearchResult | UserSearchResult[]>('/friends/search', {
      username,
    })
    if (Array.isArray(res)) {
      return { results: res }
    }
    return res
  },
}

export default friendService
