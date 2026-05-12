import { create } from 'zustand'
import { chatService } from '../services'
import type {
  MessageResponse,
  SendMessageRequest,
  MessageListRequest,
} from '@shared/types/api'

// Message send status
export type MessageSendStatus = 'pending' | 'sending' | 'sent' | 'failed'

// Extended message with send status for optimistic updates
export interface MessageWithStatus extends MessageResponse {
  _status?: MessageSendStatus
  _retryId?: string // For retry identification
}

// Typing user info
export interface TypingUser {
  userId: number
  username: string
  timestamp: number
}

interface ChatState {
  messages: MessageWithStatus[]
  pinnedMessages: MessageResponse[]
  isLoading: boolean
  hasMore: boolean
  error: string | null
  currentRoomId: number | null
  replyingTo: MessageResponse | null
  editingMessage: MessageResponse | null

  // Unread messages
  unreadCount: number
  firstUnreadMessageId: number | null
  isAtBottom: boolean

  // Typing indicators
  typingUsers: Map<number, TypingUser[]> // roomId -> typing users
  isTyping: boolean

  // Actions
  fetchMessages: (roomId: number, params?: MessageListRequest) => Promise<void>
  sendMessage: (roomId: number, data: SendMessageRequest) => Promise<void>
  addMessage: (message: MessageResponse) => void
  updateMessage: (messageId: number, content: string) => void
  deleteMessage: (messageId: number) => void
  pinMessage: (messageId: number) => void
  unpinMessage: (messageId: number) => void
  clearMessages: () => void
  setReplyingTo: (message: MessageResponse | null) => void
  setEditingMessage: (message: MessageResponse | null) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Unread actions
  setUnreadCount: (count: number) => void
  setFirstUnreadMessageId: (id: number | null) => void
  setIsAtBottom: (isAtBottom: boolean) => void
  incrementUnread: () => void
  clearUnread: () => void

  // Typing actions
  setTyping: (isTyping: boolean) => void
  addTypingUser: (roomId: number, user: TypingUser) => void
  removeTypingUser: (roomId: number, userId: number) => void
  clearTypingUsers: (roomId: number) => void

  // Retry failed message
  retryMessage: (retryId: string, roomId: number, data: SendMessageRequest) => Promise<void>
  removePendingMessage: (retryId: string) => void
}

// Generate unique retry ID
const generateRetryId = () => `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  pinnedMessages: [],
  isLoading: false,
  hasMore: true,
  error: null,
  currentRoomId: null,
  replyingTo: null,
  editingMessage: null,
  unreadCount: 0,
  firstUnreadMessageId: null,
  isAtBottom: true,
  typingUsers: new Map(),
  isTyping: false,

  fetchMessages: async (roomId, params) => {
    // Don't refetch if already loading the same room
    if (get().isLoading && get().currentRoomId === roomId) return

    set({ isLoading: true, error: null, currentRoomId: roomId })
    try {
      const messages = await chatService.getMessages(roomId, params)
      set((state) => ({
        messages: params?.page && params.page > 1
          ? [...messages, ...state.messages]
          : messages,
        hasMore: messages.length === (params?.pageSize ?? 50),
        isLoading: false,
      }))
    } catch (_err) {
      set({ isLoading: false, error: 'Failed to fetch messages' })
    }
  },

  sendMessage: async (roomId, data) => {
    const retryId = generateRetryId()

    // Optimistic update with pending status
    const optimisticMessage: MessageWithStatus = {
      id: -Date.now(), // Temporary negative ID
      roomId,
      senderUserId: 0, // Will be replaced by server
      senderName: '', // Will be replaced by server
      messageType: data.messageType,
      content: data.content,
      createdAt: new Date().toISOString(),
      _status: 'sending',
      _retryId: retryId,
    }

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
      error: null,
      replyingTo: null,
    }))

    try {
      const message = await chatService.sendMessage(roomId, data)
      // Replace optimistic message with real one
      set((state) => ({
        messages: state.messages.map(msg =>
          msg._retryId === retryId
            ? { ...message, _status: 'sent' as MessageSendStatus }
            : msg
        ),
        isLoading: false,
      }))

      // Clear sent status after animation
      setTimeout(() => {
        set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === message.id ? { ...msg, _status: undefined } : msg
          ),
        }))
      }, 1000)
    } catch (err: unknown) {
      // Mark message as failed
      set((state) => ({
        messages: state.messages.map(msg =>
          msg._retryId === retryId
            ? { ...msg, _status: 'failed' as MessageSendStatus }
            : msg
        ),
        isLoading: false,
        error: 'Failed to send message',
      }))
      const error = err instanceof Error ? err : new Error('Unknown error')
      throw error
    }
  },

  addMessage: (message) => {
    const state = get()
    set((state) => ({
      messages: [...state.messages, { ...message, _status: 'sent' as MessageSendStatus }],
    }))

    // Increment unread if not at bottom
    if (!state.isAtBottom && state.currentRoomId === message.roomId) {
      set((s) => ({
        unreadCount: s.unreadCount + 1,
        firstUnreadMessageId: s.firstUnreadMessageId || message.id,
      }))
    }

    // Clear sent status after animation
    setTimeout(() => {
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.id === message.id ? { ...msg, _status: undefined } : msg
        ),
      }))
    }, 1000)
  },

  updateMessage: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, content } : msg
      ),
      editingMessage: null,
    }))
  },

  deleteMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter(msg => msg.id !== messageId),
      pinnedMessages: state.pinnedMessages.filter(msg => msg.id !== messageId),
    }))
  },

  pinMessage: (messageId) => {
    set((state) => {
      const message = state.messages.find(msg => msg.id === messageId)
      if (!message) return state
      // Don't pin if already pinned
      if (state.pinnedMessages.some(msg => msg.id === messageId)) return state
      return {
        pinnedMessages: [...state.pinnedMessages, message],
      }
    })
  },

  unpinMessage: (messageId) => {
    set((state) => ({
      pinnedMessages: state.pinnedMessages.filter(msg => msg.id !== messageId),
    }))
  },

  clearMessages: () => set({ messages: [], pinnedMessages: [], hasMore: true, currentRoomId: null, unreadCount: 0, firstUnreadMessageId: null }),

  setReplyingTo: (message) => set({ replyingTo: message }),

  setEditingMessage: (message) => set({ editingMessage: message }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Unread actions
  setUnreadCount: (count) => set({ unreadCount: count }),
  setFirstUnreadMessageId: (id) => set({ firstUnreadMessageId: id }),
  setIsAtBottom: (isAtBottom) => set({ isAtBottom }),
  incrementUnread: () => set((state) => ({
    unreadCount: state.unreadCount + 1,
    firstUnreadMessageId: state.firstUnreadMessageId || -1,
  })),
  clearUnread: () => set({ unreadCount: 0, firstUnreadMessageId: null }),

  // Typing actions
  setTyping: (isTyping) => set({ isTyping }),

  addTypingUser: (roomId, user) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers)
      const roomTyping = newTypingUsers.get(roomId) || []
      // Remove existing entry for this user
      const filtered = roomTyping.filter(u => u.userId !== user.userId)
      newTypingUsers.set(roomId, [...filtered, user])
      return { typingUsers: newTypingUsers }
    })

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeTypingUser(roomId, user.userId)
    }, 5000)
  },

  removeTypingUser: (roomId, userId) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers)
      const roomTyping = newTypingUsers.get(roomId) || []
      newTypingUsers.set(roomId, roomTyping.filter(u => u.userId !== userId))
      return { typingUsers: newTypingUsers }
    })
  },

  clearTypingUsers: (roomId) => {
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers)
      newTypingUsers.delete(roomId)
      return { typingUsers: newTypingUsers }
    })
  },

  // Retry failed message
  retryMessage: async (retryId, roomId, data) => {
    // Update status to sending
    set((state) => ({
      messages: state.messages.map(msg =>
        msg._retryId === retryId
          ? { ...msg, _status: 'sending' as MessageSendStatus }
          : msg
      ),
    }))

    try {
      const message = await chatService.sendMessage(roomId, data)
      // Replace failed message with real one
      set((state) => ({
        messages: state.messages.map(msg =>
          msg._retryId === retryId
            ? { ...message, _status: 'sent' as MessageSendStatus }
            : msg
        ),
      }))

      // Clear sent status after animation
      setTimeout(() => {
        set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === message.id ? { ...msg, _status: undefined } : msg
          ),
        }))
      }, 1000)
    } catch (err: unknown) {
      // Keep failed status
      set((state) => ({
        messages: state.messages.map(msg =>
          msg._retryId === retryId
            ? { ...msg, _status: 'failed' as MessageSendStatus }
            : msg
        ),
        error: 'Failed to send message',
      }))
      const error = err instanceof Error ? err : new Error('Unknown error')
      throw error
    }
  },

  removePendingMessage: (retryId) => {
    set((state) => ({
      messages: state.messages.filter(msg => msg._retryId !== retryId),
    }))
  },
}))

export default useChatStore
