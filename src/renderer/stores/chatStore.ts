import { create } from 'zustand'
import type { MessageResponse, SendMessageRequest, MessageListRequest, MessageType } from '@shared/types/api'
import { chatService } from '../services/chatService'

export type MessageSendStatus = 'sent' | 'sending' | 'failed'

export interface MessageWithStatus {
  id: number
  roomId: number
  senderUserId: number
  senderName: string
  content: string
  messageType: MessageType
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
  messageType: MessageType
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
  sendMessage: (channelId: number, data: { messageType: MessageType; content: string }) => Promise<void>
  addMessage: (message: MessageWithStatus | unknown) => void
  clearMessages: () => void
  pinMessage: (messageId: number) => void
  unpinMessage: (messageId: number) => void
  retryMessage: (retryId: string, channelId: number, data: { messageType: MessageType; content: string }) => Promise<void>
  editMessage: (channelId: number, messageId: number, content: string) => Promise<void>
  deleteMessageAsync: (channelId: number, messageId: number) => Promise<void>
  setReplyingTo: (message: MessageWithStatus | null) => void
  addTypingUser: (roomId: number, user: { userId: string; username: string; timestamp: number }) => void
  removeTypingUser: (roomId: number, userId: string) => void
}

// Helper to map API MessageResponse to store MessageWithStatus
function mapToMessageWithStatus(msg: MessageResponse, status: MessageSendStatus = 'sent'): MessageWithStatus {
  return {
    id: msg.id,
    roomId: msg.roomId,
    senderUserId: msg.senderUserId,
    senderName: msg.senderName,
    content: msg.content,
    messageType: msg.messageType,
    createdAt: msg.createdAt,
    status,
  }
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
  fetchMessages: async (channelId: number, params?: { page?: number; pageSize?: number }) => {
    set({ isLoading: true })
    try {
      const messageList = await chatService.getMessages(channelId, params as MessageListRequest | undefined)
      const messages = messageList.map(msg => mapToMessageWithStatus(msg, 'sent'))
      set({
        messages,
        currentRoomId: channelId,
        isLoading: false,
        hasMore: messageList.length >= (params?.pageSize ?? 50),
      })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  // Send message (optimistic update pattern)
  sendMessage: async (channelId: number, data: { messageType: MessageType; content: string }) => {
    const tempId = Date.now()
    const retryId = `retry-${tempId}`

    // Optimistically add message with 'sending' status
    const optimisticMessage: MessageWithStatus = {
      id: tempId,
      roomId: channelId,
      senderUserId: 0, // Will be updated from response
      senderName: '',  // Will be updated from response
      content: data.content,
      messageType: data.messageType,
      createdAt: new Date().toISOString(),
      status: 'sending',
      _retryId: retryId,
    }
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
      currentRoomId: channelId,
    }))

    try {
      const requestData: SendMessageRequest = {
        messageType: data.messageType,
        content: data.content,
      }
      const response = await chatService.sendMessage(channelId, requestData)

      // Replace optimistic message with real one
      set((state) => ({
        messages: state.messages.map(m =>
          m.id === tempId ? mapToMessageWithStatus(response, 'sent') : m
        ),
      }))
    } catch (err) {
      // Mark message as failed
      set((state) => ({
        messages: state.messages.map(m =>
          m.id === tempId ? { ...m, status: 'failed' as const } : m
        ),
      }))
      throw err
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

  // Retry message - re-send the failed message
  retryMessage: async (retryId: string, channelId: number, data: { messageType: MessageType; content: string }) => {
    // Remove the failed message with this retryId
    set((state) => ({
      messages: state.messages.filter(m => m._retryId !== retryId),
    }))

    // Re-send via the service directly
    const tempId = Date.now()
    const newRetryId = `retry-${tempId}`

    const optimisticMessage: MessageWithStatus = {
      id: tempId,
      roomId: channelId,
      senderUserId: 0,
      senderName: '',
      content: data.content,
      messageType: data.messageType,
      createdAt: new Date().toISOString(),
      status: 'sending',
      _retryId: newRetryId,
    }
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }))

    try {
      const requestData: SendMessageRequest = {
        messageType: data.messageType,
        content: data.content,
      }
      const response = await chatService.sendMessage(channelId, requestData)
      set((state) => ({
        messages: state.messages.map(m =>
          m.id === tempId ? mapToMessageWithStatus(response, 'sent') : m
        ),
      }))
    } catch (err) {
      set((state) => ({
        messages: state.messages.map(m =>
          m.id === tempId ? { ...m, status: 'failed' as const } : m
        ),
      }))
      throw err
    }
  },

  // Edit message
  editMessage: async (channelId: number, messageId: number, content: string) => {
    const response = await chatService.updateMessage(channelId, messageId, content)
    set((state) => ({
      messages: state.messages.map(m =>
        m.id === messageId ? mapToMessageWithStatus(response, 'sent') : m
      ),
    }))
  },

  // Delete message
  deleteMessageAsync: async (channelId: number, messageId: number) => {
    await chatService.deleteMessage(channelId, messageId)
    set((state) => ({
      messages: state.messages.filter(m => m.id !== messageId),
    }))
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
