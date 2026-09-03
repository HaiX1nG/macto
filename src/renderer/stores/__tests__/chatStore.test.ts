import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MessageType, type ChannelMessage } from '@shared/types/message'
import { messageService } from '../../services/messageService'
import { useChatStore, type MessageWithStatus } from '../chatStore'

vi.mock('../../services/messageService', () => {
  const mock = {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    updateMessage: vi.fn(),
    deleteMessage: vi.fn(),
    pinMessage: vi.fn(),
    addReaction: vi.fn(),
    removeReaction: vi.fn(),
    searchMessages: vi.fn(),
  }
  return { messageService: mock, default: mock }
})

const mockMessageService = vi.mocked(messageService)

function makeMessage(id: number, content = `message-${id}`): ChannelMessage {
  return {
    id,
    channelId: 1,
    senderUserId: id,
    senderName: `user-${id}`,
    senderAvatarUrl: '',
    type: MessageType.Text,
    content,
    replyToId: null,
    replyTo: null,
    editedAt: null,
    isPinned: false,
    attachments: [],
    reactions: [],
    createdAt: new Date(id * 1000).toISOString(),
  }
}

function withStatus(message: ChannelMessage, status: MessageWithStatus['status']): MessageWithStatus {
  return { ...message, status }
}

describe('useChatStore message pagination', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: new Map(),
      typingUsers: new Map(),
      isLoading: false,
      hasMore: new Map(),
      nextPage: new Map(),
      error: null,
    })
    vi.clearAllMocks()
  })

  it('retains optimistic and WebSocket messages during the initial fetch', async () => {
    const optimistic = withStatus(makeMessage(900, 'pending'), 'sending')
    const websocketMessage = withStatus(makeMessage(901, 'live'), 'sent')
    const staleServerMessage = withStatus(makeMessage(10, 'stale'), 'sent')
    const serverUpdate = makeMessage(10, 'fresh')
    const newestServerMessage = makeMessage(11, 'newest')

    useChatStore.setState({
      messages: new Map([[1, [optimistic, staleServerMessage, websocketMessage]]]),
    })
    mockMessageService.getMessages.mockResolvedValueOnce({
      // The API returns newest first; the store exposes oldest first.
      list: [newestServerMessage, serverUpdate],
      total: 2,
    })

    await useChatStore.getState().fetchMessages(1)

    expect(mockMessageService.getMessages).toHaveBeenCalledWith(1, { page: 1, pageSize: 50 })
    expect(useChatStore.getState().messages.get(1)).toEqual([
      withStatus(serverUpdate, 'sent'),
      withStatus(newestServerMessage, 'sent'),
      optimistic,
      websocketMessage,
    ])
  })

  it('uses the per-channel next page and merges older pages without duplicate IDs', async () => {
    const newest = makeMessage(5, 'newest')
    const initialOlder = makeMessage(4, 'initial')
    const updatedOlder = makeMessage(4, 'updated by server')
    const oldest = makeMessage(3, 'oldest')
    const websocketMessage = withStatus(makeMessage(900, 'live'), 'sent')

    mockMessageService.getMessages
      .mockResolvedValueOnce({ list: [newest, initialOlder], total: 4 })
      .mockResolvedValueOnce({ list: [updatedOlder, oldest], total: 4 })

    await useChatStore.getState().fetchMessages(1)
    useChatStore.getState().onMessageReceived(1, websocketMessage)
    await useChatStore.getState().fetchMessages(1, 5)

    expect(mockMessageService.getMessages).toHaveBeenNthCalledWith(1, 1, { page: 1, pageSize: 50 })
    expect(mockMessageService.getMessages).toHaveBeenNthCalledWith(2, 1, { page: 2, pageSize: 50 })
    expect(useChatStore.getState().messages.get(1)).toEqual([
      withStatus(oldest, 'sent'),
      withStatus(updatedOlder, 'sent'),
      withStatus(newest, 'sent'),
      websocketMessage,
    ])
    expect(useChatStore.getState().nextPage.get(1)).toBe(3)
  })

  it('does not advance nextPage when loading a page fails', async () => {
    const initialMessage = makeMessage(2)
    const nextMessage = makeMessage(1)

    mockMessageService.getMessages
      .mockResolvedValueOnce({ list: [initialMessage], total: 2 })
      .mockRejectedValueOnce(new Error('request failed'))
      .mockResolvedValueOnce({ list: [nextMessage], total: 2 })

    await useChatStore.getState().fetchMessages(1)
    await expect(useChatStore.getState().fetchMessages(1, initialMessage.id)).rejects.toThrow('request failed')
    expect(useChatStore.getState().nextPage.get(1)).toBe(2)

    await useChatStore.getState().fetchMessages(1, initialMessage.id)

    expect(mockMessageService.getMessages).toHaveBeenNthCalledWith(2, 1, { page: 2, pageSize: 50 })
    expect(mockMessageService.getMessages).toHaveBeenNthCalledWith(3, 1, { page: 2, pageSize: 50 })
    expect(useChatStore.getState().nextPage.get(1)).toBe(3)
  })

  it('uses the raw response length for hasMore and clears nextPage with a channel', async () => {
    mockMessageService.getMessages.mockResolvedValueOnce({ list: [makeMessage(1)], total: 100 })

    await useChatStore.getState().fetchMessages(1)

    expect(useChatStore.getState().hasMore.get(1)).toBe(false)
    expect(useChatStore.getState().nextPage.get(1)).toBe(2)

    useChatStore.getState().clearChannel(1)

    expect(useChatStore.getState().nextPage.has(1)).toBe(false)
  })
})
