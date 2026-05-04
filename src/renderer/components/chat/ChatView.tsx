import { useState, useEffect, useCallback } from 'react'
import { Avatar, Spin, App } from 'antd'
import { useServerStore } from '@renderer/stores/serverStore'
import { useChatStore } from '@renderer/stores/chatStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AudioOutlined, AudioMutedOutlined, BellOutlined, PushpinOutlined, NumberOutlined, UserOutlined, SearchOutlined, InboxOutlined, SoundOutlined, SettingOutlined, LoadingOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import type { Channel, Message } from '@shared/types/kook'

export function ChatView() {
  const { message: messageApi } = App.useApp()
  const { servers, currentServerId, currentChannelId } = useServerStore()
  const { messages, fetchMessages, sendMessage, isLoading, hasMore, replyingTo, setReplyingTo, clearMessages } = useChatStore()
  const { currentUser } = useAuthStore()

  const currentServer = servers.find(s => s.id === currentServerId)
  const currentChannel = currentServer?.channels.find(c => c.id === currentChannelId)

  // Load messages when channel changes
  useEffect(() => {
    if (currentChannelId && currentChannel?.type !== 'voice') {
      clearMessages()
      fetchMessages(Number(currentChannelId), { pageSize: 50 })
    }
  }, [currentChannelId, currentChannel?.type, fetchMessages, clearMessages])

  // Convert API messages to KOOK format for display
  const channelMessages: Message[] = messages.map(msg => ({
    id: String(msg.id),
    channelId: String(msg.roomId),
    authorId: String(msg.senderUserId),
    author: {
      id: String(msg.senderUserId),
      name: msg.senderName,
      displayName: msg.senderName,
      avatar: currentUser?.avatarUrl,
      status: 'online' as const,
    },
    content: msg.content,
    timestamp: new Date(msg.createdAt).getTime(),
  }))

  // Handle sending message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentChannelId || !content.trim()) return

    try {
      await sendMessage(Number(currentChannelId), {
        messageType: 1,
        content: content.trim(),
      })
    } catch (_err) {
      messageApi.error('发送消息失败')
    }
  }, [currentChannelId, sendMessage, messageApi])

  // Handle load more messages (scroll to top)
  const handleLoadMore = useCallback(() => {
    if (currentChannelId && hasMore && !isLoading) {
      fetchMessages(Number(currentChannelId), { page: 2, pageSize: 50 })
    }
  }, [currentChannelId, hasMore, isLoading, fetchMessages])

  // Handle reply
  const handleReply = useCallback((message: Message) => {
    const originalMsg = messages.find(m => String(m.id) === message.id)
    if (originalMsg) {
      setReplyingTo(originalMsg)
    }
  }, [messages, setReplyingTo])

  // Handle cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [setReplyingTo])

  // Handle edit message
  const handleEditMessage = useCallback((messageId: string, content: string) => {
    useChatStore.getState().updateMessage(Number(messageId), content)
    messageApi.success('消息已更新')
  }, [messageApi])

  // Handle delete message
  const handleDeleteMessage = useCallback((messageId: string) => {
    useChatStore.getState().deleteMessage(Number(messageId))
  }, [])

  if (!currentServer || !currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-bg-darker)] flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 28 20" className="w-10 h-8 text-[var(--color-text-muted)]" fill="currentColor">
              <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3416 0C8.49087 0.322199 6.68661 0.885653 4.97361 1.68345C1.53179 6.77853 0.559612 11.7417 1.04602 16.6309C3.04912 18.1166 5.31187 19.2137 7.72333 19.8612C8.25832 19.1384 8.73498 18.3699 9.14898 17.5624C8.37544 17.2724 7.62992 16.9089 6.92297 16.4756C7.10261 16.3474 7.27777 16.2131 7.44717 16.0745C11.7197 18.0621 16.3394 18.0621 20.5554 16.0745C20.7248 16.2131 20.8999 16.3474 21.0796 16.4756C20.3714 16.9102 19.6246 17.275 18.8497 17.5637C19.2637 18.3711 19.7403 19.1397 20.2753 19.8625C22.6881 19.2137 24.9508 18.1153 26.954 16.6309C27.5307 10.9745 26.0372 6.05798 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0455 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6811 9.54272 20.6544 10.994C20.6544 12.4453 19.6249 13.6383 18.3161 13.6383Z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-normal)] mb-2">欢迎使用 Macto</h3>
          <p className="text-[var(--color-text-muted)]">选择一个服务器和频道开始聊天</p>
        </div>
      </div>
    )
  }

  if (currentChannel.type === 'voice') return <VoiceChannelView channel={currentChannel} />

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <NumberOutlined className="text-[var(--color-text-muted)]" />
          <span className="font-semibold text-[var(--color-text-normal)]">{currentChannel.name}</span>
        </div>
        {currentChannel.topic && (
          <>
            <div className="w-px h-6 bg-[var(--color-border)]" />
            <span className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">{currentChannel.topic}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <HeaderBtn icon={<BellOutlined />} />
          <HeaderBtn icon={<PushpinOutlined />} />
          <HeaderBtn icon={<UserOutlined />} />
          <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
          <div className="relative">
            <input type="text" placeholder="搜索" className="w-36 h-7 pl-7 pr-2 bg-[var(--color-bg-darkest)] border-none rounded text-sm text-[var(--color-text-normal)] placeholder-[var(--color-text-muted)] focus:outline-none focus:w-56 transition-all" />
            <SearchOutlined className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          </div>
          <HeaderBtn icon={<InboxOutlined />} />
        </div>
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">
            回复 <span className="text-[var(--color-primary)] font-medium">{replyingTo.senderName}</span>:
          </span>
          <span className="text-sm text-[var(--color-text-normal)] truncate flex-1">
            {replyingTo.content.slice(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}
          </span>
          <button
            onClick={handleCancelReply}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"
          >
            取消
          </button>
        </div>
      )}

      {/* Messages */}
      {isLoading && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Spin indicator={<LoadingOutlined className="text-[var(--color-primary)]" spin />} />
        </div>
      ) : (
        <MessageList
          messages={channelMessages}
          onAddReaction={() => {}}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={isLoading}
          onReply={handleReply}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
        />
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        channelName={currentChannel.name}
        replyingTo={replyingTo ? { name: replyingTo.senderName, content: replyingTo.content } : null}
        onCancelReply={handleCancelReply}
      />
    </div>
  )
}

function HeaderBtn({ icon, onClick, active }: { icon: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded transition-colors",
        active
          ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-darker)]"
      )}
    >
      {icon}
    </button>
  )
}

function VoiceChannelView({ channel }: { channel: Channel }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [volume, setVolume] = useState(100)
  const [participants, _setParticipants] = useState([
    { id: '1', name: '用户1', avatar: '', speaking: false },
    { id: '2', name: '用户2', avatar: '', speaking: true },
  ])

  const handleJoinVoice = async () => {
    try {
      // TODO: Implement actual voice connection
      setIsConnected(true)
    } catch (err) {
      console.error('Failed to join voice:', err)
    }
  }

  const handleLeaveVoice = () => {
    setIsConnected(false)
    setIsMuted(false)
    setIsDeafened(false)
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <AudioOutlined className="text-[var(--color-text-muted)]" />
          <span className="font-semibold text-[var(--color-text-normal)]">{channel.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isConnected && (
            <>
              <HeaderBtn
                icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                onClick={() => setIsMuted(!isMuted)}
                active={isMuted}
              />
              <HeaderBtn
                icon={<SoundOutlined />}
                onClick={() => setIsDeafened(!isDeafened)}
                active={isDeafened}
              />
            </>
          )}
          <HeaderBtn icon={<UserOutlined />} />
          <HeaderBtn icon={<SettingOutlined />} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Main Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--color-bg-darker)] flex items-center justify-center mx-auto mb-4">
              <AudioOutlined className="text-3xl text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-normal)] mb-2">{channel.name}</h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              {isConnected ? '已连接' : '语音频道'}
            </p>
            <button
              onClick={isConnected ? handleLeaveVoice : handleJoinVoice}
              className={cn(
                "px-6 py-3 rounded font-medium transition-colors",
                isConnected
                  ? "bg-[var(--color-dnd)] hover:opacity-90 text-white"
                  : "bg-[var(--color-primary)] hover:opacity-90 text-white"
              )}
            >
              {isConnected ? '断开连接' : '加入语音'}
            </button>
          </div>
        </div>

        {/* Participants Panel (when connected) */}
        {isConnected && (
          <div className="w-[240px] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] flex flex-col">
            <div className="p-3 border-b border-[var(--color-border)]">
              <h4 className="text-sm font-semibold text-[var(--color-text-normal)]">
                语音参与者 ({participants.length})
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {participants.map(p => (
                <VoiceParticipant
                  key={p.id}
                  name={p.name}
                  speaking={p.speaking}
                  muted={false}
                />
              ))}
            </div>

            {/* Volume Control */}
            <div className="p-3 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-2">
                <SoundOutlined className="text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)]">音量</span>
                <span className="text-xs text-[var(--color-text-muted)] ml-auto">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-[var(--color-bg-darker)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VoiceParticipant({ name, speaking, muted }: { name: string; speaking: boolean; muted: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded",
      speaking && "bg-[var(--color-primary)]/10"
    )}>
      <div className="relative">
        <Avatar size={32} className="bg-gradient-to-br from-blue-500 to-purple-600">
          {name.charAt(0)}
        </Avatar>
        {speaking && (
          <div className="absolute inset-0 rounded-full border-2 border-[var(--color-primary)] animate-pulse" />
        )}
      </div>
      <span className="flex-1 text-sm text-[var(--color-text-normal)] truncate">{name}</span>
      {muted && <AudioMutedOutlined className="text-xs text-[var(--color-text-muted)]" />}
    </div>
  )
}
