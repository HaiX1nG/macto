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

  // Actions
  fetchMessages: (roomId: number, params?: MessageListRequest) => Promise<void>
  sendMessage: (roomId: number, data: SendMessageRequest) => Promise<void>
  addMessage: (message: MessageResponse) => void
  clearMessages: () => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  hasMore: true,
  error: null,

  fetchMessages: async (roomId, params) => {
    set({ isLoading: true, error: null })
    try {
      const messages = await chatService.getMessages(roomId, params)
      set((state) => ({
        messages: params?.page && params.page > 1
          ? [...messages, ...state.messages]
          : messages,
        hasMore: messages.length === (params?.pageSize ?? 50),
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages'
      set({ isLoading: false, error: message })
    }
  },

  sendMessage: async (roomId, data) => {
    set({ isLoading: true, error: null })
    try {
      const message = await chatService.sendMessage(roomId, data)
      set((state) => ({
        messages: [...state.messages, message],
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  clearMessages: () => set({ messages: [], hasMore: true }),

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export default useChatStore