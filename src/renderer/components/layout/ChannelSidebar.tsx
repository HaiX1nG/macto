import { useState } from 'react'
import { Dropdown } from 'antd'
import { PlusOutlined, SettingOutlined, DownOutlined, NumberOutlined, AudioOutlined, UserOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { UserPanel } from './UserPanel'
import type { Channel } from '@shared/types/kook'

export function ChannelSidebar() {
  const { servers, currentServerId, setCurrentChannel, currentChannelId } = useServerStore()
  const currentServer = servers.find(s => s.id === currentServerId)

  if (!currentServer) return null

  const channels = currentServer.channels
  const categories = channels.filter(c => c.type === 'category')
  const uncategorizedChannels = channels.filter(c => c.type !== 'category' && !c.parentId)

  const getChannelsByCategory = (categoryId: string) =>
    channels.filter(c => c.parentId === categoryId)

  return (
    <div className="w-[240px] bg-[var(--color-bg-secondary)] flex flex-col h-full flex-shrink-0">
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--color-border)] flex-shrink-0">
        <h2 className="font-semibold text-[var(--color-text-normal)] truncate">{currentServer.name}</h2>
        <DownOutlined className="text-[var(--color-text-muted)] text-xs" />
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {uncategorizedChannels.length > 0 && (
          <div className="mb-2">
            {uncategorizedChannels.map(channel => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={currentChannelId === channel.id}
                onClick={() => setCurrentChannel(channel.id)}
              />
            ))}
          </div>
        )}

        {categories.map(category => (
          <ChannelCategory
            key={category.id}
            category={category}
            channels={getChannelsByCategory(category.id)}
            currentChannelId={currentChannelId}
            onChannelClick={setCurrentChannel}
          />
        ))}
      </div>

      {/* User Panel */}
      <UserPanel />
    </div>
  )
}

interface ChannelCategoryProps {
  category: Channel
  channels: Channel[]
  currentChannelId?: string | null
  onChannelClick: (id: string) => void
}

function ChannelCategory({ category, channels, currentChannelId, onChannelClick }: ChannelCategoryProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mb-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide hover:text-[var(--color-text-normal)]"
      >
        <DownOutlined className={cn("text-[10px] transition-transform", collapsed && "-rotate-90")} />
        <span>{category.name}</span>
      </button>

      {!collapsed && channels.map(channel => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          isActive={currentChannelId === channel.id}
          onClick={() => onChannelClick(channel.id)}
        />
      ))}
    </div>
  )
}

interface ChannelItemProps {
  channel: Channel
  isActive?: boolean
  onClick?: () => void
}

function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  const getIcon = () => {
    if (channel.type === 'voice') return <AudioOutlined className="text-lg" />
    return <NumberOutlined className="text-lg" />
  }

  return (
    <Dropdown
      menu={{ items: [{ key: 'mute', label: '静音频道' }, { key: 'settings', label: '频道设置', icon: <SettingOutlined /> }] }}
      trigger={['contextMenu']}
    >
      <button
        onClick={onClick}
        className={cn(
          "w-[calc(100%-16px)] mx-2 flex items-center gap-2 px-2 py-1.5 rounded",
          "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-darker)]",
          "transition-colors group",
          isActive && "bg-[var(--color-bg-darker)] text-[var(--color-text-normal)]"
        )}
      >
        {getIcon()}
        <span className="flex-1 text-left truncate text-sm">{channel.name}</span>
        {channel.unreadCount && channel.unreadCount > 0 && (
          <span className="bg-[var(--color-dnd)] text-white text-xs px-1.5 rounded-full">{channel.unreadCount}</span>
        )}
        <div className="hidden group-hover:flex items-center gap-1">
          <UserOutlined className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]" />
          <SettingOutlined className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]" />
        </div>
      </button>
    </Dropdown>
  )
}
