/**
 * EmptyState Component
 *
 * A unified empty state component supporting multiple scenarios
 * with customizable icon, title, description, and action button.
 * Includes Framer Motion animations for smooth entry/exit.
 */

import React from 'react'
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
  CommentOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { cn } from '@renderer/utils/cn'

// =============================================================================
// Types & Interfaces
// =============================================================================

/** Supported icon types for preset empty states */
export type EmptyStateIconType =
  | 'message'
  | 'team'
  | 'audio'
  | 'video'
  | 'folder'
  | 'search'
  | 'inbox'
  | 'file'
  | 'user'
  | 'compass'
  | 'bell'
  | 'comment'
  | 'custom'

/** Size variants for the empty state component */
export type EmptyStateSize = 'sm' | 'md' | 'lg'

/** Action button configuration */
export interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

/** Props for the EmptyState component */
export interface EmptyStateProps {
  /** Custom icon element (overrides iconType) */
  icon?: React.ReactNode
  /** Preset icon type */
  iconType?: EmptyStateIconType
  /** Title of the empty state */
  title: string
  /** Optional description text */
  description?: string
  /** Optional action button configuration */
  action?: EmptyStateAction
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: EmptyStateSize
  /** Whether to animate the component on mount */
  animated?: boolean
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

const iconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

// =============================================================================
// Icon Mapping
// =============================================================================

const iconMap: Record<EmptyStateIconType, React.ReactNode> = {
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
  comment: <CommentOutlined />,
  custom: null,
}

// =============================================================================
// Size Configuration
// =============================================================================

interface SizeConfig {
  container: string
  iconWrapper: string
  icon: string
  title: string
  description: string
  button: string
}

const sizeConfig: Record<EmptyStateSize, SizeConfig> = {
  sm: {
    container: 'py-8 px-4',
    iconWrapper: 'w-12 h-12 mb-3',
    icon: 'text-2xl',
    title: 'text-base font-semibold',
    description: 'text-xs',
    button: 'text-sm px-4 py-1.5',
  },
  md: {
    container: 'py-12 px-6',
    iconWrapper: 'w-16 h-16 mb-4',
    icon: 'text-3xl',
    title: 'text-lg font-semibold',
    description: 'text-sm',
    button: 'text-sm px-5 py-2',
  },
  lg: {
    container: 'py-16 px-8',
    iconWrapper: 'w-20 h-20 mb-5',
    icon: 'text-4xl',
    title: 'text-xl font-bold',
    description: 'text-base',
    button: 'text-base px-6 py-2.5',
  },
}

// =============================================================================
// Component
// =============================================================================

/**
 * EmptyState Component
 *
 * A reusable empty state component for various scenarios.
 * Supports preset icons, custom icons, action buttons, and animations.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   iconType="search"
 *   title="没有找到结果"
 *   description="尝试使用不同的关键词搜索"
 *   action={{ label: '清除搜索', onClick: handleClear }}
 * />
 * ```
 */
export function EmptyState({
  icon,
  iconType = 'custom',
  title,
  description,
  action,
  className,
  size = 'md',
  animated = true,
}: EmptyStateProps) {
  const sizes = sizeConfig[size]

  const content = (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        sizes.container,
        'max-w-md mx-auto',
        className
      )}
    >
      {/* Icon */}
      {(icon || iconMap[iconType]) && (
        <motion.div
          variants={iconVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            'rounded-2xl bg-[var(--color-bg-darker)] flex items-center justify-center',
            sizes.iconWrapper
          )}
        >
          <span className={cn('text-[var(--color-text-muted)]', sizes.icon)}>
            {icon || iconMap[iconType]}
          </span>
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className={cn('text-[var(--color-text-normal)] mb-2', sizes.title)}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            'text-[var(--color-text-muted)] max-w-sm mb-6 leading-relaxed',
            sizes.description
          )}
        >
          {description}
        </motion.p>
      )}

      {/* Action Button */}
      {action && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Button
            type={action.variant === 'primary' ? 'primary' : 'default'}
            icon={action.icon}
            onClick={action.onClick}
            className={cn(
              'rounded-xl font-semibold transition-all duration-200',
              sizes.button,
              action.variant === 'ghost' && 'border-none bg-transparent text-[var(--color-primary)] hover:text-[var(--color-primary)]/80',
              action.variant === 'secondary' && 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)] hover:bg-[var(--color-bg-darker)]'
            )}
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {content}
      </motion.div>
    )
  }

  return content
}

// =============================================================================
// Preset Empty State Components
// =============================================================================

/** Empty state for when there are no messages in a channel */
export function EmptyMessages({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      iconType="message"
      title="开始聊天"
      description="发送第一条消息开始对话"
      action={
        onStartChat
          ? {
              label: '发送消息',
              onClick: onStartChat,
              variant: 'primary',
            }
          : undefined
      }
    />
  )
}

/** Empty state for when there are no members in a server */
export function EmptyMembers({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      iconType="team"
      title="暂无成员"
      description="邀请好友加入服务器"
      size="sm"
      action={
        onInvite
          ? {
              label: '邀请好友',
              onClick: onInvite,
              icon: <PlusOutlined />,
              variant: 'primary',
            }
          : undefined
      }
    />
  )
}

/** Empty state for when there are no servers */
export function EmptyServers({ onCreateServer }: { onCreateServer?: () => void }) {
  return (
    <EmptyState
      iconType="folder"
      title="没有服务器"
      description="创建一个服务器或加入朋友的吧"
      action={
        onCreateServer
          ? {
              label: '创建服务器',
              onClick: onCreateServer,
              icon: <PlusOutlined />,
              variant: 'primary',
            }
          : undefined
      }
    />
  )
}

/** Empty state for when a voice channel is empty */
export function EmptyVoiceChannel({ onJoin }: { onJoin?: () => void }) {
  return (
    <EmptyState
      iconType="audio"
      title="语音频道"
      description="加入语音频道与好友实时交流"
      action={
        onJoin
          ? {
              label: '加入语音',
              onClick: onJoin,
              variant: 'primary',
            }
          : undefined
      }
    />
  )
}

/** Empty state for when search returns no results */
export function EmptySearchResults({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      iconType="search"
      title="未找到结果"
      description={query ? `没有找到与"${query}"相关的内容` : '输入关键词进行搜索'}
      size="sm"
      action={
        onClear
          ? {
              label: '清除搜索',
              onClick: onClear,
              variant: 'ghost',
            }
          : undefined
      }
    />
  )
}

/** Empty state for when there are no notifications */
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

/** Empty state for when there are no files */
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

/** Empty state for when there are no channels selected */
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

/** Empty state for a general error with retry option */
export function EmptyError({
  title = '出错了',
  description = '发生了一个错误，请重试',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      iconType="comment"
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: '重试',
              onClick: onRetry,
              icon: <ReloadOutlined />,
              variant: 'primary',
            }
          : undefined
      }
    />
  )
}

/** Empty state for offline/no connection */
export function EmptyOffline({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      iconType="compass"
      title="连接已断开"
      description="请检查您的网络连接，然后重试"
      action={
        onRetry
          ? {
              label: '重新连接',
              onClick: onRetry,
              icon: <ReloadOutlined />,
              variant: 'primary',
            }
          : undefined
      }
    />
  )
}

// =============================================================================
// Export
// =============================================================================

export default EmptyState
