import { useRef, useEffect, useMemo } from 'react'
import { Avatar, Dropdown } from 'antd'
import { SmileOutlined, EditOutlined, DeleteOutlined, PushpinOutlined, MoreOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import type { Message } from '@shared/types/kook'

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
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
    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
      {groupedMessages.map(group => (
        <div key={group.date}>
          <div className="relative my-4">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--color-border)]" />
            <div className="relative flex justify-center"><span className="px-2 bg-[var(--color-bg-base)] text-xs text-[var(--color-text-muted)] font-medium">{group.date}</span></div>
          </div>
          {group.messages.map((message, index) => (
            <MessageItem key={message.id} message={message} isCompact={shouldCompact(message, group.messages[index - 1])} />
          ))}
        </div>
      ))}
      {messages.length === 0 && (
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
}

function MessageItem({ message, isCompact }: MessageItemProps) {
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <Dropdown menu={{ items: [{ key: 'reply', label: '回复' }, { key: 'edit', label: '编辑', icon: <EditOutlined /> }, { key: 'pin', label: '置顶', icon: <PushpinOutlined /> }, { type: 'divider' as const }, { key: 'delete', label: '删除消息', danger: true, icon: <DeleteOutlined /> }] }} trigger={['contextMenu']}>
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
          <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><SmileOutlined /></button>
          <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><EditOutlined /></button>
          <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"><MoreOutlined /></button>
        </div>
      </div>
    </Dropdown>
  )
}
