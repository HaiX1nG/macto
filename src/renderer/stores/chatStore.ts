import { create } from 'zustand'

export interface MessageWithStatus {
  id: number
  roomId: number
  senderUserId: number
  senderName: string
  content: string
  messageType: number
  createdAt: string
  updatedAt?: string
  status: 'sent' | 'sending' | 'failed'
  _retryId?: string
}

export interface PinnedMessage {
  id: number
  roomId: number
  senderUserId: number
  senderName: string
  content: string
  messageType: number
  createdAt: string
}

export interface ChatState {
  // State
  messages: MessageWithStatus[]
  pinnedMessages: PinnedMessage[]
  isLoading: boolean
  hasMore: boolean
  replyingTo: MessageWithStatus | null
  editingMessageId: number | null
  deletingMessageId: number | null
  typingUsers: Map<number, Array<{ userId: string; username: string; timestamp: number }>>
  currentRoomId: number | null

  // Actions
  fetchMessages: (channelId: number, params?: { page?: number; pageSize?: number }) => Promise<void>
  sendMessage: (channelId: number, data: { messageType: number; content: string }) => Promise<void>
  addMessage: (message: MessageWithStatus | unknown) => void
  clearMessages: () => void
  pinMessage: (messageId: number) => void
  unpinMessage: (messageId: number) => void
  retryMessage: (retryId: string, channelId: number, data: { messageType: number; content: string }) => Promise<void>
  editMessage: (channelId: number, messageId: number, content: string) => Promise<void>
  deleteMessageAsync: (channelId: number, messageId: number) => Promise<void>
  setReplyingTo: (message: MessageWithStatus | null) => void
  addTypingUser: (roomId: number, user: { userId: string; username: string; timestamp: number }) => void
  removeTypingUser: (roomId: number, userId: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  messages: [],
  pinnedMessages: [],
  isLoading: false,
  hasMore: false,
  replyingTo: null,
  editingMessageId: null,
  deletingMessageId: null,
  typingUsers: new Map(),
  currentRoomId: null,

  // Fetch messages
  fetchMessages: async (_channelId: number, _params?: { page?: number; pageSize?: number }) => {
    set({ isLoading: true })
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set({ isLoading: false, hasMore: false })
    } catch (_err) {
      set({ isLoading: false })
    }
  },

  // Send message
  sendMessage: async (_channelId: number, _data: { messageType: number; content: string }) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (_err) {
      console.error('Failed to send message:', _err)
      throw _err
    }
  },

  // Add message
  addMessage: (message: MessageWithStatus | unknown) => {
    set((state) => ({
      messages: [...state.messages, message as MessageWithStatus],
    }))
  },

  // Clear messages
  clearMessages: () => {
    set({ messages: [], hasMore: false })
  },

  // Pin message
  pinMessage: (messageId: number) => {
    set((state) => {
      const message = state.messages.find(m => m.id === messageId)
      if (!message) return state
      return {
        pinnedMessages: [...state.pinnedMessages, {
          id: message.id,
          roomId: message.roomId,
          senderUserId: message.senderUserId,
          senderName: message.senderName,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
        }],
      }
    })
  },

  // Unpin message
  unpinMessage: (messageId: number) => {
    set((state) => ({
      pinnedMessages: state.pinnedMessages.filter(m => m.id !== messageId),
    }))
  },

  // Retry message
  retryMessage: async (_retryId: string, _channelId: number, _data: { messageType: number; content: string }) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (_err) {
      console.error('Failed to retry message:', _err)
      throw _err
    }
  },

  // Edit message
  editMessage: async (_channelId: number, messageId: number, content: string) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set((state) => ({
        messages: state.messages.map(m =>
          m.id === messageId ? { ...m, content } : m
        ),
      }))
    } catch (_err) {
      console.error('Failed to edit message:', _err)
      throw _err
    }
  },

  // Delete message
  deleteMessageAsync: async (_channelId: number, messageId: number) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      set((state) => ({
        messages: state.messages.filter(m => m.id !== messageId),
      }))
    } catch (_err) {
      console.error('Failed to delete message:', _err)
      throw _err
    }
  },

  // Set replying to
  setReplyingTo: (message: MessageWithStatus | null) => {
    set({ replyingTo: message })
  },

  // Add typing user
  addTypingUser: (roomId: number, user: { userId: string; username: string; timestamp: number }) => {
    set((state) => {
      const newMap = new Map(state.typingUsers)
      const roomTyping = newMap.get(roomId) || []
      const filtered = roomTyping.filter(u => u.userId !== user.userId)
      filtered.push(user)
      newMap.set(roomId, filtered)
      return { typingUsers: newMap }
    })
  },

  // Remove typing user
  removeTypingUser: (roomId: number, userId: string) => {
    set((state) => {
      const newMap = new Map(state.typingUsers)
      const roomTyping = newMap.get(roomId) || []
      newMap.set(roomId, roomTyping.filter(u => u.userId !== userId))
      return { typingUsers: newMap }
    })
  },
}))

export type { ChatState as ContentDomainState }
