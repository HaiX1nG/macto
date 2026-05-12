import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { Avatar, Dropdown, Popover, App, Spin, Modal, Tooltip } from 'antd'
import { SmileOutlined, EditOutlined, DeleteOutlined, PushpinOutlined, MoreOutlined, CopyOutlined, ExportOutlined, LoadingOutlined, FileOutlined, ReloadOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { EmptyMessages } from '@renderer/components/ui/EmptyState'
import { MarkdownRenderer } from '@renderer/components/ui/MarkdownRenderer'
import { formatRelativeTime, formatTime, formatFullDateTime, formatDateDivider } from '@renderer/utils/timeFormat'
import type { Message, Attachment } from '@shared/types/kook'
import type { MessageWithStatus } from '@renderer/stores/chatStore'

// Quick reaction emojis
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

interface MessageListProps {
  messages: MessageWithStatus[]
  onAddReaction?: (messageId: string, emoji: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  onReply?: (message: Message) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
  onPin?: (messageId: string) => void
  onUnpin?: (messageId: string) => void
  pinnedMessages?: Message[]
  onRetry?: (retryId: string) => void
  // Unread messages
  unreadCount?: number
  firstUnreadMessageId?: number | null
  onScrollToBottom?: () => void
  onScrollToUnread?: () => void
}

export function MessageList({
  messages,
  onAddReaction,
  onLoadMore,
  hasMore,
  isLoading,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  pinnedMessages,
  onRetry,
  unreadCount = 0,
  firstUnreadMessageId,
  onScrollToBottom,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!listRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const isBottom = scrollHeight - scrollTop - clientHeight < 100

    setIsAtBottom(isBottom)
    setShowScrollButton(!isBottom && scrollHeight > clientHeight + 200)

    // Load more when scrolled to top
    if (scrollTop < 100 && onLoadMore && hasMore && !isLoading && !isLoadingMore) {
      setIsLoadingMore(true)
      onLoadMore()
      setTimeout(() => setIsLoadingMore(false), 500)
    }
  }, [onLoadMore, hasMore, isLoading, isLoadingMore])

  // Scroll to bottom on new messages (only if already at bottom)
  useEffect(() => {
    if (listRef.current && isAtBottom && messages.length > 0) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages.length, isAtBottom])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
    onScrollToBottom?.()
  }, [onScrollToBottom])

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: MessageWithStatus[] }[] = []
    let currentDate = ''
    messages.forEach(message => {
      const date = formatDateDivider(message.createdAt)
      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, messages: [message] })
      } else {
        groups[groups.length - 1].messages.push(message)
      }
    })
    return groups
  }, [messages])

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        {/* Pinned messages section */}
        {pinnedMessages && pinnedMessages.length > 0 && (
          <div className="mb-4 p-3 bg-[var(--color-primary)]/10 rounded-lg border border-[var(--color-primary)]/20">
            <div className="flex items-center gap-2 mb-2">
              <PushpinOutlined className="text-[var(--color-primary)]" />
              <span className="text-sm font-medium text-[var(--color-primary)]">置顶消息</span>
            </div>
            <div className="space-y-2">
              {pinnedMessages.map(message => (
                <div key={message.id} className="flex items-start gap-2 p-2 bg-[var(--color-bg-secondary)] rounded">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-[var(--color-text-normal)]">{message.author.displayName || message.author.name}</span>
                    <p className="text-sm text-[var(--color-text-normal)] truncate">{message.content}</p>
                  </div>
                  <button
                    onClick={() => onUnpin?.(message.id)}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                    title="取消置顶"
                  >
                    取消置顶
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Load more indicator */}
        {(hasMore || isLoadingMore) && (
          <div className="flex justify-center py-2 mb-2">
            {isLoadingMore || isLoading ? (
              <Spin indicator={<LoadingOutlined className="text-[var(--color-primary)]" spin />} />
            ) : (
              <button
                onClick={onLoadMore}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              >
                加载更多消息
              </button>
            )}
          </div>
        )}

        {groupedMessages.map(group => (
          <div key={group.date}>
            <div className="relative my-4">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--color-border)]" />
              <div className="relative flex justify-center"><span className="px-2 bg-[var(--color-bg-base)] text-xs text-[var(--color-text-muted)] font-medium">{group.date}</span></div>
            </div>
            {group.messages.map((message, index) => (
              <MessageItem
                key={`${message.id}-${message._retryId || ''}`}
                message={message}
                isCompact={shouldCompact(message, group.messages[index - 1])}
                onAddReaction={onAddReaction}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onPin={onPin}
                onRetry={onRetry}
                pinnedMessageIds={pinnedMessages?.map(m => m.id)}
                isFirstUnread={firstUnreadMessageId === message.id}
              />
            ))}
          </div>
        ))}
        {messages.length === 0 && !isLoading && (
          <EmptyMessages />
        )}
      </div>

      {/* Unread messages indicator */}
      {unreadCount > 0 && (
        <button
          onClick={onScrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[var(--color-primary)] text-white text-sm font-medium rounded-full shadow-lg hover:opacity-90 transition-opacity flex items-center gap-1 z-10"
        >
          <span>{unreadCount} 条新消息</span>
          <DownOutlined className="text-xs" />
        </button>
      )}

      {/* Scroll to bottom button */}
      {showScrollButton && unreadCount === 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 w-10 h-10 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full shadow-lg hover:bg-[var(--color-bg-tertiary)] transition-colors flex items-center justify-center z-10"
          title="滚动到最新消息"
        >
          <DownOutlined className="text-[var(--color-text-muted)]" />
        </button>
      )}
    </div>
  )
}

function shouldCompact(current: MessageWithStatus, previous?: MessageWithStatus): boolean {
  if (!previous) return false
  if (previous.senderUserId !== current.senderUserId) return false
  const currentTime = new Date(current.createdAt).getTime()
  const prevTime = new Date(previous.createdAt).getTime()
  return currentTime - prevTime < 5 * 60 * 1000
}

// Check if content is a URL (for image/file display)
function isImageUrl(content: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(content) || content.includes('/image/') || content.startsWith('data:image/')
}

// Message content renderer
function MessageContent({ content, attachments }: { content: string; attachments?: Attachment[] }) {
  // If has attachments, show them
  if (attachments && attachments.length > 0) {
    return (
      <div className="space-y-2">
        {content && <MarkdownRenderer content={content} />}
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <AttachmentView key={attachment.id || index} attachment={attachment} />
          ))}
        </div>
      </div>
    )
  }

  // Check if content is an image URL
  if (isImageUrl(content)) {
    return (
      <div className="max-w-md">
        <img
          src={content}
          alt="图片"
          className="rounded-lg max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(content, '_blank')}
          onError={(e) => {
            // If image fails to load, show as text
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }

  // Render as Markdown
  return <MarkdownRenderer content={content} />
}

// Attachment view component
function AttachmentView({ attachment }: { attachment: Attachment }) {
  const { message: messageApi } = App.useApp()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(attachment.url)
    messageApi.success('链接已复制')
  }

  if (attachment.type === 'image') {
    return (
      <div className="max-w-md">
        <img
          src={attachment.url}
          alt={attachment.filename}
          className="rounded-lg max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(attachment.url, '_blank')}
        />
      </div>
    )
  }

  if (attachment.type === 'video') {
    return (
      <div className="max-w-md">
        <video
          src={attachment.url}
          controls
          className="rounded-lg max-h-96"
        />
      </div>
    )
  }

  if (attachment.type === 'audio') {
    return (
      <div className="max-w-md bg-[var(--color-bg-tertiary)] rounded-lg p-3">
        <audio src={attachment.url} controls className="w-full" />
      </div>
    )
  }

  // File attachment
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-tertiary)] rounded-lg max-w-sm hover:bg-[var(--color-bg-darker)] transition-colors cursor-pointer" onClick={handleCopyUrl}>
      <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
        <FileOutlined className="text-xl text-[var(--color-primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-normal)] truncate">{attachment.filename}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(attachment.size)}</p>
      </div>
    </div>
  )
}

interface MessageItemProps {
  message: MessageWithStatus
  isCompact?: boolean
  onAddReaction?: (messageId: string, emoji: string) => void
  onReply?: (message: Message) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
  onPin?: (messageId: string) => void
  onRetry?: (retryId: string) => void
  pinnedMessageIds?: string[]
  isFirstUnread?: boolean
}

function MessageItem({ message, isCompact, onAddReaction, onReply, onEdit, onDelete, onPin, onRetry, pinnedMessageIds, isFirstUnread }: MessageItemProps) {
  const { message: messageApi } = App.useApp()
  const [showReactions, setShowReactions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const timestamp = new Date(message.createdAt).getTime()
  const isPinned = pinnedMessageIds?.includes(String(message.id))
  const isFailed = message._status === 'failed'
  const isSending = message._status === 'sending'
  const isSent = message._status === 'sent'

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(message.content.length, message.content.length)
    }
  }, [isEditing, message.content])

  const handleReaction = (emoji: string) => {
    onAddReaction?.(String(message.id), emoji)
    setShowReactions(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    messageApi.success('已复制到剪贴板')
  }

  const handleReply = () => {
    onReply?.({
      id: String(message.id),
      channelId: String(message.roomId),
      authorId: String(message.senderUserId),
      author: {
        id: String(message.senderUserId),
        name: message.senderName,
        displayName: message.senderName,
        status: 'online',
      },
      content: message.content,
      timestamp,
    })
  }

  const handleEdit = () => {
    setEditContent(message.content)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(String(message.id), editContent.trim())
      messageApi.success('消息已更新')
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(message.content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    onDelete?.(String(message.id))
    setShowDeleteModal(false)
    messageApi.success('消息已删除')
  }

  const handlePin = () => {
    onPin?.(String(message.id))
    messageApi.success(isPinned ? '消息已取消置顶' : '消息已置顶')
  }

  const handleRetry = () => {
    if (message._retryId && onRetry) {
      onRetry(message._retryId)
    }
  }

  const menuItems = [
    { key: 'reply', label: '回复', icon: <ExportOutlined />, onClick: handleReply },
    { key: 'copy', label: '复制', icon: <CopyOutlined />, onClick: handleCopy },
    { key: 'edit', label: '编辑', icon: <EditOutlined />, onClick: handleEdit },
    { key: 'pin', label: isPinned ? '取消置顶' : '置顶', icon: <PushpinOutlined />, onClick: handlePin },
    { type: 'divider' as const },
    { key: 'delete', label: '删除消息', danger: true, icon: <DeleteOutlined />, onClick: handleDelete },
  ]

  const ReactionPicker = (
    <div className="flex gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-lg shadow-lg border border-[var(--color-border)]">
      {QUICK_REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  )

  return (
    <>
      {/* Unread indicator */}
      {isFirstUnread && (
        <div className="relative my-4">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--color-primary)]" />
          <div className="relative flex justify-center">
            <span className="px-2 bg-[var(--color-bg-base)] text-xs text-[var(--color-primary)] font-medium">
              新消息
            </span>
          </div>
        </div>
      )}

      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
        <div
          className={cn(
            "group relative flex gap-4 py-0.5 px-1 hover:bg-[var(--color-bg-darker)] rounded transition-colors",
            isCompact && "mt-0",
            isSent && "animate-pulse-once"
          )}
        >
          {!isCompact ? (
            <Avatar size={40} className="bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 cursor-pointer hover:opacity-80">
              {message.senderName.charAt(0).toUpperCase()}
            </Avatar>
          ) : (
            <Tooltip title={formatFullDateTime(timestamp)} placement="right">
              <div className="w-10 flex-shrink-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-default">
                <span className="text-[10px] text-[var(--color-text-muted)] leading-none">{formatTime(timestamp)}</span>
              </div>
            </Tooltip>
          )}
          <div className="flex-1 min-w-0">
            {!isCompact && (
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-medium text-[var(--color-text-normal)] hover:underline cursor-pointer">{message.senderName}</span>
                <Tooltip title={formatFullDateTime(timestamp)}>
                  <span className="text-xs text-[var(--color-text-muted)] cursor-default">{formatRelativeTime(timestamp)}</span>
                </Tooltip>
              </div>
            )}

            {/* Inline editing */}
            {isEditing ? (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-[var(--color-bg-tertiary)] rounded-lg p-2 text-[var(--color-text-normal)] outline-none resize-none min-h-[60px] border border-[var(--color-primary)]"
                  rows={3}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded hover:opacity-90 flex items-center gap-1"
                  >
                    <CheckOutlined />
                    保存
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-normal)] text-sm rounded hover:bg-[var(--color-bg-darker)]"
                  >
                    取消
                  </button>
                  <span className="text-xs text-[var(--color-text-muted)]">Enter 保存，Esc 取消</span>
                </div>
              </div>
            ) : (
              <>
                <MessageContent content={message.content} />
                {/* Send status indicators */}
                {isSending && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-[var(--color-text-muted)]">
                    <LoadingOutlined className="animate-spin" />
                    <span>发送中...</span>
                  </div>
                )}
                {isFailed && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--color-dnd)]">发送失败</span>
                    <button
                      onClick={handleRetry}
                      className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
                    >
                      <ReloadOutlined />
                      重试
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hover actions */}
          <div className="absolute -top-4 right-4 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded shadow-lg transition-opacity">
            <Popover content={ReactionPicker} trigger="click" open={showReactions} onOpenChange={setShowReactions}>
              <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><SmileOutlined /></button>
            </Popover>
            <button onClick={handleReply} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><ExportOutlined /></button>
            <button onClick={handleCopy} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><CopyOutlined /></button>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><MoreOutlined /></button>
            </Dropdown>
          </div>
        </div>
      </Dropdown>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        title="删除消息"
        onCancel={() => setShowDeleteModal(false)}
        onOk={confirmDelete}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        styles={{ body: { backgroundColor: 'var(--color-bg-secondary)' } }}
      >
        <p className="py-4">确定要删除这条消息吗？此操作无法撤销。</p>
      </Modal>
    </>
  )
}
