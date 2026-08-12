import type { ReactNode } from 'react'
import { useMemo, memo } from 'react'
import {
  AudioOutlined,
  MessageOutlined,
  TeamOutlined,
  PlusOutlined,
  LinkOutlined,
  EnterOutlined,
} from '@ant-design/icons'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { useUIStore } from '@renderer/stores/uiStore'
import { ChannelType } from '@shared/types/channel'
import type { ChannelType as ChannelTypeValue } from '@shared/types/channel'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

/**
 * HomePage - KOOK 风格服务器首页。
 *
 * 无选中服务器(currentServer)时保持空态；有 currentServer 时展示
 * 服务器信息、统计、快捷操作与频道入口列表。
 */
export function HomePage(_props: ViewPageProps): ReactNode {
  const currentServer = useServerStore((s) => s.currentServer)
  const members = useServerStore((s) => s.members)
  const setActiveView = useUIStore((s) => s.setActiveView)
  const setCurrentChannelId = useUIStore((s) => s.setCurrentChannelId)

  // 统计与频道分组（均为派生值，memo 化）
  const { textChannels, voiceChannels } = useMemo(() => {
    const channels = currentServer?.channels ?? []
    return {
      textChannels: channels.filter((c) => c.type === ChannelType.Text),
      voiceChannels: channels.filter((c) => c.type === ChannelType.Voice),
    }
  }, [currentServer])

  const memberCount = currentServer?.memberCount ?? members.length

  if (!currentServer) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <NoChannelSelected />
      </div>
    )
  }

  const firstVoiceChannel = voiceChannels[0]

  const navigateToChannel = (channelId: number, type: ChannelTypeValue) => {
    setCurrentChannelId(channelId)
    if (type === ChannelType.Voice) {
      setActiveView('voice-channel', { channelId })
    } else {
      setActiveView('text-channel', { channelId })
    }
  }

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-[var(--color-bg-base)]">
      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* 服务器头部 */}
        <section className="flex items-center gap-4">
          <ServerAvatar name={currentServer.name} iconUrl={currentServer.iconUrl} />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--color-text-normal)] truncate">{currentServer.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)] truncate">
              {currentServer.description || '欢迎来到本服务器'}
            </p>
          </div>
        </section>

        {/* 统计行 */}
        <section className="grid grid-cols-3 gap-4">
          <StatCard icon={<TeamOutlined />} label="成员" value={memberCount} />
          <StatCard icon={<MessageOutlined />} label="文字频道" value={textChannels.length} />
          <StatCard icon={<AudioOutlined />} label="语音频道" value={voiceChannels.length} />
        </section>

        {/* 快捷操作卡片 */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-normal)] mb-3">快捷操作</h2>
          <div className="grid grid-cols-3 gap-4">
            <QuickActionCard
              icon={<EnterOutlined />}
              title="加入语音"
              description={firstVoiceChannel?.name ?? '暂无语音频道'}
              disabled={!firstVoiceChannel}
              onClick={() => firstVoiceChannel && navigateToChannel(firstVoiceChannel.id, ChannelType.Voice)}
            />
            <QuickActionCard
              icon={<PlusOutlined />}
              title="创建频道"
              description="新建文字或语音频道"
              disabled
            />
            <QuickActionCard
              icon={<LinkOutlined />}
              title="邀请好友"
              description="分享邀请链接"
              disabled
            />
          </div>
        </section>

        {/* 频道快捷入口 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-normal)]">频道</h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              共 {textChannels.length + voiceChannels.length} 个频道
            </span>
          </div>
          {textChannels.length + voiceChannels.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">该服务器还没有频道</p>
          ) : (
            <div className="flex flex-col gap-1">
              {textChannels.map((c) => (
                <ChannelEntry
                  key={c.id}
                  name={c.name}
                  type={ChannelType.Text}
                  onClick={() => navigateToChannel(c.id, ChannelType.Text)}
                />
              ))}
              {voiceChannels.map((c) => (
                <ChannelEntry
                  key={c.id}
                  name={c.name}
                  type={ChannelType.Voice}
                  onClick={() => navigateToChannel(c.id, ChannelType.Voice)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// ==================== 内部小组件 ====================

/** 服务器大图标：无 iconUrl 时显示首字符 */
const ServerAvatar = memo(function ServerAvatar({ name, iconUrl }: { name: string; iconUrl: string }) {
  return iconUrl ? (
    <img
      src={iconUrl}
      alt={name}
      className="w-16 h-16 rounded-2xl object-cover bg-[var(--color-bg-darker)] flex-shrink-0"
    />
  ) : (
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-2xl font-bold flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  )
})

interface StatCardProps {
  icon: ReactNode
  label: string
  value: number
}

const StatCard = memo(function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
      <span className="text-[var(--color-text-muted)] text-xl">{icon}</span>
      <div className="min-w-0">
        <div className="text-xl font-bold text-[var(--color-text-normal)] leading-tight">{value}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      </div>
    </div>
  )
})

interface QuickActionCardProps {
  icon: ReactNode
  title: string
  description: string
  disabled?: boolean
  onClick?: () => void
}

const QuickActionCard = memo(function QuickActionCard({
  icon,
  title,
  description,
  disabled,
  onClick,
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-1 p-4 rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-bg-secondary)] text-left transition-all duration-150',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-[var(--color-bg-tertiary)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30',
      )}
    >
      <span className="text-[var(--color-primary)] text-lg mb-1">{icon}</span>
      <span className="text-sm font-semibold text-[var(--color-text-normal)]">{title}</span>
      <span className="text-xs text-[var(--color-text-muted)] truncate w-full">{description}</span>
    </button>
  )
})

interface ChannelEntryProps {
  name: string
  type: ChannelTypeValue
  onClick: () => void
}

const ChannelEntry = memo(function ChannelEntry({ name, type, onClick }: ChannelEntryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-normal)] transition-colors"
    >
      {type === ChannelType.Voice ? (
        <AudioOutlined className="text-[var(--color-text-muted)]" />
      ) : (
        <MessageOutlined className="text-[var(--color-text-muted)]" />
      )}
      <span className="text-sm truncate">{name}</span>
    </button>
  )
})

export default HomePage
