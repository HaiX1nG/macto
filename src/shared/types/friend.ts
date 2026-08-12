/**
 * Friend Domain Types
 *
 * Mirrors backend friend_dto.go under @/api/v1/friends routes.
 * Field names follow the backend contract exactly (friendId, friendUsername, ...).
 */

/** 好友请求状态：0=待处理 1=已接受 2=已拒绝 */
export type FriendRequestStatus = 0 | 1 | 2

/** 好友项（GET /friends 列表元素） */
export interface FriendItem {
  id: number
  friendId: number
  friendUsername: string
  friendAvatarUrl: string
  isOnline: boolean
  customStatus: string
  createdAt: string
}

/** 好友请求（GET /friends/requests 列表元素） */
export interface FriendRequest {
  id: number
  senderId: number
  senderName: string
  receiverId: number
  receiverName: string
  /** 0=待处理 1=已接受 2=已拒绝 */
  status: FriendRequestStatus
  message: string
  createdAt: string
}

/** 私聊消息（GET /friends/:id/messages 列表元素） */
export interface PrivateMessage {
  id: number
  senderId: number
  senderName: string
  receiverId: number
  content: string
  isRead: boolean
  createdAt: string
}

/** 会话（GET /friends/conversations 列表元素） */
export interface Conversation {
  userId: number
  username: string
  avatarUrl: string
  isOnline: boolean
  customStatus: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

/** 用户搜索结果（GET /friends/search?username= 返回元素） */
export interface UserSearchResult {
  userId: number
  username: string
  avatarUrl: string
  isOnline: boolean
  customStatus: string
  isFriend: boolean
  hasPendingRequest: boolean
}

/** 搜索结果包装 */
export interface SearchResult {
  results: UserSearchResult[]
}

/** 发送好友请求载荷（POST /friends/request） */
export interface SendFriendRequestPayload {
  receiverId: number
  message?: string
}

/** 处理好友请求载荷（POST /friends/request/:id/handle） */
export interface HandleFriendRequestPayload {
  requestId: number
  accept: boolean
}

/** 发送私聊消息载荷（POST /friends/messages） */
export interface SendPrivateMessageRequest {
  receiverId: number
  content: string
  type?: string
}

export interface FriendsListResponse {
  friends: FriendItem[]
  total: number
}

export interface FriendRequestsResponse {
  requests: FriendRequest[]
  total: number
}

export interface PrivateMessagesResponse {
  messages: PrivateMessage[]
  total: number
}

export interface ConversationsResponse {
  conversations: Conversation[]
  total: number
}
