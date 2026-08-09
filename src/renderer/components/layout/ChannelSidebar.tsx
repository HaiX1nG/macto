import { useState, useRef, useCallback, useEffect } from 'react'
import { Dropdown } from 'antd'
import { SettingOutlined, DownOutlined, NumberOutlined, AudioOutlined, UserOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { useChannelStore } from '@renderer/stores/channelStore'
import { useUIStore } from '@renderer/stores/uiStore'
import { UserPanel } from './UserPanel'
import type { ChannelTreeNode } from '@shared/types/channel'
import { ChannelType } from '@shared/types/channel'

const CHANNEL_SIDEBAR_MIN_WIDTH = 180
const CHANNEL_SIDEBAR_MAX_WIDTH = 400
const CHANNEL_SIDEBAR_DEFAULT_WIDTH = 240

export function ChannelSidebar() {
  const { currentServer, currentServerId } = useServerStore()
  const { channels, currentChannelId, setCurrentChannel, fetchChannels } = useChannelStore()
  const { setActiveView, setCurrentChannelId: setUIChannelId } = useUIStore()
  const [sidebarWidth, setSidebarWidth] = useState(CHANNEL_SIDEBAR_DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Fetch channels when server changes
  useEffect(() => {
    if (currentServerId) {
      void fetchChannels(currentServerId)
    }
  }, [currentServerId, fetchChannels])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.min(
        CHANNEL_SIDEBAR_MAX_WIDTH,
        Math.max(CHANNEL_SIDEBAR_MIN_WIDTH, e.clientX - 72)
      )
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  if (!currentServerId) return null

  const serverName = currentServer?.name || '服务器'

  // Build a flat list of channels from the tree (non-category channels)
  const allChannels: ChannelTreeNode[] = []
  const renderChannelNode = (node: ChannelTreeNode) => {
    if (node.type === ChannelType.Category) {
      // Category header
      allChannels.push(node)
      if (node.children) {
        node.children.forEach(child => allChannels.push(child as ChannelTreeNode))
      }
    } else {
      allChannels.push(node)
    }
  }
  channels.forEach(renderChannelNode)

  const handleChannelClick = (channel: ChannelTreeNode) => {
    setCurrentChannel(channel)
    setUIChannelId(channel.id)
    if (channel.type === ChannelType.Voice) {
      setActiveView('voice-channel', { channelId: channel.id })
    } else if (channel.type === ChannelType.Text) {
      setActiveView('text-channel', { channelId: channel.id })
    }
  }

  return (
    <div
      className={cn(
        "bg-[var(--color-bg-secondary)] flex flex-col h-full flex-shrink-0",
        "border-r border-[var(--color-border)]",
        "transition-all duration-300 ease-out",
        "will-change-[width]",
        "relative"
      )}
      style={{ width: sidebarWidth }}
    >
      <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--color-border)] flex-shrink-0">
        <h2 className="font-semibold text-[var(--color-text-normal)] truncate">{serverName}</h2>
        <DownOutlined className="text-[var(--color-text-muted)] text-xs" />
      </div>

      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {allChannels.length > 0 && (
          <div className="mb-2">
            {allChannels.map(channel => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={currentChannelId === channel.id}
                isCategory={channel.type === ChannelType.Category}
                onClick={() => handleChannelClick(channel)}
              />
            ))}
          </div>
        )}
      </div>

      <UserPanel />

      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize",
          "transition-colors duration-150 ease-out",
          isResizing
            ? "bg-[var(--color-primary)]"
            : "bg-transparent hover:bg-[var(--color-border)]"
        )}
      />
    </div>
  )
}

interface ChannelItemProps {
  channel: ChannelTreeNode
  isActive?: boolean
  isCategory?: boolean
  onClick?: () => void
}

function ChannelItem({ channel, isActive, isCategory, onClick }: ChannelItemProps) {
  const getIcon = () => {
    if (isCategory) return <DownOutlined className="text-xs" />
    if (channel.type === 2) return <AudioOutlined className="text-lg" />
    return <NumberOutlined className="text-lg" />
  }

  if (isCategory) {
    return (
      <div className="px-2 mt-3 mb-1">
        <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {getIcon()}
          <span className="flex-1 text-left truncate">{channel.name}</span>
        </div>
      </div>
    )
  }

  return (
    <Dropdown
      menu={{ items: [{ key: 'mute', label: '静音频道' }, { key: 'settings', label: '频道设置', icon: <SettingOutlined /> }] }}
      trigger={['contextMenu']}
      styles={{ root: { zIndex: 1500 } }}
    >
      <button
        onClick={onClick}
        className={cn(
          "w-[calc(100%-16px)] mx-2 flex items-center gap-2 px-2 py-1.5 rounded-lg",
          "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]",
          "transition-all duration-150 ease-out active:scale-95 group",
          isActive
            ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
            : "hover:bg-[var(--color-bg-darker)]"
        )}
      >
        {getIcon()}
        <span className="flex-1 text-left truncate text-sm">{channel.name}</span>
        {channel.unreadCount && channel.unreadCount > 0 && (
          <span className="bg-[var(--color-dnd)] text-white text-xs px-1.5 py-0.5 rounded-full font-medium">{channel.unreadCount}</span>
        )}
        <div className="hidden group-hover:flex items-center gap-1">
          <UserOutlined className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] transition-colors duration-150 ease-out" />
          <SettingOutlined className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] transition-colors duration-150 ease-out" />
        </div>
      </button>
    </Dropdown>
  )
}
