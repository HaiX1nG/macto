import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { Avatar, Dropdown, Popover, App, Spin, Modal, Input } from 'antd'
import { SmileOutlined, EditOutlined, DeleteOutlined, PushpinOutlined, MoreOutlined, CopyOutlined, ExportOutlined, LoadingOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import type { Message } from '@shared/types/kook'

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
}

export function MessageList({ messages, onAddReaction, onLoadMore, hasMore, isLoading, onReply, onEdit, onDelete }: MessageListProps) {
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
            <MessageItem key={message.id} message={message} isCompact={shouldCompact(message, group.messages[index - 1])} onAddReaction={onAddReaction} onReply={onReply} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      ))}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg-darker)] flex items-center justify-center mb-4"><span className="text-2xl">💬</span></div>
          <h3 className="text-lg font-semibold text-[var(--color-text-normal)] mb-2">开始聊天</h3>
          <p className="text-[var(--color-text-muted)]">发送第一条消息开始对话</p>
        </div>
      )}
    </div>
  )
}

function shouldCompact(current: Message, previous?: Message): boolean {
  if (!previous) return false
  if (previous.authorId !== current.authorId) return false
  return current.timestamp - previous.timestamp < 5 * 60 * 1000
}

interface MessageItemProps {
  message: Message
  isCompact?: boolean
  onAddReaction?: (messageId: string, emoji: string) => void
  onReply?: (message: Message) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
}

function MessageItem({ message, isCompact, onAddReaction, onReply, onEdit, onDelete }: MessageItemProps) {
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

  const handlePin = () => {
    messageApi.info('置顶功能开发中')
  }

  const menuItems = [
    { key: 'reply', label: '回复', icon: <ExportOutlined />, onClick: handleReply },
    { key: 'copy', label: '复制', icon: <CopyOutlined />, onClick: handleCopy },
    { key: 'edit', label: '编辑', icon: <EditOutlined />, onClick: handleEdit },
    { key: 'pin', label: '置顶', icon: <PushpinOutlined />, onClick: handlePin },
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
            <p className="text-[var(--color-text-normal)] break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
