import type { ReactNode } from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Avatar, App, Popconfirm } from 'antd'
import {
  TeamOutlined,
  UserAddOutlined,
  SearchOutlined,
  BellOutlined,
  MessageOutlined,
  UserOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { friendService } from '@renderer/services'
import type { ViewPageProps } from '@renderer/config/viewRegistry'
import type {
  FriendItem,
  FriendRequest,
  Conversation,
  PrivateMessage,
  UserSearchResult,
} from '@shared/types/friend'

/** KOOK 风格好友页四 Tab。 */
type TabKey = 'friends' | 'requests' | 'add' | 'chat'

function toErrorText(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { statusCode?: number; message?: string; errorData?: { message?: string } }
    if (e.errorData?.message) return e.errorData.message
    if (e.message) return e.message
  }
  return '操作失败，请稍后重试'
}

/**
 * FriendsPage - 好友页面（KOOK 化四 Tab）。
 *
 * Tab1 好友：好友列表 / 在线状态点 / 删除好友 / 发起私信。
 * Tab2 请求：好友请求列表，接受/拒绝。
 * Tab3 添加：按用户名搜索用户并发起好友请求。
 * Tab4 私信：会话列表 + 聊天窗口（本地 useState 轮询加载消息）。
 */
export function FriendsPage(_props: ViewPageProps): ReactNode {
  const { message } = App.useApp()

  const [activeTab, setActiveTab] = useState<TabKey>('friends')

  // 好友列表
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [activeChatUserId, setActiveChatUserId] = useState<number | null>(null)

  // 请求列表
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // 搜索 + 添加
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // 会话 + 聊天
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const loadFriends = useCallback(async (): Promise<void> => {
    setFriendsLoading(true)
    try {
      const list = await friendService.getFriends()
      setFriends(list)
    } catch (err) {
      message.error(toErrorText(err))
    } finally {
      setFriendsLoading(false)
    }
  }, [message])

  const loadRequests = useCallback(async (): Promise<void> => {
    setRequestsLoading(true)
    try {
      const list = await friendService.getFriendRequests()
      // 仅展示待处理请求
      setRequests(list.filter((r) => r.status === 0))
    } catch (err) {
      message.error(toErrorText(err))
    } finally {
      setRequestsLoading(false)
    }
  }, [message])

  const loadConversations = useCallback(async (): Promise<void> => {
    setConversationsLoading(true)
    try {
      const list = await friendService.getConversations()
      setConversations(list)
      return
    } catch (err) {
      message.error(toErrorText(err))
    } finally {
      setConversationsLoading(false)
    }
  }, [message])

  // 首次挂载加载好友 + 请求 + 会话
  useEffect(() => {
    void loadFriends()
    void loadRequests()
    void loadConversations()
  }, [loadFriends, loadRequests, loadConversations])

  // 加载与某好友的私聊消息
  const loadMessages = useCallback(
    async (userId: number): Promise<void> => {
      setMessagesLoading(true)
      try {
        const list = await friendService.getPrivateMessages(userId)
        setMessages(list)
      } catch (err) {
        message.error(toErrorText(err))
        setMessages([])
      } finally {
        setMessagesLoading(false)
      }
    },
    [message],
  )

  useEffect(() => {
    if (activeChatUserId !== null) {
      void loadMessages(activeChatUserId)
    } else {
      setMessages([])
    }
  }, [activeChatUserId, loadMessages])

  // 轻量轮询（前端降级方案）：后端无 private_message WS 事件，接收方新消息不会实时推送。
  // 选中会话期间每 8s 拉一次最新消息，保证收发双端消息列表最终一致。轮询只替换消息列表，
  // 不触碰 draft 输入态；activeChatUserId 变化或卸载时清理，避免泄漏。
  useEffect(() => {
    if (activeChatUserId === null) return
    const timer = window.setInterval(() => {
      void loadMessages(activeChatUserId)
    }, 8000)
    return () => window.clearInterval(timer)
  }, [activeChatUserId, loadMessages])

  const handleSelectConversation = useCallback(
    (userId: number) => {
      setActiveChatUserId((prev) => {
        const next = prev === userId ? null : userId
        if (next !== null) void loadMessages(next)
        return next
      })
    },
    [loadMessages],
  )

  const handleRemoveFriend = useCallback(
    async (friendId: number): Promise<void> => {
      try {
        await friendService.removeFriend(friendId)
        setFriends((prev) => prev.filter((f) => f.friendId !== friendId))
        setConversations((prev) => prev.filter((c) => c.userId !== friendId))
        setActiveChatUserId((prev) => (prev === friendId ? null : prev))
        message.success('已删除好友')
      } catch (err) {
        message.error(toErrorText(err))
      }
    },
    [message],
  )

  const handleHandleRequest = useCallback(
    async (id: number, accept: boolean): Promise<void> => {
      try {
        await friendService.handleFriendRequest(id, accept)
        setRequests((prev) => prev.filter((r) => r.id !== id))
        message.success(accept ? '已接受好友请求' : '已拒绝好友请求')
        if (accept) void loadFriends()
      } catch (err) {
        message.error(toErrorText(err))
      }
    },
    [message, loadFriends],
  )

  const handleSearch = useCallback(async (): Promise<void> => {
    const keyword = searchText.trim()
    if (!keyword) {
      message.warning('请输入用户名')
      return
    }
    setSearching(true)
    try {
      const res = await friendService.searchUsers(keyword)
      setSearchResults(res.results ?? [])
    } catch (err) {
      message.error(toErrorText(err))
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [searchText, message])

  const handleSendRequest = useCallback(
    async (userId: number): Promise<void> => {
      try {
        await friendService.sendFriendRequest({ receiverId: userId })
        setSearchResults((prev) =>
          prev.map((u) => (u.userId === userId ? { ...u, hasPendingRequest: true } : u)),
        )
        message.success('好友请求已发送')
      } catch (err) {
        message.error(toErrorText(err))
      }
    },
    [message],
  )

  const handleStartChat = useCallback(
    (userId: number, username: string) => {
      setConversations((prev) => {
        const existing = prev.find((c) => c.userId === userId)
        if (existing) return prev
        return [
          {
            userId,
            username,
            avatarUrl: '',
            isOnline: false,
            customStatus: '',
            lastMessage: '',
            lastMessageAt: '',
            unreadCount: 0,
          },
          ...prev,
        ]
      })
      setActiveChatUserId(userId)
      setActiveTab('chat')
      void loadMessages(userId)
    },
    [loadMessages],
  )

  const handleSendMessage = useCallback(async (): Promise<void> => {
    const content = draft.trim()
    if (!content || activeChatUserId === null) return
    setSending(true)
    const optimistic: PrivateMessage = {
      id: -Date.now(),
      senderId: 0,
      senderName: '我',
      receiverId: activeChatUserId,
      content,
      isRead: true,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setDraft('')
    try {
      await friendService.sendPrivateMessage({
        receiverId: activeChatUserId,
        content,
        type: 'text',
      })
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === activeChatUserId
            ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
            : c,
        ),
      )
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      message.error(toErrorText(err))
    } finally {
      setSending(false)
    }
  }, [draft, activeChatUserId, message])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.userId === activeChatUserId),
    [conversations, activeChatUserId],
  )

  const displayedFriends = useMemo(() => {
    if (!onlineOnly) return friends
    return friends.filter((f) => f.isOnline)
  }, [friends, onlineOnly])

  const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
    { key: 'friends', label: '好友', icon: <TeamOutlined /> },
    { key: 'requests', label: `请求${requests.length > 0 ? ` (${requests.length})` : ''}`, icon: <BellOutlined /> },
    { key: 'add', label: '添加好友', icon: <UserAddOutlined /> },
    { key: 'chat', label: '私信', icon: <MessageOutlined /> },
  ]

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="h-[var(--header-height)] px-4 flex items-center gap-4 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-base)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-bg-tertiary)]">
            <TeamOutlined className="text-[var(--color-primary)] text-lg" />
          </div>
          <span className="font-semibold text-[var(--color-text-normal)]">好友</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 border-b border-[var(--color-border)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
              activeTab === t.key
                ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-tertiary)]',
            )}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
        {activeTab === 'friends' && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setOnlineOnly((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150',
                onlineOnly
                  ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]',
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  onlineOnly ? 'bg-[var(--color-online)]' : 'bg-[var(--color-bg-darker)]',
                )}
              />
              在线
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex">
        {/* Tab content */}
        {activeTab === 'friends' && (
          <FriendsListView
            friends={displayedFriends}
            loading={friendsLoading}
            onStartChat={handleStartChat}
            onRemoveFriend={handleRemoveFriend}
          />
        )}

        {activeTab === 'requests' && (
          <RequestsView
            requests={requests}
            loading={requestsLoading}
            onHandle={handleHandleRequest}
          />
        )}

        {activeTab === 'add' && (
          <AddFriendView
            searchText={searchText}
            setSearchText={setSearchText}
            searching={searching}
            results={searchResults}
            onSearch={handleSearch}
            onSendRequest={handleSendRequest}
            onStartChat={handleStartChat}
          />
        )}

        {activeTab === 'chat' && (
          <ChatViewPanel
            conversations={conversations}
            loading={conversationsLoading}
            activeUserId={activeChatUserId}
            messages={messages}
            messagesLoading={messagesLoading}
            activeConversation={activeConversation}
            onSelect={handleSelectConversation}
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            onSend={handleSendMessage}
          />
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── Tab 子视图 ───────────────────────── */

function FriendsListView({
  friends,
  loading,
  onStartChat,
  onRemoveFriend,
}: {
  friends: FriendItem[]
  loading: boolean
  onStartChat: (userId: number, username: string) => void
  onRemoveFriend: (friendId: number) => void
}): ReactNode {
  return (
    <div className="flex-1 overflow-y-auto min-w-0 scrollbar-thin">
      {loading && <EmptyView text="加载中..." />}
      {!loading && friends.length === 0 && <EmptyView text="暂无好友，去「添加好友」看看吧" icon={<TeamOutlined />} />}
      {!loading &&
        friends.map((f) => (
          <div
            key={f.id}
            className="group flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-bg-tertiary)] transition-colors duration-150"
          >
            <div className="relative flex-shrink-0">
              <Avatar
                size={40}
                src={f.friendAvatarUrl || undefined}
                className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
              >
                {f.friendUsername?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-bg-base)]',
                  f.isOnline ? 'bg-[var(--color-online)]' : 'bg-[var(--color-offline)]',
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--color-text-normal)] font-medium truncate">{f.friendUsername}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {f.isOnline ? (f.customStatus || '在线') : '离线'}
              </p>
            </div>
            <button
              onClick={() => onStartChat(f.friendId, f.friendUsername)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <MessageOutlined /> 私信
            </button>
            <Popconfirm
              title="删除好友"
              description={`确定删除好友 ${f.friendUsername} 吗？`}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => onRemoveFriend(f.friendId)}
            >
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-dnd)] hover:bg-[var(--color-bg-secondary)] transition-colors">
                <UserDeleteOutlined /> 删除
              </button>
            </Popconfirm>
          </div>
        ))}
    </div>
  )
}

function RequestsView({
  requests,
  loading,
  onHandle,
}: {
  requests: FriendRequest[]
  loading: boolean
  onHandle: (id: number, accept: boolean) => void
}): ReactNode {
  return (
    <div className="flex-1 overflow-y-auto min-w-0 scrollbar-thin">
      {loading && <EmptyView text="加载中..." />}
      {!loading && requests.length === 0 && <EmptyView text="暂无好友请求" icon={<BellOutlined />} />}
      {!loading &&
        requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-bg-tertiary)] transition-colors duration-150"
          >
            <Avatar
              size={40}
              className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex-shrink-0"
            >
              {r.senderName?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--color-text-normal)] font-medium truncate">{r.senderName}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{r.message || '想添加你为好友'}</p>
            </div>
            <button
              onClick={() => onHandle(r.id, true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-online)]/15 text-[var(--color-online)] hover:bg-[var(--color-online)]/25 transition-colors"
            >
              <CheckOutlined /> 接受
            </button>
            <button
              onClick={() => onHandle(r.id, false)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-dnd)]/10 text-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/20 transition-colors"
            >
              <CloseOutlined /> 拒绝
            </button>
          </div>
        ))}
    </div>
  )
}

function AddFriendView({
  searchText,
  setSearchText,
  searching,
  results,
  onSearch,
  onSendRequest,
  onStartChat,
}: {
  searchText: string
  setSearchText: (v: string) => void
  searching: boolean
  results: UserSearchResult[]
  onSearch: () => void
  onSendRequest: (userId: number) => void
  onStartChat: (userId: number, username: string) => void
}): ReactNode {
  return (
    <div className="flex-1 overflow-y-auto min-w-0 scrollbar-thin">
      <div className="p-4 flex items-center gap-2 border-b border-[var(--color-border)]">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)]">
          <SearchOutlined className="text-[var(--color-text-muted)]" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="输入用户名搜索"
            className="flex-1 bg-transparent outline-none text-sm text-[var(--color-text-normal)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
        <button
          onClick={onSearch}
          disabled={searching}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white disabled:opacity-50 transition-colors"
        >
          {searching ? '搜索中...' : '搜索'}
        </button>
      </div>

      {!searching && results.length === 0 && (
        <EmptyView text="输入用户名搜索并添加好友" icon={<UserAddOutlined />} />
      )}

      {results.map((u) => (
        <div key={u.userId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-bg-tertiary)] transition-colors">
          <div className="relative flex-shrink-0">
            <Avatar
              size={40}
              src={u.avatarUrl || undefined}
              className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
            >
              {u.username?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-bg-base)]',
                u.isOnline ? 'bg-[var(--color-online)]' : 'bg-[var(--color-offline)]',
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--color-text-normal)] font-medium truncate">{u.username}</p>
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {u.customStatus || (u.isOnline ? '在线' : '离线')}
            </p>
          </div>
          {u.isFriend ? (
            <button
              onClick={() => onStartChat(u.userId, u.username)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
            >
              <MessageOutlined /> 已是好友
            </button>
          ) : u.hasPendingRequest ? (
            <span className="px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)]">
              已发送请求
            </span>
          ) : (
            <button
              onClick={() => onSendRequest(u.userId)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-colors"
            >
              <UserAddOutlined /> 添加好友
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function ChatViewPanel({
  conversations,
  loading,
  activeUserId,
  messages,
  messagesLoading,
  activeConversation,
  onSelect,
  draft,
  setDraft,
  sending,
  onSend,
}: {
  conversations: Conversation[]
  loading: boolean
  activeUserId: number | null
  messages: PrivateMessage[]
  messagesLoading: boolean
  activeConversation?: Conversation
  onSelect: (userId: number) => void
  draft: string
  setDraft: (v: string) => void
  sending: boolean
  onSend: () => void
}): ReactNode {
  return (
    <div className="flex-1 min-w-0 flex">
      {/* 会话列表 */}
      <div className="w-[240px] border-r border-[var(--color-border)] overflow-y-auto scrollbar-thin flex-shrink-0">
        {loading && <EmptyView text="加载中..." />}
        {!loading && conversations.length === 0 && <EmptyView text="暂无会话" icon={<MessageOutlined />} />}
        {conversations.map((c) => (
          <button
            key={c.userId}
            onClick={() => onSelect(c.userId)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--color-bg-tertiary)] transition-colors text-left',
              activeUserId === c.userId && 'bg-[var(--color-primary)]/10',
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar
                size={36}
                src={c.avatarUrl || undefined}
                className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
              >
                {c.username?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
              {c.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-online)] border-2 border-[var(--color-bg-base)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-text-normal)] font-medium truncate">{c.username}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{c.lastMessage || '暂无消息'}</p>
            </div>
            {c.unreadCount > 0 && (
              <span className="flex-shrink-0 min-w-4 h-4 px-1 rounded-full bg-[var(--color-dnd)] text-white text-[10px] flex items-center justify-center">
                {c.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 聊天窗口 */}
      {activeUserId === null ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyView text="选择一个会话开始私聊" icon={<MessageOutlined />} />
        </div>
      ) : (
        <div className="flex-1 min-w-0 flex flex-col">
          {activeConversation && (
            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
              <Avatar
                size={28}
                src={activeConversation.avatarUrl || undefined}
                className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]"
              >
                {activeConversation.username?.charAt(0)?.toUpperCase() || '?'}
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-normal)] truncate">
                  {activeConversation.username}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {activeConversation.isOnline
                    ? activeConversation.customStatus || '在线'
                    : '离线'}
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
            {messagesLoading && <EmptyView text="加载中..." />}
            {!messagesLoading && messages.length === 0 && <EmptyView text="暂无消息，说点什么吧" icon={<MessageOutlined />} />}
            {messages.map((m) => {
              const mine =
                m.senderId === activeConversation?.userId ||
                m.senderName === '我' ||
                m.receiverId === activeConversation?.userId
              return (
                <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[70%] px-3 py-2 rounded-xl text-sm break-words',
                      mine
                        ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-normal)] rounded-bl-sm',
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              rows={2}
              className="flex-1 resize-none bg-[var(--color-bg-tertiary)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-normal)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <button
              onClick={onSend}
              disabled={sending || !draft.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white disabled:opacity-50 transition-colors"
            >
              <SendOutlined />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyView({
  text,
  icon,
}: {
  text: string
  icon?: ReactNode
}): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      {icon ? (
        <div className="text-4xl text-[var(--color-text-muted)] mb-3">{icon}</div>
      ) : (
        <UserOutlined className="text-3xl text-[var(--color-text-muted)] mb-3" />
      )}
      <p className="text-sm text-[var(--color-text-muted)]">{text}</p>
    </div>
  )
}

export default FriendsPage
