import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { Avatar, Dropdown, Popover, App, Spin, Modal, Input } from 'antd'
import { SmileOutlined, EditOutlined, DeleteOutlined, PushpinOutlined, MoreOutlined, CopyOutlined, ExportOutlined, LoadingOutlined, FileOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { EmptyMessages } from '@renderer/components/ui/EmptyState'
import type { Message, Attachment } from '@shared/types/kook'

// Quick reaction emojis
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

interface MessageListProps {
  messages: Message[]
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
}

export function MessageList({ messages, onAddReaction, onLoadMore, hasMore, isLoading, onReply, onEdit, onDelete, onPin, onUnpin, pinnedMessages }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Handle scroll to top for loading more
  const handleScroll = useCallback(() => {
    if (!listRef.current || !onLoadMore || !hasMore || isLoading || isLoadingMore) return

    const { scrollTop } = listRef.current
    if (scrollTop < 100) {
      setIsLoadingMore(true)
      onLoadMore()
      setTimeout(() => setIsLoadingMore(false), 500)
    }
  }, [onLoadMore, hasMore, isLoading, isLoadingMore])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages.length])

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
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
            <MessageItem key={message.id} message={message} isCompact={shouldCompact(message, group.messages[index - 1])} onAddReaction={onAddReaction} onReply={onReply} onEdit={onEdit} onDelete={onDelete} onPin={onPin} pinnedMessageIds={pinnedMessages?.map(m => m.id)} />
          ))}
        </div>
      ))}
      {messages.length === 0 && !isLoading && (
        <EmptyMessages />
      )}
    </div>
  )
}

function shouldCompact(current: Message, previous?: Message): boolean {
  if (!previous) return false
  if (previous.authorId !== current.authorId) return false
  return current.timestamp - previous.timestamp < 5 * 60 * 1000
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
        {content && <p className="text-[var(--color-text-normal)] break-words whitespace-pre-wrap leading-relaxed">{content}</p>}
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

  // Regular text message
  return <p className="text-[var(--color-text-normal)] break-words whitespace-pre-wrap leading-relaxed">{content}</p>
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
  message: Message
  isCompact?: boolean
  onAddReaction?: (messageId: string, emoji: string) => void
  onReply?: (message: Message) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
  onPin?: (messageId: string) => void
  pinnedMessageIds?: string[]
}

function MessageItem({ message, isCompact, onAddReaction, onReply, onEdit, onDelete, onPin, pinnedMessageIds }: MessageItemProps) {
  const { message: messageApi } = App.useApp()
  const [showReactions, setShowReactions] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  const handleReaction = (emoji: string) => {
    onAddReaction?.(message.id, emoji)
    setShowReactions(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    messageApi.success('已复制到剪贴板')
  }

  const handleReply = () => {
    onReply?.(message)
  }

  const handleEdit = () => {
    setEditContent(message.content)
    setShowEditModal(true)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim())
    }
    setShowEditModal(false)
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    onDelete?.(message.id)
    setShowDeleteModal(false)
    messageApi.success('消息已删除')
  }

  const isPinned = pinnedMessageIds?.includes(message.id)

  const handlePin = () => {
    onPin?.(message.id)
    messageApi.success(isPinned ? '消息已取消置顶' : '消息已置顶')
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
      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
        <div className={cn("group relative flex gap-4 py-0.5 px-1 hover:bg-[var(--color-bg-darker)] rounded", isCompact && "mt-0")}>
          {!isCompact ? (
            <Avatar size={40} src={message.author.avatar || undefined} className="bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 cursor-pointer hover:opacity-80">
              {message.author.name.charAt(0).toUpperCase()}
            </Avatar>
          ) : (
            <div className="w-10 flex-shrink-0 flex items-end justify-center opacity-0 group-hover:opacity-100">
              <span className="text-[10px] text-[var(--color-text-muted)] leading-none">{formatTime(message.timestamp)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {!isCompact && (
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-medium text-[var(--color-text-normal)] hover:underline cursor-pointer">{message.author.displayName || message.author.name}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatTime(message.timestamp)}</span>
              </div>
            )}
            <MessageContent content={message.content} attachments={message.attachments} />
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {message.reactions.map(reaction => (
                  <button key={reaction.emoji} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--color-bg-darker)] text-sm hover:bg-[var(--color-bg-tertiary)]">
                    <span>{reaction.emoji}</span>
                    <span className="text-[var(--color-text-muted)]">{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="absolute -top-4 right-4 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded shadow-lg">
            <Popover content={ReactionPicker} trigger="click" open={showReactions} onOpenChange={setShowReactions}>
              <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><SmileOutlined /></button>
            </Popover>
            <button onClick={handleReply} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><ExportOutlined /></button>
            <button onClick={handleCopy} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><CopyOutlined /></button>
            <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><MoreOutlined /></button>
          </div>
        </div>
      </Dropdown>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        title="编辑消息"
        onCancel={() => setShowEditModal(false)}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
        styles={{ body: { backgroundColor: 'var(--color-bg-secondary)' } }}
      >
        <Input.TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="mt-4"
        />
      </Modal>

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
