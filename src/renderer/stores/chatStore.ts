import { create } from 'zustand'
import type {
  ChannelMessage,
  SendMessageRequest,
  UpdateMessageRequest,
  ReactionRequest,
  MessageListParams,
} from '@shared/types/message'
import type { MessageType } from '@shared/types/message'
import { messageService } from '../services/messageService'

export type MessageSendStatus = 'sent' | 'sending' | 'failed'

export interface MessageWithStatus extends ChannelMessage {
  status: MessageSendStatus
  _retryId?: string
}

export interface ChatState {
  // State - multi-channel message cache
  messages: Map<number, MessageWithStatus[]>
  typingUsers: Map<number, Set<number>>
  isLoading: boolean
  hasMore: Map<number, boolean>
  nextPage: Map<number, number>
  error: string | null

  // Message actions
  fetchMessages: (channelId: number, before?: number) => Promise<void>
  sendMessage: (channelId: number, data: SendMessageRequest) => Promise<void>
  updateMessage: (channelId: number, messageId: number, content: string) => Promise<void>
  deleteMessage: (channelId: number, messageId: number) => Promise<void>
  pinMessage: (channelId: number, messageId: number) => Promise<void>
  addReaction: (channelId: number, messageId: number, emoji: string) => Promise<void>
  removeReaction: (channelId: number, messageId: number, emoji: string) => Promise<void>

  // WS event handlers (called by WS hook)
  onMessageReceived: (channelId: number, message: ChannelMessage) => void
  onMessageDeleted: (channelId: number, messageId: number) => void
  onMessageUpdated: (channelId: number, message: ChannelMessage) => void
  onReactionAdded: (channelId: number, messageId: number, emoji: string, userId: number) => void
  onReactionRemoved: (channelId: number, messageId: number, emoji: string, userId: number) => void

  // Typing
  setTyping: (channelId: number, userId: number, isTyping: boolean) => void

  // Channel management
  clearChannel: (channelId: number) => void
  getMessages: (channelId: number) => MessageWithStatus[]
  clearError: () => void

  // Retry failed message
  retryMessage: (retryId: string, channelId: number, data: SendMessageRequest) => Promise<void>
}

function toMessageWithStatus(msg: ChannelMessage, status: MessageSendStatus = 'sent'): MessageWithStatus {
  return { ...msg, status }
}

function dedupeMessages(messages: MessageWithStatus[]): MessageWithStatus[] {
  const seenIds = new Set<number>()
  return messages.filter((message) => {
    if (seenIds.has(message.id)) return false
    seenIds.add(message.id)
    return true
  })
}

function mergeFetchedMessages(
  existingMessages: MessageWithStatus[],
  fetchedMessages: MessageWithStatus[],
  prependOlder: boolean
): MessageWithStatus[] {
  const existing = dedupeMessages(existingMessages)
  const fetched = dedupeMessages(fetchedMessages)
  const fetchedById = new Map(fetched.map((message) => [message.id, message]))

  if (!prependOlder) {
    const fetchedIds = new Set(fetched.map((message) => message.id))
    const retainedMessages = existing.filter((message) => !fetchedIds.has(message.id))
    return [...fetched, ...retainedMessages]
  }

  const existingIds = new Set(existing.map((message) => message.id))
  const olderMessages = fetched.filter((message) => !existingIds.has(message.id))
  const mergedExisting = existing.map((message) => fetchedById.get(message.id) ?? message)
  return [...olderMessages, ...mergedExisting]
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: new Map(),
  typingUsers: new Map(),
  isLoading: false,
  hasMore: new Map(),
  nextPage: new Map(),
  error: null,

  // Fetch messages (with cursor pagination)
  fetchMessages: async (channelId: number, before?: number) => {
    set({ isLoading: true, error: null })
    try {
      const page = before === undefined ? 1 : (get().nextPage.get(channelId) ?? 2)
      const params: MessageListParams = { page, pageSize: 50 }
      const result = await messageService.getMessages(channelId, params)
      const newMessages = result.list.map((msg) => toMessageWithStatus(msg, 'sent'))
      const orderedNewMessages = [...newMessages].reverse()

      set((state) => {
        const messagesMap = new Map(state.messages)
        const existing = messagesMap.get(channelId) || []
        messagesMap.set(channelId, mergeFetchedMessages(existing, orderedNewMessages, before !== undefined))

        const hasMoreMap = new Map(state.hasMore)
        hasMoreMap.set(channelId, newMessages.length >= 50)
        const nextPageMap = new Map(state.nextPage)
        nextPageMap.set(channelId, page + 1)

        return { messages: messagesMap, isLoading: false, hasMore: hasMoreMap, nextPage: nextPageMap }
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '获取消息失败',
      })
      throw err
    }
  },

  // Send message (optimistic update)
  sendMessage: async (channelId: number, data: SendMessageRequest) => {
    const tempId = Date.now()
    const retryId = `retry-${tempId}`

    const optimisticMessage: MessageWithStatus = {
      id: tempId,
      channelId,
      senderUserId: 0,
      senderName: '',
      senderAvatarUrl: '',
      type: data.type,
      content: data.content,
      replyToId: data.replyToId ?? null,
      replyTo: null,
      editedAt: null,
      isPinned: false,
      attachments: [],
      reactions: [],
      createdAt: new Date().toISOString(),
      status: 'sending',
      _retryId: retryId,
    }

    set((state) => {
      const messagesMap = new Map(state.messages)
      const existing = messagesMap.get(channelId) || []
      messagesMap.set(channelId, [...existing, optimisticMessage])
      return { messages: messagesMap }
    })

    try {
      const response = await messageService.sendMessage(channelId, data)
      set((state) => {
        const messagesMap = new Map(state.messages)
        const existing = messagesMap.get(channelId) || []
        messagesMap.set(
          channelId,
          existing.map((m) => (m.id === tempId ? toMessageWithStatus(response, 'sent') : m))
        )
        return { messages: messagesMap }
      })
    } catch (err) {
      set((state) => {
        const messagesMap = new Map(state.messages)
        const existing = messagesMap.get(channelId) || []
        messagesMap.set(
          channelId,
          existing.map((m) => (m.id === tempId ? { ...m, status: 'failed' as const } : m))
        )
        return { messages: messagesMap }
      })
      throw err
    }
  },

  // Update message
  updateMessage: async (channelId: number, messageId: number, content: string) => {
    const requestData: UpdateMessageRequest = { content }
    const response = await messageService.updateMessage(channelId, messageId, requestData)
    get().onMessageUpdated(channelId, response)
  },

  // Delete message
  deleteMessage: async (channelId: number, messageId: number) => {
    await messageService.deleteMessage(channelId, messageId)
    get().onMessageDeleted(channelId, messageId)
  },

  // Pin message
  pinMessage: async (channelId: number, messageId: number) => {
    await messageService.pinMessage(channelId, messageId)
    // The server will broadcast message_update event which will update via onMessageUpdated
  },

  // Add reaction
  addReaction: async (channelId: number, messageId: number, emoji: string) => {
    const data: ReactionRequest = { emoji }
    await messageService.addReaction(channelId, messageId, data)
    // Server will broadcast reaction_add event
  },

  // Remove reaction
  removeReaction: async (channelId: number, messageId: number, emoji: string) => {
    await messageService.removeReaction(channelId, messageId, emoji)
    // Server will broadcast reaction_remove event
  },

  // WS event: message received
  onMessageReceived: (channelId: number, message: ChannelMessage) => {
    set((state) => {
      const messagesMap = new Map(state.messages)
      const existing = messagesMap.get(channelId) || []
      // Check for duplicate (e.g., our own optimistic message already has the real ID)
      if (existing.some((m) => m.id === message.id)) {
        // Update the existing message with the real data
        messagesMap.set(
          channelId,
          existing.map((m) => (m.id === message.id ? toMessageWithStatus(message, 'sent') : m))
        )
      } else {
        messagesMap.set(channelId, [...existing, toMessageWithStatus(message, 'sent')])
      }
      return { messages: messagesMap }
    })
  },

  // WS event: message deleted
  onMessageDeleted: (channelId: number, messageId: number) => {
    set((state) => {
      const messagesMap = new Map(state.messages)
      const existing = messagesMap.get(channelId) || []
      messagesMap.set(
        channelId,
        existing.filter((m) => m.id !== messageId)
      )
      return { messages: messagesMap }
    })
  },

  // WS event: message updated
  onMessageUpdated: (channelId: number, message: ChannelMessage) => {
    set((state) => {
      const messagesMap = new Map(state.messages)
      const existing = messagesMap.get(channelId) || []
      messagesMap.set(
        channelId,
        existing.map((m) => (m.id === message.id ? { ...m, ...message, status: m.status } : m))
      )
      return { messages: messagesMap }
    })
  },

  // WS event: reaction added
  onReactionAdded: (channelId: number, messageId: number, emoji: string, userId: number) => {
    set((state) => {
      const messagesMap = new Map(state.messages)
      const existing = messagesMap.get(channelId) || []
      messagesMap.set(
        channelId,
        existing.map((m) => {
          if (m.id !== messageId) return m
          const reactions = [...m.reactions]
          const existingReaction = reactions.find((r) => r.emoji === emoji)
          if (existingReaction) {
            if (!existingReaction.users.includes(userId)) {
              existingReaction.users = [...existingReaction.users, userId]
              existingReaction.count = existingReaction.users.length
            }
          } else {
            reactions.push({ emoji, count: 1, users: [userId] })
          }
          return { ...m, reactions }
        })
      )
      return { messages: messagesMap }
    })
  },

  // WS event: reaction removed
  onReactionRemoved: (channelId: number, messageId: number, emoji: string, userId: number) => {
    set((state) => {
      const messagesMap = new Map(state.messages)
      const existing = messagesMap.get(channelId) || []
      messagesMap.set(
        channelId,
        existing.map((m) => {
          if (m.id !== messageId) return m
          const reactions = m.reactions
            .map((r) => {
              if (r.emoji !== emoji) return r
              const users = r.users.filter((u) => u !== userId)
              return { ...r, users, count: users.length }
            })
            .filter((r) => r.count > 0)
          return { ...m, reactions }
        })
      )
      return { messages: messagesMap }
    })
  },

  // Set typing state
  setTyping: (channelId: number, userId: number, isTyping: boolean) => {
    set((state) => {
      const typingMap = new Map(state.typingUsers)
      const typingSet = new Set(typingMap.get(channelId) || new Set<number>())
      if (isTyping) {
        typingSet.add(userId)
      } else {
        typingSet.delete(userId)
      }
      typingMap.set(channelId, typingSet)
      return { typingUsers: typingMap }
    })
  },

  // Clear channel messages
  clearChannel: (channelId: number) => {
    set((state) => {
      const messagesMap = new Map(state.messages)
      messagesMap.delete(channelId)
      const hasMoreMap = new Map(state.hasMore)
      hasMoreMap.delete(channelId)
      const typingMap = new Map(state.typingUsers)
      typingMap.delete(channelId)
      const nextPageMap = new Map(state.nextPage)
      nextPageMap.delete(channelId)
      return { messages: messagesMap, hasMore: hasMoreMap, typingUsers: typingMap, nextPage: nextPageMap }
    })
  },

  // Get messages for a channel (convenience accessor)
  getMessages: (channelId: number) => {
    return get().messages.get(channelId) || []
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },

  // Retry failed message
  retryMessage: async (retryId: string, channelId: number, data: SendMessageRequest) => {
    // Remove the failed message with this retryId
    set((state) => {
      const messagesMap = new Map(state.messages)
      const existing = messagesMap.get(channelId) || []
      messagesMap.set(
        channelId,
        existing.filter((m) => m._retryId !== retryId)
      )
      return { messages: messagesMap }
    })

    // Re-send via sendMessage
    await get().sendMessage(channelId, data)
  },
}))

export type { ChatState as ContentDomainState }
export type { MessageType }
