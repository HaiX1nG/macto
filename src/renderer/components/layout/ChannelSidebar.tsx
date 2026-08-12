import { useState, useRef, useCallback, useEffect } from 'react'
import { Dropdown, Tooltip, App } from 'antd'
import {
  SettingOutlined,
  DownOutlined,
  NumberOutlined,
  AudioOutlined,
  UserOutlined,
  DeleteOutlined,
  SoundOutlined,
  SoundFilled,
} from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { useChannelStore } from '@renderer/stores/channelStore'
import { useUIStore } from '@renderer/stores/uiStore'
import { Modal } from '@renderer/components/ui/Modal'
import { UserPanel } from './UserPanel'
import type { ChannelTreeNode } from '@shared/types/channel'
import { ChannelType } from '@shared/types/channel'

const CHANNEL_SIDEBAR_MIN_WIDTH = 180
const CHANNEL_SIDEBAR_MAX_WIDTH = 400
const CHANNEL_SIDEBAR_DEFAULT_WIDTH = 240

export function ChannelSidebar() {
  const { message: messageApi } = App.useApp()
  const { currentServer, currentServerId } = useServerStore()
  const {
    channels,
    currentChannelId,
    setCurrentChannel,
    fetchChannels,
    updateChannel,
    deleteChannel,
  } = useChannelStore()
  const { setActiveView, setCurrentChannelId: setUIChannelId } = useUIStore()
  const [sidebarWidth, setSidebarWidth] = useState(CHANNEL_SIDEBAR_DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Locally-muted channels (Set<channelId>). UI-only mute indicator.
  const [mutedChannelIds, setMutedChannelIds] = useState<Set<number>>(() => {
    const raw = localStorage.getItem('macto-muted-channels')
    if (!raw) return new Set<number>()
    try {
      return new Set<number>(JSON.parse(raw) as number[])
    } catch {
      return new Set<number>()
    }
  })

  // Channel settings modal state
  const [editingChannel, setEditingChannel] = useState<ChannelTreeNode | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const persistMuted = useCallback((next: Set<number>) => {
    setMutedChannelIds(next)
    localStorage.setItem('macto-muted-channels', JSON.stringify(Array.from(next)))
  }, [])

  const handleToggleMute = useCallback(
    (channel: ChannelTreeNode) => {
      const next = new Set(mutedChannelIds)
      if (next.has(channel.id)) next.delete(channel.id)
      else next.add(channel.id)
      persistMuted(next)
    },
    [mutedChannelIds, persistMuted]
  )

  const handleOpenSettings = useCallback(
    (channel: ChannelTreeNode) => {
      setEditingChannel(channel)
      setName(channel.name)
      setTopic(channel.topic)
      setSettingsOpen(true)
    },
    []
  )

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false)
    setEditingChannel(null)
    setDeleting(false)
  }, [])

  const handleSaveChannel = useCallback(async () => {
    if (!currentServerId || !editingChannel) return
    setSaving(true)
    try {
      await updateChannel(currentServerId, editingChannel.id, { name, topic })
      messageApi.success('频道设置已保存')
      handleSettingsClose()
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '保存频道失败')
    } finally {
      setSaving(false)
    }
  }, [currentServerId, editingChannel, name, topic, updateChannel, messageApi, handleSettingsClose])

  const handleDeleteChannel = useCallback(async () => {
    if (!currentServerId || !editingChannel) return
    const confirmed = window.confirm(`确定删除频道 #${editingChannel.name} 吗？此操作不可撤销。`)
    if (!confirmed) return
    setDeleting(true)
    try {
      await deleteChannel(currentServerId, editingChannel.id)
      messageApi.success('频道已删除')
      if (currentChannelId === editingChannel.id) {
        setCurrentChannel(null)
        setUIChannelId(null)
      }
      handleSettingsClose()
    } catch (err) {
      messageApi.error(err instanceof Error ? err.message : '删除频道失败')
    } finally {
      setDeleting(false)
    }
  }, [currentServerId, editingChannel, deleteChannel, messageApi, currentChannelId, setCurrentChannel, setUIChannelId, handleSettingsClose])

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
                isMuted={mutedChannelIds.has(channel.id)}
                onClick={() => handleChannelClick(channel)}
                onToggleMute={handleToggleMute}
                onOpenSettings={handleOpenSettings}
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

      <Modal
        isOpen={settingsOpen}
        onClose={handleSettingsClose}
        title="频道设置"
        size="md"
        footer={
          <div className="w-full flex items-center justify-between">
            {editingChannel && (
              <button
                onClick={() => void handleDeleteChannel()}
                disabled={deleting}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5',
                  'bg-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/90 text-white',
                  'transition-colors duration-150',
                  deleting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <DeleteOutlined />
                {deleting ? '删除中...' : '删除频道'}
              </button>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSettingsClose}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-darker)] text-[var(--color-text-normal)] transition-colors duration-150"
              >
                取消
              </button>
              <button
                onClick={() => void handleSaveChannel()}
                disabled={saving || !name.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white',
                  'transition-colors duration-150',
                  (saving || !name.trim()) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">频道名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="频道名称"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-sm text-[var(--color-text-normal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1.5">主题</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="频道主题（可选）"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-sm text-[var(--color-text-normal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

interface ChannelItemProps {
  channel: ChannelTreeNode
  isActive?: boolean
  isCategory?: boolean
  onClick?: () => void
  isMuted?: boolean
  onToggleMute: (channel: ChannelTreeNode) => void
  onOpenSettings: (channel: ChannelTreeNode) => void
}

function ChannelItem({ channel, isActive, isCategory, onClick, isMuted, onToggleMute, onOpenSettings }: ChannelItemProps) {
  const getIcon = () => {
    if (isCategory) return <DownOutlined className="text-xs" />
    if (channel.type === ChannelType.Voice) return <AudioOutlined className="text-lg" />
    return <NumberOutlined className="text-lg" />
  }

  const items = [
    {
      key: 'mute',
      label: isMuted ? '取消静音' : '静音频道',
      icon: isMuted ? <SoundFilled /> : <SoundOutlined />,
      onClick: () => onToggleMute(channel),
    },
    {
      key: 'settings',
      label: '频道设置',
      icon: <SettingOutlined />,
      onClick: () => onOpenSettings(channel),
    },
  ]

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
      menu={{ items }}
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
        {isMuted && (
          <Tooltip title="频道已静音">
            <SoundFilled className="text-xs text-[var(--color-text-muted)]" />
          </Tooltip>
        )}
        {channel.unreadCount && channel.unreadCount > 0 && !isMuted && (
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
