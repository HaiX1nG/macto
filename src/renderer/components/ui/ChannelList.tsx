import { cn } from '@renderer/utils/cn'
import { Badge } from './Badge'

interface Channel {
  id: string
  name: string
  type: 'voice' | 'video' | 'meeting'
  icon: React.ReactNode
  unread?: number
  participants?: number
}

interface ChannelListProps {
  channels: Channel[]
  activeChannelId?: string
  onChannelClick?: (channel: Channel) => void
  onCreateChannel?: () => void
  className?: string
}

export const ChannelList = ({
  channels,
  activeChannelId,
  onChannelClick,
  onCreateChannel,
  className
}: ChannelListProps) => {
  return (
    <div className={cn(
      'w-64 bg-[var(--color-bg-base)]',
      'flex flex-col border-r border-[var(--color-border)]',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
              'flex items-center justify-center',
              'text-white font-bold text-lg',
              'shadow-lg shadow-[var(--color-primary)]/30'
            )}>
              M
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-normal)]">Macto</h1>
              <p className="text-xs text-[var(--color-text-muted)]">语音 & 屏幕</p>
            </div>
          </div>
          {onCreateChannel && (
            <button
              onClick={onCreateChannel}
              className={cn(
                'w-9 h-9 rounded-xl',
                'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:opacity-80',
                'text-white',
                'transition-all duration-200',
                'shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40',
                'hover:scale-105 active:scale-95'
              )}
            >
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="搜索频道..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5',
              'bg-[var(--color-bg-tertiary)]',
              'border border-transparent',
              'focus:border-[var(--color-primary)]',
              'focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'rounded-xl text-sm',
              'text-[var(--color-text-normal)]',
              'placeholder-[var(--color-text-muted)]',
              'transition-all duration-200',
              'focus:outline-none'
            )}
          />
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {channels.map((channel) => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            isActive={activeChannelId === channel.id}
            onClick={() => onChannelClick?.(channel)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <button className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
          'text-[var(--color-text-muted)]',
          'hover:bg-[var(--color-bg-tertiary)]',
          'hover:text-[var(--color-text-normal)]',
          'transition-all duration-200'
        )}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">设置</span>
        </button>
      </div>
    </div>
  )
}

interface ChannelItemProps {
  channel: Channel
  isActive?: boolean
  onClick?: () => void
}

const ChannelItem = ({ channel, isActive, onClick }: ChannelItemProps) => {
  const typeStyles = {
    voice: {
      active: 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30',
      inactive: 'text-[var(--color-primary)]',
      bg: 'bg-[var(--color-primary)]/10',
    },
    video: {
      active: 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30',
      inactive: 'text-[var(--color-accent)]',
      bg: 'bg-[var(--color-accent)]/10',
    },
    meeting: {
      active: 'bg-[var(--color-online)] text-white shadow-lg shadow-[var(--color-online)]/30',
      inactive: 'text-[var(--color-online)]',
      bg: 'bg-[var(--color-online)]/10',
    },
  }

  const style = typeStyles[channel.type]

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
        'transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        isActive
          ? style.active
          : cn(
              'hover:bg-[var(--color-bg-tertiary)]',
              'text-[var(--color-text-muted)]'
            )
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center',
        isActive ? 'bg-white/20' : style.bg
      )}>
        <span className={cn(
          'text-lg',
          isActive ? 'text-white' : style.inactive
        )}>
          {channel.icon}
        </span>
      </div>
      <span className="flex-1 text-left font-medium truncate">
        {channel.name}
      </span>
      {channel.unread && channel.unread > 0 && (
        <Badge variant="error" size="sm">
          {channel.unread}
        </Badge>
      )}
      {channel.participants !== undefined && channel.participants > 0 && (
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          isActive
            ? 'bg-white/20 text-white'
            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
        )}>
          {channel.participants}
        </span>
      )}
    </button>
  )
}