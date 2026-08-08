/**
 * Friend Domain Types
 *
 * Mirrors backend friend_dto.go.
 * Friend domain is unchanged from the previous API; types extracted from old api.ts.
 */

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendRequest {
  id: number
  fromUserId: number
  toUserId: number
  fromUsername: string
  fromAvatarUrl: string
  toUsername: string
  toAvatarUrl: string
  status: FriendRequestStatus
  createdAt: string
}

export interface Friendship {
  id: number
  userId: number
  friendId: number
  friendUsername: string
  friendAvatarUrl: string
  friendOnlineStatus: boolean
  friendCustomStatus: string
  createdAt: string
}

export interface PrivateMessage {
  id: number
  fromUserId: number
  toUserId: number
  fromUsername: string
  fromAvatarUrl: string
  content: string
  type: number
  createdAt: string
}

export interface Conversation {
  userId: number
  username: string
  avatarUrl: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  isOnline: boolean
}

export interface SendFriendRequestPayload {
  toUserId: number
}

export interface HandleFriendRequestPayload {
  requestId: number
  action: 'accept' | 'reject'
}

export interface SendPrivateMessageRequest {
  toUserId: number
  content: string
  type?: number
}
