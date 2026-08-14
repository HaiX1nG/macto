import { create } from 'zustand'
import type { MessageWithStatus } from './chatStore'
import type { FriendRequest } from '@shared/types/friend'

/**
 * 通知业务类型（前端聚合，无后端通知端点）。
 *
 * KOOK 风格通知中心：@提及 + 置顶 + 好友请求，全部由前端从
 * chatStore / friendService 聚合并扁平化为统一列表。
 */
export type NotificationKind = 'mention' | 'pin' | 'friend-request'

/** 通知跳转目标 */
export interface NotificationTarget {
  /** 跳转视图：文字频道 / 好友页 */
  view: 'text-channel' | 'friends'
  /** 文字频道视图所需的频道 ID */
  channelId?: number
}

/** 单条通知 */
export interface AppNotification {
  /** 稳定去重 ID（同源同消息仅保留一条） */
  key: string
  kind: NotificationKind
  /** 触发人名称 */
  actor: string
  /** 通知正文（已拼接中文文案） */
  text: string
  /** 关联消息正文片段（提及/置顶） */
  content: string
  /** 通知产生时间 ISO 字符串 */
  createdAt: string
  /** 跳转目标 */
  target: NotificationTarget
  /** 是否已读。未读数量据此计算。 */
  read: boolean
}

/**
 * 通知中心状态。所有逻辑均为前端聚合，不依赖后端通知端点。
 *
 * - notifications       ：聚合后的扁平化通知列表（按时间倒序）
 * - unreadCount         ：未读通知数（驱动通知按钮红点/徽标）
 * - notificationsVersion：自增版本号；下拉展开面板时会触发 loadNotifications 重聚合
 * - loadNotifications   ：从 chatStore / friendService 聚合并去重合并（保留已读状态）
 * - markAllRead         ：将全部通知标记为已读，未读数清零
 * - reset               ：清空全部通知（测试/登出兜底用）
 */
export interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  notificationsVersion: number
  loadNotifications: () => Promise<void>
  markAllRead: () => void
  reset: () => void
}

/**
 * 判断一条消息正文是否@了当前用户。
 *
 * 项目内提及以纯文本 `@用户名` 形式插入（MessageInput 的 MentionAutocomplete），
 * 无结构化 mention 元数据，故此处按“文本包含 @当前用户名”启发式过滤。
 * 仅匹配独立词边界（@XXX 后跟随非用户名可见字符），避免误匹配子串。
 */
export function isMentionOf(msg: MessageWithStatus, selfName: string): boolean {
  if (!selfName) return false
  const escaped = selfName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // @ 后紧跟用户名，且用户名与消息作者不同
  const re = new RegExp(`@${escaped}(?=\\s|[,，。；、!！?？:：）)]|$)`, 'i')
  return re.test(msg.content) && msg.senderName !== selfName
}

const PENDING_REQUEST_STATUS = 0

/**
 * 将一条待处理好友请求转换为通知项。
 * @param req 待处理好友请求（status === 0）
 */
function friendRequestToNotification(req: FriendRequest): AppNotification {
  return {
    key: `friend-request:${req.id}`,
    kind: 'friend-request',
    actor: req.senderName,
    text: `${req.senderName} 请求添加你为好友`,
    content: req.message || '',
    createdAt: req.createdAt,
    target: { view: 'friends' },
    read: false,
  }
}

/** 聚合入口的输入形态（chatStore 只需要 messages 字段） */
export interface AggregationInput {
  selfName: string
  messages: ReadonlyMap<number, readonly MessageWithStatus[]>
  friendRequests: readonly FriendRequest[]
}

/**
 * 从 chatStore 消息缓存 + 好友请求列表聚合通知。
 *
 * 纯函数（方便单测），不触碰任何全局状态。
 */
export function collectAggregatedNotifications(input: AggregationInput): AppNotification[] {
  const { selfName, messages, friendRequests } = input
  const notifications: AppNotification[] = []

  messages.forEach((channelMessages, channelId) => {
    for (const msg of channelMessages) {
      // 跳过本地待发送/失败的乐观消息（senderUserId 为 0）
      if (msg.senderUserId === 0 && msg.status !== 'sent') continue

      // @提及我
      if (isMentionOf(msg, selfName)) {
        notifications.push({
          key: `mention:${msg.id}`,
          kind: 'mention',
          actor: msg.senderName,
          text: `在频道里@了你`,
          content: msg.content,
          createdAt: msg.createdAt,
          target: { view: 'text-channel', channelId },
          read: false,
        })
        continue
      }

      // 被置顶
      if (msg.isPinned) {
        notifications.push({
          key: `pin:${msg.id}`,
          kind: 'pin',
          actor: msg.senderName,
          text: `将消息置顶到频道`,
          content: msg.content,
          createdAt: msg.createdAt,
          target: { view: 'text-channel', channelId },
          read: false,
        })
      }
    }
  })

  // 待处理好友请求
  for (const req of friendRequests) {
    if (req.status !== PENDING_REQUEST_STATUS) continue
    notifications.push(friendRequestToNotification(req))
  }

  // 按时间倒序
  return notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/**
 * 将新聚合结果与 store 中已有通知合并，保留已读状态。
 *
 * 同一 key 的新项沿用原已读标记；本次未返回但已存在的项保留（避免闪烁）。
 */
export function mergeNotifications(
  existing: readonly AppNotification[],
  fresh: readonly AppNotification[],
): AppNotification[] {
  const prevByKey = new Map(existing.map((n) => [n.key, n]))
  const merged = new Map<string, AppNotification>()

  for (const freshItem of fresh) {
    const prev = prevByKey.get(freshItem.key)
    merged.set(freshItem.key, prev ? { ...freshItem, read: prev.read } : freshItem)
  }
  for (const prev of existing) {
    if (!merged.has(prev.key)) merged.set(prev.key, prev)
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  notificationsVersion: 0,

  loadNotifications: async () => {
    // 异步拉取待处理好友请求
    const { friendService } = await import('../services/friendService')
    let friendRequests: readonly FriendRequest[]
    try {
      friendRequests = (await friendService.getFriendRequests()) ?? []
    } catch {
      // 请求失败时静默降级为仅消息类通知，不阻塞 UI
      friendRequests = [] as const
    }

    const chatStore = (await import('./chatStore')).useChatStore.getState()
    const selfName = (await import('./authStore')).useAuthStore.getState().currentUser?.username ?? ''

    const fresh = collectAggregatedNotifications({
      selfName,
      messages: chatStore.messages,
      friendRequests,
    })

    set((state) => {
      const merged = mergeNotifications(state.notifications, fresh)
      return {
        notifications: merged,
        unreadCount: merged.filter((n) => !n.read).length,
        notificationsVersion: state.notificationsVersion + 1,
      }
    })
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },

  reset: () => {
    set({ notifications: [], unreadCount: 0, notificationsVersion: 0 })
  },
}))

export default useNotificationStore
