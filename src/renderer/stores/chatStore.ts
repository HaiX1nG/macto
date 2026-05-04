import { create } from 'zustand'
import { chatService } from '../services'
import type {
  MessageResponse,
  SendMessageRequest,
  MessageListRequest,
} from '@shared/types/api'

interface ChatState {
  messages: MessageResponse[]
  isLoading: boolean
  hasMore: boolean
  error: string | null
  currentRoomId: number | null
  replyingTo: MessageResponse | null
  editingMessage: MessageResponse | null

  // Actions
  fetchMessages: (roomId: number, params?: MessageListRequest) => Promise<void>
  sendMessage: (roomId: number, data: SendMessageRequest) => Promise<void>
  addMessage: (message: MessageResponse) => void
  updateMessage: (messageId: number, content: string) => void
  deleteMessage: (messageId: number) => void
  clearMessages: () => void
  setReplyingTo: (message: MessageResponse | null) => void
  setEditingMessage: (message: MessageResponse | null) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  hasMore: true,
  error: null,
  currentRoomId: null,
  replyingTo: null,
  editingMessage: null,

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
    set({ isLoading: true, error: null })
    try {
      const message = await chatService.sendMessage(roomId, data)
      set((state) => ({
        messages: [...state.messages, message],
        isLoading: false,
        replyingTo: null, // Clear reply state after sending
      }))
    } catch (err: unknown) {
      set({ isLoading: false, error: 'Failed to send message' })
      const error = err instanceof Error ? err : new Error('Unknown error')
      throw error
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
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
    }))
  },

  clearMessages: () => set({ messages: [], hasMore: true, currentRoomId: null }),

  setReplyingTo: (message) => set({ replyingTo: message }),

  setEditingMessage: (message) => set({ editingMessage: message }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}))

export default useChatStore
