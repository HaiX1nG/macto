import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { App, Dropdown, Empty, Popover } from 'antd'
import { useChannelStore } from '@renderer/stores/channelStore'
import { useChatStore, type MessageWithStatus } from '@renderer/stores/chatStore'
import { useServerStore } from '@renderer/stores/serverStore'
import { useUIStore } from '@renderer/stores/uiStore'
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
import { NoChannelSelected, EmptyNotifications } from '@renderer/components/ui/EmptyState'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageType } from '@shared/types/message'
import type { ChannelMessage } from '@shared/types/message'
import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'

export function ChatView() {
  const { message: messageApi } = App.useApp()
  const { currentChannel, currentChannelId } = useChannelStore()
  const { members } = useServerStore()
  const { setActiveView, toggleMemberList } = useUIStore()
  const {
    messages: messagesMap,
    fetchMessages,
    sendMessage,
    isLoading,
    hasMore,
    pinMessage,
    retryMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    clearChannel,
  } = useChatStore()
  const { currentUser } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChannelMessage | null>(null)

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

  // Scroll state for smooth scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)

  const serverMembers = useMemo(() => {
    return members.map(m => ({
      id: m.userId,
      username: m.username,
      displayName: m.nickname || m.username,
      avatar: m.avatarUrl,
    }))
  }, [members])

  const channelMessages: MessageWithStatus[] = useMemo(() => {
    if (!currentChannelId) return []
    return messagesMap.get(currentChannelId) || []
  }, [messagesMap, currentChannelId])

  const pinnedMessages = useMemo(() => {
    return channelMessages.filter(m => m.isPinned)
  }, [channelMessages])

  // 置顶消息面板内容
  const pinnedPanel = useMemo(() => {
    if (pinnedMessages.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无置顶消息" className="m-4" />
    }
    return (
      <div className="flex flex-col gap-1 p-1 max-h-72 overflow-y-auto w-64">
        {pinnedMessages.map((m) => (
          <div key={m.id} className="px-3 py-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-primary)] truncate">{m.senderName}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0">
                {new Date(m.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-normal)] break-all">{m.content}</p>
          </div>
        ))}
      </div>
    )
  }, [pinnedMessages])

  useEffect(() => {
    if (currentChannelId) {
      clearChannel(currentChannelId)
      fetchMessages(currentChannelId)
      setShouldScrollToBottom(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannelId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setShouldScrollToBottom(false)
    }
  }, [channelMessages, shouldScrollToBottom])

  const handleSendMessage = useCallback(async (content: string, attachments?: { url: string; type: 'image' | 'video' | 'audio' | 'file'; filename: string; size: number }[]) => {
    if (!currentChannelId) return

    try {
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const msgType = attachment.type === 'image' ? MessageType.Image : MessageType.Text
          await sendMessage(currentChannelId, {
            type: msgType,
            content: attachment.url,
          })
        }
      }

      if (content.trim()) {
        await sendMessage(currentChannelId, {
          type: MessageType.Text,
          content: content.trim(),
          replyToId: replyingTo?.id,
        })
      }
      setShouldScrollToBottom(true)
      setReplyingTo(null)
    } catch (_err) {
      messageApi.error('发送消息失败')
    }
  }, [currentChannelId, sendMessage, messageApi, replyingTo])

  const handleLoadMore = useCallback(() => {
    if (currentChannelId && hasMore.get(currentChannelId) && !isLoading) {
      const oldestMsg = channelMessages[0]
      const before = oldestMsg?.id
      fetchMessages(currentChannelId, before)
    }
  }, [currentChannelId, hasMore, isLoading, fetchMessages, channelMessages])

  const handleReply = useCallback((message: MessageWithStatus) => {
    setReplyingTo(message)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  const handleEditMessage = useCallback(async (messageId: number, content: string) => {
    if (!currentChannelId) return

    try {
      await updateMessage(currentChannelId, messageId, content)
      messageApi.success('消息已更新')
    } catch (_err) {
      messageApi.error('更新消息失败')
    }
  }, [currentChannelId, messageApi, updateMessage])

  const handleDeleteMessage = useCallback(async (messageId: number) => {
    if (!currentChannelId) return

    try {
      await deleteMessage(currentChannelId, messageId)
      messageApi.success('消息已删除')
    } catch (_err) {
      messageApi.error('删除消息失败')
    }
  }, [currentChannelId, messageApi, deleteMessage])

  const handlePinMessage = useCallback((messageId: number) => {
    if (!currentChannelId) return
    pinMessage(currentChannelId, messageId)
  }, [currentChannelId, pinMessage])

  const handleReaction = useCallback((messageId: number, emoji: string) => {
    if (!currentChannelId) return
    const msg = channelMessages.find(m => m.id === messageId)
    if (!msg) return
    const existingReaction = msg.reactions.find(r => r.emoji === emoji)
    const hasReacted = existingReaction?.users.includes(currentUser?.id ?? -1)
    if (hasReacted) {
      removeReaction(currentChannelId, messageId, emoji)
    } else {
      addReaction(currentChannelId, messageId, emoji)
    }
  }, [currentChannelId, channelMessages, currentUser?.id, addReaction, removeReaction])

  const handleRetryMessage = useCallback((retryId: string) => {
    const msg = channelMessages.find(m => m._retryId === retryId)
    if (msg && currentChannelId) {
      retryMessage(retryId, currentChannelId, {
        type: msg.type,
        content: msg.content,
      })
    }
  }, [channelMessages, currentChannelId, retryMessage])

  const handleSearchMessageClick = useCallback((message: ChannelMessage) => {
    if (message.channelId) {
      // Navigate to the channel containing the message
      setActiveView('text-channel', { channelId: message.channelId })
    }
  }, [setActiveView])

  const typingIndicator = useTypingIndicator(currentChannelId)

  if (!currentChannel) {
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
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              overlayClassName="rounded-xl overflow-hidden"
              menu={{ items: [] }}
              dropdownRender={() => <EmptyNotifications />}
            >
              <span className="inline-flex">
                <HeaderButton icon={<BellOutlined />} label="通知" />
              </span>
            </Dropdown>
            <Popover
              placement="bottomRight"
              trigger="click"
              content={pinnedPanel}
              title={<span className="text-sm font-semibold text-[var(--color-text-normal)]">置顶消息</span>}
              overlayInnerStyle={{ padding: 0 }}
              overlayClassName="rounded-xl overflow-hidden"
            >
              <span className="inline-flex">
                <HeaderButton icon={<PushpinOutlined />} label="置顶" />
              </span>
            </Popover>
            <HeaderButton icon={<UserOutlined />} label="成员" onClick={toggleMemberList} />
            <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2 h-7 bg-[var(--color-bg-darkest)] rounded text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] transition-colors"
            >
              <SearchOutlined />
              <span className="w-20 text-left">搜索</span>
            </button>
            <HeaderButton
              icon={<InboxOutlined />}
              label="收件箱"
              onClick={() => setActiveView('friends')}
            />
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
        {isLoading && channelMessages.length === 0 ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <SkeletonMessageList count={8} />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <MessageList
              messages={channelMessages}
              onAddReaction={handleReaction}
              onLoadMore={handleLoadMore}
              hasMore={currentChannelId ? hasMore.get(currentChannelId) ?? false : false}
              isLoading={isLoading}
              onReply={handleReply}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onPin={handlePinMessage}
              onUnpin={handlePinMessage}
              pinnedMessages={pinnedMessages}
              onRetry={handleRetryMessage}
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

function useTypingIndicator(channelId: number | null) {
  const typingUsers = useChatStore(state => state.typingUsers)
  const currentUser = useAuthStore(state => state.currentUser)

  const usersTyping = useMemo(() => {
    if (!channelId) return []
    const channelTyping = typingUsers.get(channelId) || new Set<number>()
    return Array.from(channelTyping).filter(u => u !== currentUser?.id)
  }, [channelId, typingUsers, currentUser?.id])

  if (usersTyping.length === 0) return null
  // Look up member names from serverStore
  const { members } = useServerStore.getState()
  const names = usersTyping.map(uid => {
    const member = members.find(m => m.userId === uid)
    return member?.nickname || member?.username || `用户 ${uid}`
  })
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} 和 ${names[1]}`
  return `${names[0]} 和其他 ${names.length - 1} 人`
}

export default ChatView
