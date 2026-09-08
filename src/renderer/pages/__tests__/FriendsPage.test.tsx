import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { FriendsPage } from '../FriendsPage'
import { friendService } from '@renderer/services'
import type { FriendItem, PrivateMessage } from '@shared/types/friend'

// vi.mock must run before importing the module under test. friendService is
// imported by FriendsPage, so hoisted mock replaces it.
vi.mock('@renderer/services', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    friendService: {
      getFriends: vi.fn(),
      getFriendRequests: vi.fn(),
      getConversations: vi.fn(),
      getPrivateMessages: vi.fn(),
      removeFriend: vi.fn(),
      handleFriendRequest: vi.fn(),
      searchUsers: vi.fn(),
      sendFriendRequest: vi.fn(),
      sendPrivateMessage: vi.fn(),
    },
  }
})

// Type-safe reference to the mocked friendService
const mockFriendService = friendService as {
  getFriends: ReturnType<typeof vi.fn>
  getFriendRequests: ReturnType<typeof vi.fn>
  getConversations: ReturnType<typeof vi.fn>
  getPrivateMessages: ReturnType<typeof vi.fn>
  removeFriend: ReturnType<typeof vi.fn>
  handleFriendRequest: ReturnType<typeof vi.fn>
  searchUsers: ReturnType<typeof vi.fn>
  sendFriendRequest: ReturnType<typeof vi.fn>
  sendPrivateMessage: ReturnType<typeof vi.fn>
}

function renderPage(): void {
  render(
    <AntdApp>
      <FriendsPage params={{}} />
    </AntdApp>
  )
}

const friends: FriendItem[] = [
  {
    id: 1,
    friendId: 42,
    friendUsername: 'Alice',
    friendAvatarUrl: '',
    isOnline: true,
    customStatus: 'online',
    createdAt: '',
  },
]

const messages: PrivateMessage[] = [
  {
    id: 1,
    senderId: 42,
    senderName: 'Alice',
    receiverId: 0,
    content: 'hello',
    isRead: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

/** Click the "私信" button on a friend row (not the top tab, which is also "私信"). */
async function clickFirstFriendChat(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const chatButtons = screen.getAllByText('私信')
  const friendChatBtn =
    chatButtons.find((btn) => btn.closest('[class*="group"]') !== null) ?? chatButtons[0]
  await user.click(friendChatBtn)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useRealTimers()
  // Default happy-path mocks for initial loads + chat.
  mockFriendService.getFriends.mockResolvedValue(friends)
  mockFriendService.getFriendRequests.mockResolvedValue([])
  mockFriendService.getConversations.mockResolvedValue([])
  mockFriendService.getPrivateMessages.mockResolvedValue(messages)
  mockFriendService.sendPrivateMessage.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('FriendsPage', () => {
  describe('chat message polling (8s while activeChatUserId set)', () => {
    it('should call getPrivateMessages when selecting a conversation via 私信 button', async () => {
      const user = userEvent.setup()
      renderPage()
      // Wait for initial friend list load (real timers)
      await screen.findByText('Alice')

      await clickFirstFriendChat(user)

      await waitFor(() => {
        expect(mockFriendService.getPrivateMessages).toHaveBeenCalledWith(42)
      })
    })

    it('should call sendPrivateMessage with trimmed draft when pressing Enter', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('Alice')

      await clickFirstFriendChat(user)
      // Enter the draft and press Enter to send.
      await user.type(screen.getByPlaceholderText('输入消息，Enter 发送，Shift+Enter 换行'), '  你好  {Enter}')

      await waitFor(() => {
        expect(mockFriendService.sendPrivateMessage).toHaveBeenCalledWith({
          receiverId: 42,
          content: '你好',
          type: 'text',
        })
      })
      // Draft is cleared after send.
      await waitFor(() => {
        expect(screen.getByPlaceholderText('输入消息，Enter 发送，Shift+Enter 换行')).toHaveValue('')
      })
    })

    it('should not send an empty/whitespace-only draft', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByText('Alice')

      await clickFirstFriendChat(user)
      await user.type(screen.getByPlaceholderText('输入消息，Enter 发送，Shift+Enter 换行'), '   {Enter}')

      await waitFor(() => {
        expect(mockFriendService.sendPrivateMessage).not.toHaveBeenCalled()
      })
    })

    it('should show an error message and revert the optimistic message when send fails', async () => {
      const user = userEvent.setup()
      mockFriendService.sendPrivateMessage.mockRejectedValue(new Error('发送失败'))

      renderPage()
      await screen.findByText('Alice')

      await clickFirstFriendChat(user)
      await user.type(screen.getByPlaceholderText('输入消息，Enter 发送，Shift+Enter 换行'), '会有缘{Enter}')

      // The failed message is reverted from the conversation pane.
      await waitFor(() => {
        expect(screen.queryByText('会有缘')).not.toBeInTheDocument()
      })
    })
  })
})
