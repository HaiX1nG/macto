/**
 * @deprecated 此组件已在页面结构重塑（Phase 1A-1D）中弃用。
 * 由 src/renderer/pages/ChannelPage + NavigationShell 替代。
 * 后续清理阶段将删除此文件，请勿在新代码中引用。
 */
import { useState } from 'react'
import { UserAddOutlined } from '@ant-design/icons'
import { ChannelList } from './ChannelList'
import { SubcategoryList } from './SubcategoryList'
import { ChannelControlPanel } from './ChannelControlPanel'
import { cn } from '@renderer/utils/cn'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { Skeleton, SkeletonAvatar } from '@renderer/components/ui/Skeleton'
import { getAvatarGradient, getAvatarInitial, isValidAvatarUrl } from '@renderer/utils/avatar'
import { statusColorMap, getStatusLabel } from '@renderer/utils/status'
import type { ChannelParticipant } from '@shared/types/participant'

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
  participants: ChannelParticipant[]
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
  loading?: boolean
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
  loading = false,
}: ChannelViewProps) {
  const [searchTerm, _setSearchTerm] = useState('')

  const filteredSubcategories = subcategories.filter(sub =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeSubcategory = subcategories.find(s => s.id === activeSubcategoryId)

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary)] animate-fade-in will-change-[opacity]">
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
      <div className="flex-1 flex flex-col bg-[var(--color-bg-secondary)] transition-colors duration-200">
        {/* Header */}
        <div className={cn(
          'h-[var(--header-height)] bg-[var(--color-bg-base)]',
          'border-b border-[var(--color-border)]',
          'flex items-center justify-between px-6',
          'sticky top-0 z-10',
          'transition-colors duration-200'
        )}>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--color-text-normal)]">
              {channels.find(c => c.id === activeChannelId)?.name || '频道'}
            </h1>
            {activeSubcategoryId && (
              <span className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold',
                'bg-[var(--color-primary)]/10',
                'text-[var(--color-primary)]'
              )}>
                {activeSubcategory?.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-[var(--color-text-muted)]">
              {activeSubcategory?.participants.length || 0} 人在线
            </div>
          </div>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 p-6 overflow-y-auto pb-32">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-6 bg-[var(--color-bg-base)] border border-[var(--color-border)]">
                  <div className="flex flex-col items-center gap-4">
                    <SkeletonAvatar size={96} />
                    <Skeleton variant="rect" width="75%" height={18} />
                    <Skeleton variant="text" width="50%" height={14} />
                    <div className="w-full mt-2">
                      <Skeleton variant="rect" width="100%" height={40} className="rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSubcategories.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                iconType="team"
                title="暂无分区"
                description={'点击左侧"创建"按钮创建新分区，或搜索其他分区'}
                action={{
                  label: '创建分区',
                  onClick: onCreateSubcategory || (() => {}),
                  icon: <UserAddOutlined />,
                  variant: 'primary',
                }}
              />
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
  participant: ChannelParticipant
}

function ParticipantCard({ participant }: ParticipantCardProps) {
  return (
    <div className={cn(
      'bg-[var(--color-bg-base)] rounded-2xl p-6',
      'border border-[var(--color-border)]',
      'hover:border-[var(--color-primary)]',
      'hover:shadow-xl hover:-translate-y-1',
      'transition-[transform,box-shadow,border-color] duration-200 group'
    )}>
      <div className="flex flex-col items-center gap-5">
        {/* Avatar */}
        <div className="relative">
          <div className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center',
            'text-3xl font-bold text-white shadow-lg',
            getAvatarGradient(participant.name)
          )}>
            {isValidAvatarUrl(participant.avatar) ? (
              <img src={participant.avatar} alt={participant.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getAvatarInitial(participant.name)
            )}
          </div>
          {/* Status Indicator */}
          <div className={cn(
            'absolute bottom-1 right-1 w-5 h-5 rounded-full',
            'border-3 border-[var(--color-bg-base)]',
            statusColorMap[participant.status]
          )} />
        </div>

        {/* Name */}
        <div className="text-center w-full">
          <h3 className="text-lg font-semibold text-[var(--color-text-normal)]">
            {participant.name}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {participant.isMuted ? '静音中' : participant.isDeafened ? '免提中' : '说话中'}
          </p>
        </div>

        {/* Status Badge */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-xl w-full',
          'bg-[var(--color-bg-secondary)]'
        )}>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className={cn(
              'w-2.5 h-2.5 rounded-full',
              statusColorMap[participant.status]
            )} />
            <span>
              {getStatusLabel(participant.status)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button className={cn(
            'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
            'bg-[var(--color-primary)] hover:opacity-90',
            'text-white transition-[opacity] duration-150',
            'shadow-lg shadow-[var(--color-primary)]/30'
          )}>
            语音
          </button>
          <button className={cn(
            'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
            'bg-[var(--color-bg-tertiary)]',
            'hover:bg-[var(--color-border)]',
            'text-[var(--color-text-normal)]',
            'transition-[background-color,color] duration-150'
          )}>
            视频通话
          </button>
        </div>
      </div>
    </div>
  )
}
