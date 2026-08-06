import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { App } from 'antd'
import { useRoomStore, getChannelFromRoom } from '@renderer/stores/serverStore'
import { useChatStore, type MessageWithStatus } from '@renderer/stores/chatStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { SearchMessages } from './SearchMessages'
import {
  BellOutlined,
  PushpinOutlined,
  NumberOutlined,
  UserOutlined,
  SearchOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { HeaderButton } from '@renderer/components/ui/HeaderButton'
import { SkeletonMessageList } from '@renderer/components/ui/Skeleton'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import { motion, AnimatePresence } from 'framer-motion'
import type { Channel, Message } from '@shared/types/kook'
import type { MessageResponse } from '@shared/types/api'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'

export function ChatView() {
  const { message: messageApi } = App.useApp()
  const { rooms, currentRoomId, currentChannelId, getServerMembers, setCurrentChannel } = useRoomStore()
  const {
    messages,
    pinnedMessages,
    fetchMessages,
    sendMessage,
    isLoading,
    hasMore,
    replyingTo,
    setReplyingTo,
    clearMessages,
    pinMessage,
    unpinMessage,
    retryMessage,
    editMessage,
    deleteMessageAsync,
    editingMessageId,
    deletingMessageId,
  } = useChatStore()
  const { currentUser } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      id: 'openSearch',
      handler: () => {
        setSearchOpen(true)
      },
      condition: () => !searchOpen,
      priority: 5,
    },
    {
      id: 'focusMessageInput',
      handler: () => {
        const input = document.querySelector('[data-message-input]') as HTMLInputElement | HTMLTextAreaElement
        if (input) {
          input.focus()
        }
      },
      priority: 5,
    },
  ])

  const currentRoom = rooms.find(r => String(r.id) === currentRoomId)
  const channels = useMemo(() => currentRoomId ? getChannelFromRoom(currentRoomId) : [], [currentRoomId])
  const currentChannel = channels.find((c: Channel) => c.id === currentChannelId)

  // Scroll state for smooth scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)

  const serverMembers = useMemo(() => {
    if (!currentRoomId) return []
    const members = getServerMembers(currentRoomId)
    return members.map(m => ({
      id: m.userId,
      username: m.user.name,
      displayName: m.nickname || m.user.displayName,
      avatar: m.user.avatar,
    }))
  }, [currentRoomId, getServerMembers])

  useEffect(() => {
    if (currentChannelId && currentChannel?.type !== 'voice') {
      clearMessages()
      fetchMessages(Number(currentChannelId), { pageSize: 50 })
      setShouldScrollToBottom(true)
    }
  }, [currentChannelId, currentChannel?.type, fetchMessages, clearMessages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom])

  const channelMessages: MessageWithStatus[] = messages.map(msg => ({
    ...msg,
  }))

  const pinnedKookMessages: Message[] = pinnedMessages.map(msg => ({
    id: String(msg.id),
    channelId: String(msg.roomId),
    authorId: String(msg.senderUserId),
    author: {
      id: String(msg.senderUserId),
      name: msg.senderName,
      displayName: msg.senderName,
      avatar: currentUser?.avatar,
      status: 'online' as const,
    },
    content: msg.content,
    timestamp: new Date(msg.createdAt).getTime(),
    pinned: true,
  }))

  const handleSendMessage = useCallback(async (content: string, attachments?: { url: string; type: 'image' | 'video' | 'audio' | 'file'; filename: string; size: number }[]) => {
    if (!currentChannelId) return

    try {
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const messageType = attachment.type === 'image' ? 2 : 1
          await sendMessage(Number(currentChannelId), {
            messageType,
            content: attachment.url,
          })
        }
      }

      if (content.trim()) {
        await sendMessage(Number(currentChannelId), {
          messageType: 1,
          content: content.trim(),
        })
      }
      setShouldScrollToBottom(true)
    } catch (_err) {
      messageApi.error('发送消息失败')
    }
  }, [currentChannelId, sendMessage, messageApi])

  const handleLoadMore = useCallback(() => {
    if (currentChannelId && hasMore && !isLoading) {
      fetchMessages(Number(currentChannelId), { page: 2, pageSize: 50 })
    }
  }, [currentChannelId, hasMore, isLoading, fetchMessages])

  const handleReply = useCallback((message: Message) => {
    const originalMsg = messages.find(m => String(m.id) === message.id)
    if (originalMsg) {
      setReplyingTo(originalMsg)
    }
  }, [messages, setReplyingTo])

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [setReplyingTo])

  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    if (!currentChannelId) return

    const numericMessageId = Number(messageId)
    const numericRoomId = Number(currentChannelId)

    try {
      await editMessage(numericRoomId, numericMessageId, content)
      messageApi.success('消息已更新')
    } catch (_err) {
      messageApi.error('更新消息失败')
    }
  }, [currentChannelId, messageApi, editMessage])

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!currentChannelId) return

    const numericMessageId = Number(messageId)
    const numericRoomId = Number(currentChannelId)

    try {
      await deleteMessageAsync(numericRoomId, numericMessageId)
      messageApi.success('消息已删除')
    } catch (_err) {
      messageApi.error('删除消息失败')
    }
  }, [currentChannelId, messageApi, deleteMessageAsync])

  const handlePinMessage = useCallback((messageId: string) => {
    const isPinned = pinnedMessages.some(m => String(m.id) === messageId)
    if (isPinned) {
      unpinMessage(Number(messageId))
    } else {
      pinMessage(Number(messageId))
    }
  }, [pinnedMessages, pinMessage, unpinMessage])

  const handleUnpinMessage = useCallback((messageId: string) => {
    unpinMessage(Number(messageId))
  }, [unpinMessage])

  const handleRetryMessage = useCallback((retryId: string) => {
    const msg = messages.find(m => m._retryId === retryId)
    if (msg && currentChannelId) {
      retryMessage(retryId, Number(currentChannelId), {
        messageType: msg.messageType,
        content: msg.content,
      })
    }
  }, [messages, currentChannelId, retryMessage])

  const handleSearchMessageClick = useCallback((message: MessageResponse) => {
    const channel = channels.find((c: Channel) => c.id === String(message.roomId))
    if (channel) {
      setCurrentChannel(String(message.roomId))
    }
  }, [channels, setCurrentChannel])

  const typingIndicator = useTypingIndicator(currentChannelId ? Number(currentChannelId) : null)

  if (!currentRoom || !currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-base)]">
        <NoChannelSelected />
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-base)]">
        {/* Header */}
        <div className="h-[var(--header-height)] px-4 flex items-center gap-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <NumberOutlined className="text-[var(--color-text-muted)]" />
            <span className="font-semibold text-[var(--color-text-normal)]">{currentChannel.name}</span>
          </div>
          {currentChannel.topic && (
            <>
              <div className="w-px h-6 bg-[var(--color-border)]" />
              <span className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">{currentChannel.topic}</span>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
            <HeaderButton icon={<BellOutlined />} label="通知" />
            <HeaderButton icon={<PushpinOutlined />} label="置顶" />
            <HeaderButton icon={<UserOutlined />} label="成员" />
            <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2 h-7 bg-[var(--color-bg-darkest)] rounded text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] transition-colors"
            >
              <SearchOutlined />
              <span className="w-20 text-left">搜索</span>
            </button>
            <HeaderButton icon={<InboxOutlined />} label="收件箱" />
          </div>
        </div>

        {/* Reply bar */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex items-center gap-2 overflow-hidden"
            >
              <span className="text-xs text-[var(--color-text-muted)]">
                回复 <span className="text-[var(--color-primary)] font-medium">{replyingTo.senderName}</span>:
              </span>
              <span className="text-sm text-[var(--color-text-normal)] truncate flex-1">
                {replyingTo.content.slice(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}
              </span>
              <button
                onClick={handleCancelReply}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] px-2 py-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                取消
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {typingIndicator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-1 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] overflow-hidden"
            >
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="text-[var(--color-primary)]">{typingIndicator}</span> 正在输入...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        {isLoading && messages.length === 0 ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <SkeletonMessageList count={8} />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <MessageList
              messages={channelMessages}
              onAddReaction={() => {}}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoading}
              onReply={handleReply}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onPin={handlePinMessage}
              onUnpin={handleUnpinMessage}
              pinnedMessages={pinnedKookMessages}
              onRetry={handleRetryMessage}
              editingMessageId={editingMessageId}
              deletingMessageId={deletingMessageId}
            />
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput
            onSend={handleSendMessage}
            channelName={currentChannel.name}
            replyingTo={replyingTo ? { name: replyingTo.senderName, content: replyingTo.content } : null}
            onCancelReply={handleCancelReply}
            members={serverMembers}
          />
        </div>
      </div>

      <SearchMessages
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onMessageClick={handleSearchMessageClick}
      />
    </>
  )
}

function useTypingIndicator(roomId: number | null) {
  const typingUsers = useChatStore(state => state.typingUsers)
  const currentUser = useAuthStore(state => state.currentUser)

  const usersTyping = useMemo(() => {
    if (!roomId) return []
    const roomTyping = typingUsers.get(roomId) || []
    return roomTyping.filter(u => u.userId !== currentUser?.id)
  }, [roomId, typingUsers, currentUser?.id])

  if (usersTyping.length === 0) return null
  if (usersTyping.length === 1) return usersTyping[0].username
  if (usersTyping.length === 2) return `${usersTyping[0].username} 和 ${usersTyping[1].username}`
  return `${usersTyping[0].username} 和其他 ${usersTyping.length - 1} 人`
}

export default ChatView
