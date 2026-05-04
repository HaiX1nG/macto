import { useState } from 'react'
import { UserOutlined, UserAddOutlined } from '@ant-design/icons'
import { ChannelList } from './ChannelList'
import { SubcategoryList } from './SubcategoryList'
import { ChannelControlPanel } from './ChannelControlPanel'
import { cn } from '@renderer/utils/cn'

interface Channel {
  id: string
  name: string
  type: 'voice' | 'video' | 'meeting'
  icon: React.ReactNode
  unread?: number
}

interface Subcategory {
  id: string
  name: string
  type: 'voice' | 'video'
  icon: React.ReactNode
  participants: Participant[]
}

interface Participant {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'busy'
  isMuted?: boolean
  isDeafened?: boolean
}

interface ChannelViewProps {
  channels: Channel[]
  subcategories: Subcategory[]
  activeChannelId?: string
  activeSubcategoryId?: string
  onChannelClick?: (channel: Channel) => void
  onSubcategoryClick?: (subcategory: Subcategory) => void
  onCreateChannel?: () => void
  onCreateSubcategory?: () => void
  onLeaveChannel?: () => void
}

export function ChannelView({
  channels,
  subcategories,
  activeChannelId,
  activeSubcategoryId,
  onChannelClick,
  onSubcategoryClick,
  onCreateChannel,
  onCreateSubcategory,
}: ChannelViewProps) {
  const [searchTerm, _setSearchTerm] = useState('')

  const filteredSubcategories = subcategories.filter(sub =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeSubcategory = subcategories.find(s => s.id === activeSubcategoryId)

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary-light)] dark:bg-[var(--color-bg-dark)] transition-colors duration-300">
      {/* Channel List */}
      <ChannelList
        channels={channels}
        activeChannelId={activeChannelId}
        onChannelClick={onChannelClick}
        onCreateChannel={onCreateChannel}
      />

      {/* Subcategory List */}
      <SubcategoryList
        subcategories={subcategories}
        activeSubcategoryId={activeSubcategoryId}
        onSubcategoryClick={onSubcategoryClick}
        onCreateSubcategory={onCreateSubcategory}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[var(--color-bg-secondary-light)] dark:bg-[var(--color-bg-dark)] transition-colors duration-300">
        {/* Header */}
        <div className={cn(
          'h-16 bg-white dark:bg-[var(--color-bg-dark)]',
          'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
          'flex items-center justify-between px-6',
          'sticky top-0 z-10',
          'transition-colors duration-300'
        )}>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
              {channels.find(c => c.id === activeChannelId)?.name || '频道'}
            </h1>
            {activeSubcategoryId && (
              <span className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold',
                'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
                'text-[var(--color-primary)] dark:text-[var(--color-primary)]'
              )}>
                {activeSubcategory?.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
              {activeSubcategory?.participants.length || 0} 人在线
            </div>
          </div>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 p-6 overflow-y-auto pb-32">
          {filteredSubcategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={cn(
                'w-20 h-20 rounded-2xl',
                'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
                'flex items-center justify-center mb-6'
              )}>
                <UserOutlined className="text-4xl text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-3">
                暂无分区
              </h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-8 max-w-md">
                点击左侧"创建"按钮创建新分区，或搜索其他分区
              </p>
              <button
                onClick={onCreateSubcategory}
                className={cn(
                  'flex items-center gap-2 px-8 py-4 rounded-xl',
                  'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
                  'text-white font-semibold',
                  'transition-all duration-200',
                  'shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40',
                  'hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                <UserAddOutlined />
                创建分区
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSubcategories
                .find(s => s.id === activeSubcategoryId)
                ?.participants.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Control Panel */}
        <ChannelControlPanel />
      </div>
    </div>
  )
}

interface ParticipantCardProps {
  participant: Participant
}

function ParticipantCard({ participant }: ParticipantCardProps) {
  const statusColors = {
    online: 'bg-green-500 shadow-green-500/30',
    away: 'bg-yellow-500 shadow-yellow-500/30',
    busy: 'bg-red-500 shadow-red-500/30',
  }

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-cyan-500 to-blue-600',
    ]
    return gradients[name.charCodeAt(0) % gradients.length]
  }

  return (
    <div className={cn(
      'bg-white dark:bg-[var(--color-bg-tertiary-dark)] rounded-2xl p-6',
      'border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'hover:border-[var(--color-primary)] dark:hover:border-[var(--color-primary)]',
      'hover:shadow-xl hover:-translate-y-1',
      'transition-all duration-300 group'
    )}>
      <div className="flex flex-col items-center gap-5">
        {/* Avatar */}
        <div className="relative">
          <div className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center',
            'text-3xl font-bold text-white shadow-lg',
            getAvatarGradient(participant.name),
            statusColors[participant.status]
          )}>
            {participant.avatar ? (
              <img src={participant.avatar} alt={participant.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              participant.name.charAt(0).toUpperCase()
            )}
          </div>
          {/* Status Indicator */}
          <div className={cn(
            'absolute bottom-1 right-1 w-5 h-5 rounded-full',
            'border-3 border-white dark:border-[#1a1a25]',
            statusColors[participant.status]
          )} />
        </div>

        {/* Name */}
        <div className="text-center w-full">
          <h3 className="text-lg font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
            {participant.name}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mt-1">
            {participant.isMuted ? '静音中' : participant.isDeafened ? '免提中' : '说话中'}
          </p>
        </div>

        {/* Status Badge */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-xl w-full',
          'bg-[var(--color-bg-secondary-light)] dark:bg-[var(--color-bg-secondary-dark)]'
        )}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
            <span className={cn(
              'w-2.5 h-2.5 rounded-full',
              statusColors[participant.status]
            )} />
            <span>
              {participant.status === 'online' ? '在线' :
               participant.status === 'away' ? '离开' : '忙碌'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button className={cn(
            'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
            'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
            'text-white transition-all duration-200',
            'shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40'
          )}>
            语音
          </button>
          <button className={cn(
            'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
            'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
            'hover:bg-[var(--color-border-light)] dark:hover:bg-[var(--color-border-dark)]',
            'text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
            'transition-all duration-200'
          )}>
            视频通话
          </button>
        </div>
      </div>
    </div>
  )
}