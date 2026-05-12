import { useState, useEffect, useCallback } from 'react'
import { Avatar, App } from 'antd'
import { useServerStore } from '@renderer/stores/serverStore'
import { useChatStore } from '@renderer/stores/chatStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { useAudioStore } from '@renderer/stores/audioStore'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { SearchMessages } from './SearchMessages'
import { AudioOutlined, AudioMutedOutlined, BellOutlined, PushpinOutlined, NumberOutlined, UserOutlined, SearchOutlined, InboxOutlined, SoundOutlined, SettingOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { voiceService } from '@renderer/services'
import { SkeletonMessageList } from '@renderer/components/ui/Skeleton'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import type { Channel, Message } from '@shared/types/kook'
import type { VoiceSessionResponse, MessageResponse } from '@shared/types/api'

export function ChatView() {
  const { message: messageApi } = App.useApp()
  const { servers, currentServerId, currentChannelId } = useServerStore()
  const { messages, pinnedMessages, fetchMessages, sendMessage, isLoading, hasMore, replyingTo, setReplyingTo, clearMessages, pinMessage, unpinMessage } = useChatStore()
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
  const handleSendMessage = useCallback(async (content: string, attachments?: { url: string; type: 'image' | 'video' | 'audio' | 'file'; filename: string; size: number }[]) => {
    if (!currentChannelId) return

    try {
      // If has attachments, send as attachment message
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const messageType = attachment.type === 'image' ? 2 : 1
          await sendMessage(Number(currentChannelId), {
            messageType,
            content: attachment.url,
          })
        }
      } else if (content.trim()) {
        // Send text message
        await sendMessage(Number(currentChannelId), {
          messageType: 1,
          content: content.trim(),
        })
      }
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

  // Handle pin message
  const handlePinMessage = useCallback((messageId: string) => {
    const isPinned = pinnedMessages.some(m => String(m.id) === messageId)
    if (isPinned) {
      unpinMessage(Number(messageId))
    } else {
      pinMessage(Number(messageId))
    }
  }, [pinnedMessages, pinMessage, unpinMessage])

  // Handle unpin message
  const handleUnpinMessage = useCallback((messageId: string) => {
    unpinMessage(Number(messageId))
  }, [unpinMessage])

  // Convert pinned messages to KOOK format
  const pinnedKookMessages: Message[] = pinnedMessages.map(msg => ({
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
    pinned: true,
  }))

  // Search state - must be before conditional returns
  const [searchOpen, setSearchOpen] = useState(false)

  // Handle search message click - navigate to the message
  const handleSearchMessageClick = useCallback((message: MessageResponse) => {
    // Switch to the channel containing the message
    const channel = currentServer?.channels.find(c => c.id === String(message.roomId))
    if (channel) {
      // The channel switch will be handled by the server store
      useServerStore.getState().setCurrentChannel(String(message.roomId))
    }
  }, [currentServer])

  if (!currentServer || !currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-base)]">
        <NoChannelSelected />
      </div>
    )
  }

  if (currentChannel.type === 'voice') return <VoiceChannelView channel={currentChannel} />

  return (
    <>
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
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2 h-7 bg-[var(--color-bg-darkest)] rounded text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] transition-colors"
            >
              <SearchOutlined />
              <span className="w-20 text-left">搜索</span>
            </button>
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
        <SkeletonMessageList count={8} />
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
          onPin={handlePinMessage}
          onUnpin={handleUnpinMessage}
          pinnedMessages={pinnedKookMessages}
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

      {/* Search Modal */}
      <SearchMessages
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onMessageClick={handleSearchMessageClick}
      />
    </>
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
  const { message: messageApi } = App.useApp()
  const { currentUser } = useAuthStore()
  const { isCapturing, isSpeaking, audioLevel, joinVoice: storeJoinVoice, leaveVoice: storeLeaveVoice, isMuted: storeMuted, setMute: storeSetMute } = useAudioStore()
  const [isConnected, setIsConnected] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [volume, setVolume] = useState(100)
  const [participants, setParticipants] = useState<VoiceSessionResponse[]>([])
  const [loading, setLoading] = useState(false)

  // Sync connected state with audio store
  useEffect(() => {
    setIsConnected(isCapturing)
  }, [isCapturing])

  // Fetch voice participants when connected
  useEffect(() => {
    if (isConnected && channel.serverId) {
      const fetchParticipants = async () => {
        try {
          const result = await voiceService.getVoiceParticipants(Number(channel.serverId))
          setParticipants(result)
        } catch (err) {
          console.error('Failed to fetch voice participants:', err)
        }
      }
      fetchParticipants()
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchParticipants, 5000)
      return () => clearInterval(interval)
    }
  }, [isConnected, channel.serverId])

  const handleJoinVoice = async () => {
    if (!channel.serverId) return
    setLoading(true)
    try {
      await storeJoinVoice(Number(channel.serverId))
      messageApi.success('已加入语音频道')
    } catch (err) {
      console.error('Failed to join voice:', err)
      messageApi.error('加入语音失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveVoice = async () => {
    if (!channel.serverId) return
    try {
      await storeLeaveVoice(Number(channel.serverId))
      setIsDeafened(false)
      setParticipants([])
      messageApi.success('已离开语音频道')
    } catch (err) {
      console.error('Failed to leave voice:', err)
      messageApi.error('离开语音失败')
    }
  }

  const handleSetMute = async () => {
    if (!channel.serverId) return
    try {
      await storeSetMute(!storeMuted)
    } catch (err) {
      console.error('Failed to set mute:', err)
    }
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
                icon={storeMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                onClick={handleSetMute}
                active={storeMuted}
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
              disabled={loading}
              className={cn(
                "px-6 py-3 rounded font-medium transition-colors",
                isConnected
                  ? "bg-[var(--color-dnd)] hover:opacity-90 text-white"
                  : "bg-[var(--color-primary)] hover:opacity-90 text-white",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? '连接中...' : isConnected ? '断开连接' : '加入语音'}
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
              {/* Current user with audio level visualization */}
              {currentUser && (
                <VoiceParticipant
                  name={currentUser.username}
                  speaking={isSpeaking}
                  muted={storeMuted}
                  isCurrentUser={true}
                  audioLevel={audioLevel}
                />
              )}
              {participants.filter(p => p.userId !== currentUser?.userId).map(p => (
                <VoiceParticipant
                  key={p.id}
                  name={p.username}
                  speaking={false}
                  muted={false}
                  isCurrentUser={false}
                />
              ))}
              {participants.length === 0 && !currentUser && (
                <div className="text-center text-[var(--color-text-muted)] text-sm py-4">
                  暂无参与者
                </div>
              )}
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

function VoiceParticipant({ name, speaking, muted, isCurrentUser, audioLevel }: { name: string; speaking: boolean; muted: boolean; isCurrentUser?: boolean; audioLevel?: number }) {
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
        {/* Audio level ring */}
        {audioLevel !== undefined && audioLevel > 0 && !muted && (
          <div
            className="absolute inset-0 rounded-full border-2 border-[var(--color-primary)] transition-all duration-75"
            style={{
              transform: `scale(${1 + audioLevel / 200})`,
              opacity: 0.3 + (audioLevel / 100) * 0.7,
            }}
          />
        )}
      </div>
      <span className="flex-1 text-sm text-[var(--color-text-normal)] truncate">
        {name}
        {isCurrentUser && <span className="text-[var(--color-primary)] ml-1">(你)</span>}
      </span>
      {muted && <AudioMutedOutlined className="text-xs text-[var(--color-text-muted)]" />}
      {/* Audio level bar */}
      {audioLevel !== undefined && !muted && (
        <div className="w-12 h-1.5 bg-[var(--color-bg-darker)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-75"
            style={{ width: `${audioLevel}%` }}
          />
        </div>
      )}
    </div>
  )
}
