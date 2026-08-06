/**
 * @deprecated 此组件已在页面结构重塑（Phase 1A-1D）中弃用。
 * 由 src/renderer/components/layout/ChannelSidebar 替代。
 * 后续清理阶段将删除此文件，请勿在新代码中引用。
 */
import { useState } from 'react'
import { cn } from '@renderer/utils/cn'
import { TeamOutlined, VideoCameraOutlined, AudioOutlined, SettingOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'

interface Channel {
  id: string
  name: string
  type: 'voice' | 'video' | 'meeting'
  icon: React.ReactNode
  unread?: number
}

interface ChannelListProps {
  channels: Channel[]
  activeChannelId?: string
  onChannelClick?: (channel: Channel) => void
  onCreateChannel?: () => void
}

export function ChannelList({ channels, activeChannelId, onChannelClick, onCreateChannel }: ChannelListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<{ voice: boolean, video: boolean, meeting: boolean }>({
    voice: true,
    video: true,
    meeting: true,
  })

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const voiceChannels = filteredChannels.filter(c => c.type === 'voice')
  const videoChannels = filteredChannels.filter(c => c.type === 'video')
  const meetingChannels = filteredChannels.filter(c => c.type === 'meeting')

  const toggleCategory = (category: 'voice' | 'video' | 'meeting') => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  return (
    <div className={cn(
      'w-64 bg-[var(--color-bg-secondary)]',
      'flex flex-col border-r border-[var(--color-border)]',
      'transition-colors duration-150'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-lg',
              'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
              'flex items-center justify-center',
              'text-white font-bold text-sm',
              'shadow-md'
            )}>
              M
            </div>
            <h1 className="text-lg font-bold text-[var(--color-text-normal)]">Macto</h1>
          </div>
          <button
            onClick={onCreateChannel}
            className={cn(
              'p-2 rounded-xl',
              'bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] active:bg-[var(--color-accent)]',
              'text-white transition-all duration-150',
              'hover:scale-105 active:scale-95'
            )}
          >
            <PlusOutlined />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-4 h-4" />
          <input
            type="text"
            placeholder="搜索频道..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2.5',
              'bg-[var(--color-bg-tertiary)]',
              'border border-transparent',
              'focus:border-[var(--color-primary)]',
              'focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'rounded-xl text-sm',
              'text-[var(--color-text-normal)]',
              'placeholder:text-[var(--color-text-muted)]',
              'transition-all duration-150',
              'focus:outline-none'
            )}
          />
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {/* Voice Channels */}
        {voiceChannels.length > 0 && (
          <ChannelCategory
            title="语音频道"
            icon={<AudioOutlined />}
            expanded={expandedCategories.voice}
            onToggle={() => toggleCategory('voice')}
          >
            {voiceChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={activeChannelId === channel.id}
                onClick={() => onChannelClick?.(channel)}
                variant="primary"
              />
            ))}
          </ChannelCategory>
        )}

        {/* Video Channels */}
        {videoChannels.length > 0 && (
          <ChannelCategory
            title="视频频道"
            icon={<VideoCameraOutlined />}
            expanded={expandedCategories.video}
            onToggle={() => toggleCategory('video')}
          >
            {videoChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={activeChannelId === channel.id}
                onClick={() => onChannelClick?.(channel)}
                variant="accent"
              />
            ))}
          </ChannelCategory>
        )}

        {/* Meeting Channels */}
        {meetingChannels.length > 0 && (
          <ChannelCategory
            title="会议"
            icon={<TeamOutlined />}
            expanded={expandedCategories.meeting}
            onToggle={() => toggleCategory('meeting')}
          >
            {meetingChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={activeChannelId === channel.id}
                onClick={() => onChannelClick?.(channel)}
                variant="success"
              />
            ))}
          </ChannelCategory>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <button className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
          'text-[var(--color-text-muted)]',
          'hover:bg-[var(--color-bg-tertiary)]',
          'hover:text-[var(--color-text-normal)]',
          'transition-all duration-150'
        )}>
          <SettingOutlined className="text-lg" />
          <span className="font-medium">设置</span>
        </button>
      </div>
    </div>
  )
}

interface ChannelCategoryProps {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function ChannelCategory({ title, icon, expanded, onToggle, children }: ChannelCategoryProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5',
          'text-xs font-semibold text-[var(--color-text-muted)]',
          'uppercase tracking-wider',
          'hover:bg-[var(--color-bg-tertiary)]',
          'rounded-xl transition-colors duration-150'
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          {title}
        </span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform duration-150',
            expanded && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="space-y-1 pl-1 mt-1">
          {children}
        </div>
      )}
    </div>
  )
}

interface ChannelItemProps {
  channel: Channel
  isActive?: boolean
  onClick?: () => void
  variant?: 'primary' | 'accent' | 'success'
}

function ChannelItem({ channel, isActive, onClick, variant = 'primary' }: ChannelItemProps) {
  const variants = {
    primary: {
      active: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
      icon: 'text-[var(--color-primary)]',
    },
    accent: {
      active: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
      icon: 'text-[var(--color-accent)]',
    },
    success: {
      active: 'bg-[var(--color-online)]/15 text-[var(--color-online)]',
      icon: 'text-[var(--color-online)]',
    },
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
        'transition-all duration-150',
        'hover:scale-[1.01] active:scale-[0.99]',
        isActive
          ? variants[variant].active
          : cn(
              'hover:bg-[var(--color-bg-tertiary)]',
              'text-[var(--color-text-normal)]'
            )
      )}
    >
      <span className={cn(
        'text-lg',
        isActive ? '' : variants[variant].icon
      )}>
        {channel.icon}
      </span>
      <span className="flex-1 text-left font-medium truncate">
        {channel.name}
      </span>
      {channel.unread && channel.unread > 0 && (
        <span className={cn(
          'min-w-[20px] h-5 px-1.5 rounded-full',
          'bg-[var(--color-dnd)] text-white text-xs font-bold',
          'flex items-center justify-center'
        )}>
          {channel.unread}
        </span>
      )}
    </button>
  )
}