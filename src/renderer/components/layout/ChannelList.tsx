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
      'w-64 bg-white dark:bg-[var(--color-bg-dark)]',
      'flex flex-col border-r border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'transition-colors duration-300'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-lg',
              'bg-gradient-to-br from-[var(--color-primary)] to-purple-600',
              'flex items-center justify-center',
              'text-white font-bold text-sm',
              'shadow-lg shadow-[var(--color-primary)]/30'
            )}>
              M
            </div>
            <h1 className="text-lg font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">Macto</h1>
          </div>
          <button
            onClick={onCreateChannel}
            className={cn(
              'p-2 rounded-xl',
              'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
              'text-white transition-all duration-200',
              'shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40',
              'hover:scale-105 active:scale-95'
            )}
          >
            <PlusOutlined />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)] w-4 h-4" />
          <input
            type="text"
            placeholder="搜索频道..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2.5',
              'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
              'border border-transparent',
              'focus:border-[var(--color-primary)] dark:focus:border-[var(--color-primary)]',
              'focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'rounded-xl text-sm',
              'text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
              'placeholder:text-[var(--color-text-tertiary-light)] dark:placeholder:text-[var(--color-text-tertiary-dark)]',
              'transition-all duration-200',
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
                variant="blue"
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
                variant="purple"
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
                variant="green"
              />
            ))}
          </ChannelCategory>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
        <button className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
          'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
          'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
          'hover:text-[var(--color-text-light)] dark:hover:text-[var(--color-text-dark)]',
          'transition-all duration-200'
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
          'text-xs font-semibold text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
          'uppercase tracking-wider',
          'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
          'rounded-xl transition-colors'
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          {title}
        </span>
        <svg
          className={cn(
            'w-4 h-4 transition-transform duration-200',
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
  variant?: 'blue' | 'purple' | 'green'
}

function ChannelItem({ channel, isActive, onClick, variant = 'blue' }: ChannelItemProps) {
  const variants = {
    blue: {
      active: 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30',
      icon: 'text-[var(--color-primary)] dark:text-[var(--color-primary)]',
    },
    purple: {
      active: 'bg-purple-600 text-white shadow-lg shadow-purple-600/30',
      icon: 'text-purple-500 dark:text-purple-400',
    },
    green: {
      active: 'bg-[var(--color-success)] text-white shadow-lg shadow-[var(--color-success)]/30',
      icon: 'text-[var(--color-success)] dark:text-[var(--color-success)]',
    },
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
        'transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        isActive
          ? variants[variant].active
          : cn(
              'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
              'text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]'
            )
      )}
    >
      <span className={cn(
        'text-lg',
        isActive ? 'text-white' : variants[variant].icon
      )}>
        {channel.icon}
      </span>
      <span className="flex-1 text-left font-medium truncate">
        {channel.name}
      </span>
      {channel.unread && channel.unread > 0 && (
        <span className={cn(
          'min-w-[20px] h-5 px-1.5 rounded-full',
          'bg-[var(--color-error)] text-white text-xs font-bold',
          'flex items-center justify-center'
        )}>
          {channel.unread}
        </span>
      )}
    </button>
  )
}