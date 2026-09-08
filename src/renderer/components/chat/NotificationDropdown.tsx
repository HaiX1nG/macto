import type { ReactNode } from 'react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Avatar, Dropdown, List } from 'antd'
import {
  AimOutlined,
  PushpinOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useNotificationStore, type AppNotification } from '@renderer/stores/notificationStore'
import { useUIStore } from '@renderer/stores/uiStore'
import { useChannelStore } from '@renderer/stores/channelStore'
import { useServerStore } from '@renderer/stores/serverStore'
import { EmptyNotifications } from '@renderer/components/ui/EmptyState'
import { NotificationBellButton } from './NotificationBell'
import type { ChannelTreeNode } from '@shared/types/channel'
import { ChannelType } from '@shared/types/channel'

const KIND_ICON: Record<AppNotification['kind'], ReactNode> = {
  mention: <AimOutlined className="text-[var(--color-primary)]" />,
  pin: <PushpinOutlined className="text-[var(--color-primary)]" />,
  'friend-request': <UserAddOutlined className="text-[var(--color-primary)]" />,
}

/** 返回节点是否为分类频道 */
function isCategory(node: ChannelTreeNode): boolean {
  return node.type === ChannelType.Category
}

/**
 * NotificationDropdown - KOOK 风格通知中心（DropDown + 铃铛按钮）。
 *
 * 数据全部来自 notificationStore（前端聚合，无后端通知端点）。
 * - 未读 > 0 时铃铛右上角显示红点徽标
 * - 点击展开面板：此时触发 loadNotifications 重新聚合（含好友请求异步拉取）
 * - 面板关闭后若仍存在未读，自动 markAllRead 清空未读
 * - 空态复用 EmptyNotifications
 * - 点击通知跳转：提及/置顶 -> 打开对应文字频道；好友请求 -> 好友页
 */
export function NotificationDropdown(): ReactNode {
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const loadNotifications = useNotificationStore((s) => s.loadNotifications)
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  const setActiveView = useUIStore((s) => s.setActiveView)
  const setUIChannelId = useUIStore((s) => s.setCurrentChannelId)
  const setCurrentChannel = useChannelStore((s) => s.setCurrentChannel)
  const currentServerId = useServerStore((s) => s.currentServerId)

  const [open, setOpen] = useState(false)
  const loadingRef = useRef(false)

  // 面板关闭时：若仍存在未读，标记全部已读
  useEffect(() => {
    if (open) return
    if (notifications.some((n) => !n.read)) {
      markAllRead()
    }
  }, [open, notifications, markAllRead])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen && !loadingRef.current) {
        loadingRef.current = true
        void loadNotifications().finally(() => {
          loadingRef.current = false
        })
      }
    },
    [loadNotifications],
  )

  const handleNotificationClick = useCallback(
    (item: AppNotification) => {
      setOpen(false)
      const { view, channelId } = item.target
      if (view === 'friends') {
        setActiveView('friends')
        return
      }
      if (channelId === undefined) return

      // 文字频道跳转：从频道树定位频道对象及其所属服务器，再设置 UI 状态并导航
      const { channels } = useChannelStore.getState()
      const resolve = (nodes: readonly ChannelTreeNode[], targetId: number): ChannelTreeNode | null => {
        for (const node of nodes) {
          if (node.id === targetId) return node
          if (isCategory(node) && node.children) {
            const hit = resolve(node.children, targetId)
            if (hit) return hit
          }
        }
        return null
      }
      const channel = resolve(channels, channelId)
      if (channel) setCurrentChannel(channel)
      setUIChannelId(channelId)

      const serverId = channel ? channel.serverId : currentServerId
      setActiveView('text-channel', {
        channelId,
        serverId: serverId ?? undefined,
      })
    },
    [setActiveView, setCurrentChannel, setUIChannelId, currentServerId],
  )

  const dropdownRender = useCallback(() => {
    if (notifications.length === 0) {
      return (
        <div className="w-[320px] rounded-xl overflow-hidden bg-[var(--color-bg-elevated)]">
          <EmptyNotifications />
        </div>
      )
    }
    return (
      <div className="w-[320px] max-h-[420px] overflow-y-auto rounded-xl bg-[var(--color-bg-elevated)]">
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className={cn(
                'px-3 py-2.5 hover:bg-[var(--color-bg-tertiary)] cursor-pointer transition-colors border-b border-[var(--color-border)] last:border-b-0',
                !item.read && 'bg-[var(--color-primary)]/5',
              )}
              onClick={() => handleNotificationClick(item)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    shape="circle"
                    icon={KIND_ICON[item.kind]}
                    className="bg-[var(--color-bg-tertiary)]"
                  />
                }
                title={
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[var(--color-text-normal)] truncate">
                      {item.actor}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
                      {formatTime(item.createdAt)}
                    </span>
                    {!item.read && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                    )}
                  </div>
                }
                description={
                  <div className="leading-snug">
                    <span className="text-sm text-[var(--color-text-normal)]">{item.text}</span>
                    {item.content ? (
                      <span className="block text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                        {item.content}
                      </span>
                    ) : null}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    )
  }, [notifications, handleNotificationClick])

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      overlayClassName="rounded-xl overflow-hidden"
      open={open}
      onOpenChange={handleOpenChange}
      dropdownRender={dropdownRender}
    >
      <span className="inline-flex">
        <NotificationBellButton unreadCount={unreadCount} active={open} />
      </span>
    </Dropdown>
  )
}

/** 时间格式化：今天显示 HH:mm，否则显示 M月D日 */
function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

export default NotificationDropdown
