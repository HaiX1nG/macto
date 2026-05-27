/**
 * EmptyState Component
 *
 * Displays a friendly empty state with icon, title, description, and optional action
 */

import type { ReactNode } from 'react'
import { Button } from 'antd'
import {
  MessageOutlined,
  TeamOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  FolderOutlined,
  SearchOutlined,
  InboxOutlined,
  FileTextOutlined,
  UserOutlined,
  CompassOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  iconType?: 'message' | 'team' | 'audio' | 'video' | 'folder' | 'search' | 'inbox' | 'file' | 'user' | 'compass' | 'bell' | 'custom'
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
    variant?: 'primary' | 'secondary' | 'ghost'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const iconMap: Record<string, ReactNode> = {
  message: <MessageOutlined />,
  team: <TeamOutlined />,
  audio: <AudioOutlined />,
  video: <VideoCameraOutlined />,
  folder: <FolderOutlined />,
  search: <SearchOutlined />,
  inbox: <InboxOutlined />,
  file: <FileTextOutlined />,
  user: <UserOutlined />,
  compass: <CompassOutlined />,
  bell: <BellOutlined />,
  custom: null,
}

export function EmptyState({
  icon,
  iconType = 'custom',
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: 'py-8 px-4',
      iconWrapper: 'w-12 h-12 mb-3',
      icon: 'text-2xl',
      title: 'text-base font-semibold',
      description: 'text-xs',
    },
    md: {
      container: 'py-12 px-6',
      iconWrapper: 'w-16 h-16 mb-4',
      icon: 'text-4xl',
      title: 'text-lg font-semibold',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16 px-8',
      iconWrapper: 'w-16 h-16 mb-5',
      icon: 'text-4xl',
      title: 'text-xl font-semibold',
      description: 'text-base',
    },
  }

  const sizeClasses = sizes[size]

  return (
    <div className={cn('flex flex-col items-center text-center', sizeClasses.container, 'animate-fade-in', className)}>
      {/* Icon */}
      <div className={cn('rounded-2xl bg-[var(--color-bg-darker)] flex items-center justify-center', sizeClasses.iconWrapper)}>
        <span className={cn('text-[var(--color-text-muted)]', sizeClasses.icon)}>
          {icon || iconMap[iconType]}
        </span>
      </div>

      {/* Title */}
      <h3 className={cn('text-[var(--color-text-normal)] mb-2', sizeClasses.title)}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn('text-[var(--color-text-muted)] max-w-sm mb-6 leading-relaxed', sizeClasses.description)}>
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <Button
          type={action.variant === 'primary' ? 'primary' : 'default'}
          icon={action.icon}
          onClick={action.onClick}
          className={cn(
            'rounded-xl font-semibold',
            action.variant === 'ghost' && 'border-none bg-transparent'
          )}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Preset empty states for common use cases
export function EmptyMessages({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      iconType="message"
      title="开始聊天"
      description="发送第一条消息开始对话"
      action={onStartChat ? {
        label: '发送消息',
        onClick: onStartChat,
      } : undefined}
    />
  )
}

export function EmptyMembers() {
  return (
    <EmptyState
      iconType="team"
      title="暂无成员"
      description="邀请好友加入服务器"
      size="sm"
    />
  )
}

export function EmptyServers({ onCreateServer }: { onCreateServer?: () => void }) {
  return (
    <EmptyState
      iconType="folder"
      title="没有服务器"
      description="创建一个服务器或加入朋友的吧"
      action={onCreateServer ? {
        label: '创建服务器',
        onClick: onCreateServer,
        variant: 'primary',
      } : undefined}
    />
  )
}

export function EmptyVoiceChannel({ onJoin }: { onJoin?: () => void }) {
  return (
    <EmptyState
      iconType="audio"
      title="语音频道"
      description="加入语音频道与好友实时交流"
      action={onJoin ? {
        label: '加入语音',
        onClick: onJoin,
        variant: 'primary',
      } : undefined}
    />
  )
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      iconType="search"
      title="未找到结果"
      description={query ? `没有找到与"${query}"相关的内容` : '输入关键词进行搜索'}
      size="sm"
    />
  )
}

export function EmptyNotifications() {
  return (
    <EmptyState
      iconType="bell"
      title="没有新通知"
      description="当有新消息或活动时，这里会显示通知"
      size="sm"
    />
  )
}

export function EmptyFiles() {
  return (
    <EmptyState
      iconType="file"
      title="没有文件"
      description="聊天中分享的文件会显示在这里"
      size="sm"
    />
  )
}

export function NoChannelSelected() {
  return (
    <EmptyState
      icon={
        <svg viewBox="0 0 28 20" className="w-10 h-8" fill="currentColor">
          <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3416 0C8.49087 0.322199 6.68661 0.885653 4.97361 1.68345C1.53179 6.77853 0.559612 11.7417 1.04602 16.6309C3.04912 18.1166 5.31187 19.2137 7.72333 19.8612C8.25832 19.1384 8.73498 18.3699 9.14898 17.5624C8.37544 17.2724 7.62992 16.9089 6.92297 16.4756C7.10261 16.3474 7.27777 16.2131 7.44717 16.0745C11.7197 18.0621 16.3394 18.0621 20.5554 16.0745C20.7248 16.2131 20.8999 16.3474 21.0796 16.4756C20.3714 16.9102 19.6246 17.275 18.8497 17.5637C19.2637 18.3711 19.7403 19.1397 20.2753 19.8625C22.6881 19.2137 24.9508 18.1153 26.954 16.6309C27.5307 10.9745 26.0372 6.05798 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0455 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6811 9.54272 20.6544 10.994C20.6544 12.4453 19.6249 13.6383 18.3161 13.6383Z" />
        </svg>
      }
      title="欢迎使用 Macto"
      description="选择一个服务器和频道开始聊天"
      size="lg"
    />
  )
}

// Typing indicator component
export function TypingIndicator({ users }: { users: string[] }) {
  if (users.length === 0) return null

  const text = users.length === 1
    ? `${users[0]} 正在输入...`
    : users.length === 2
    ? `${users[0]} 和 ${users[1]} 正在输入...`
    : `${users[0]}、${users[1]} 和其他 ${users.length - 2} 人正在输入...`

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-[var(--color-text-muted)] animate-fade-in">
      <div className="typing-indicator">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span>{text}</span>
    </div>
  )
}

export default EmptyState
