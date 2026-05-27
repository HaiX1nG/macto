import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Avatar, App } from 'antd'
import { useRoomStore, getChannelFromRoom } from '@renderer/stores/serverStore'
import { useChatStore, type MessageWithStatus } from '@renderer/stores/chatStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { useAudioStore } from '@renderer/stores/voiceStore'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { SearchMessages } from './SearchMessages'
import {
  AudioOutlined,
  AudioMutedOutlined,
  BellOutlined,
  PushpinOutlined,
  NumberOutlined,
  UserOutlined,
  SearchOutlined,
  InboxOutlined,
  SoundOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { voiceService } from '@renderer/services'
import { SkeletonMessageList } from '@renderer/components/ui/Skeleton'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import { motion, AnimatePresence } from 'framer-motion'
import type { Channel, Message } from '@shared/types/kook'
import type { VoiceSessionResponse, MessageResponse } from '@shared/types/api'

export function ChatView() {
  const { message: messageApi } = App.useApp()
  const { rooms, currentRoomId, currentChannelId, getServerMembers, setCurrentChannel } = useRoomStore()
  const {
    messages,
    pinnedMessages,
    fetchMessages,
    sendMessage,
    isLoading,
    hasMore,
    replyingTo,
    setReplyingTo,
    clearMessages,
    pinMessage,
    unpinMessage,
    retryMessage,
    editMessage,
    deleteMessageAsync,
    editingMessageId,
    deletingMessageId,
  } = useChatStore()
  const { currentUser } = useAuthStore()

  const currentRoom = rooms.find(r => String(r.id) === currentRoomId)
  const channels = useMemo(() => currentRoomId ? getChannelFromRoom(currentRoomId) : [], [currentRoomId])
  const currentChannel = channels.find((c: Channel) => c.id === currentChannelId)

  // Scroll state for smooth scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)

  const serverMembers = useMemo(() => {
    if (!currentRoomId) return []
    const members = getServerMembers(currentRoomId)
    return members.map(m => ({
      id: m.userId,
      username: m.user.name,
      displayName: m.nickname || m.user.displayName,
      avatar: m.user.avatar,
    }))
  }, [currentRoomId, getServerMembers])

  useEffect(() => {
    if (currentChannelId && currentChannel?.type !== 'voice') {
      clearMessages()
      fetchMessages(Number(currentChannelId), { pageSize: 50 })
      setShouldScrollToBottom(true)
    }
  }, [currentChannelId, currentChannel?.type, fetchMessages, clearMessages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setShouldScrollToBottom(false)
    }
  }, [messages, shouldScrollToBottom])

  const channelMessages: MessageWithStatus[] = messages.map(msg => ({
    ...msg,
  }))

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

  const handleSendMessage = useCallback(async (content: string, attachments?: { url: string; type: 'image' | 'video' | 'audio' | 'file'; filename: string; size: number }[]) => {
    if (!currentChannelId) return

    try {
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const messageType = attachment.type === 'image' ? 2 : 1
          await sendMessage(Number(currentChannelId), {
            messageType,
            content: attachment.url,
          })
        }
      }

      if (content.trim()) {
        await sendMessage(Number(currentChannelId), {
          messageType: 1,
          content: content.trim(),
        })
      }
      setShouldScrollToBottom(true)
    } catch (_err) {
      messageApi.error('发送消息失败')
    }
  }, [currentChannelId, sendMessage, messageApi])

  const handleLoadMore = useCallback(() => {
    if (currentChannelId && hasMore && !isLoading) {
      fetchMessages(Number(currentChannelId), { page: 2, pageSize: 50 })
    }
  }, [currentChannelId, hasMore, isLoading, fetchMessages])

  const handleReply = useCallback((message: Message) => {
    const originalMsg = messages.find(m => String(m.id) === message.id)
    if (originalMsg) {
      setReplyingTo(originalMsg)
    }
  }, [messages, setReplyingTo])

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [setReplyingTo])

  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    if (!currentChannelId) return

    const numericMessageId = Number(messageId)
    const numericRoomId = Number(currentChannelId)

    try {
      await editMessage(numericRoomId, numericMessageId, content)
      messageApi.success('消息已更新')
    } catch (_err) {
      messageApi.error('更新消息失败')
    }
  }, [currentChannelId, messageApi, editMessage])

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!currentChannelId) return

    const numericMessageId = Number(messageId)
    const numericRoomId = Number(currentChannelId)

    try {
      await deleteMessageAsync(numericRoomId, numericMessageId)
      messageApi.success('消息已删除')
    } catch (_err) {
      messageApi.error('删除消息失败')
    }
  }, [currentChannelId, messageApi, deleteMessageAsync])

  const handlePinMessage = useCallback((messageId: string) => {
    const isPinned = pinnedMessages.some(m => String(m.id) === messageId)
    if (isPinned) {
      unpinMessage(Number(messageId))
    } else {
      pinMessage(Number(messageId))
    }
  }, [pinnedMessages, pinMessage, unpinMessage])

  const handleUnpinMessage = useCallback((messageId: string) => {
    unpinMessage(Number(messageId))
  }, [unpinMessage])

  const handleRetryMessage = useCallback((retryId: string) => {
    const msg = messages.find(m => m._retryId === retryId)
    if (msg && currentChannelId) {
      retryMessage(retryId, Number(currentChannelId), {
        messageType: msg.messageType,
        content: msg.content,
      })
    }
  }, [messages, currentChannelId, retryMessage])

  const [searchOpen, setSearchOpen] = useState(false)

  const handleSearchMessageClick = useCallback((message: MessageResponse) => {
    const channel = channels.find((c: Channel) => c.id === String(message.roomId))
    if (channel) {
      setCurrentChannel(String(message.roomId))
    }
  }, [channels, setCurrentChannel])

  const typingIndicator = useTypingIndicator(currentChannelId ? Number(currentChannelId) : null)

  if (!currentRoom || !currentChannel) {
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
        <div className="h-[var(--header-height)] px-4 flex items-center gap-4 border-b border-[var(--color-border)] flex-shrink-0">
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

        {/* Reply bar */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="px-4 py-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] flex items-center gap-2 overflow-hidden"
            >
              <span className="text-xs text-[var(--color-text-muted)]">
                回复 <span className="text-[var(--color-primary)] font-medium">{replyingTo.senderName}</span>:
              </span>
              <span className="text-sm text-[var(--color-text-normal)] truncate flex-1">
                {replyingTo.content.slice(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}
              </span>
              <button
                onClick={handleCancelReply}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] px-2 py-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                取消
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {typingIndicator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-1 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] overflow-hidden"
            >
              <span className="text-xs text-[var(--color-text-muted)]">
                <span className="text-[var(--color-primary)]">{typingIndicator}</span> 正在输入...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        {isLoading && messages.length === 0 ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <SkeletonMessageList count={8} />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden relative">
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
              onRetry={handleRetryMessage}
              editingMessageId={editingMessageId}
              deletingMessageId={deletingMessageId}
            />
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput
            onSend={handleSendMessage}
            channelName={currentChannel.name}
            replyingTo={replyingTo ? { name: replyingTo.senderName, content: replyingTo.content } : null}
            onCancelReply={handleCancelReply}
            members={serverMembers}
          />
        </div>
      </div>

      <SearchMessages
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onMessageClick={handleSearchMessageClick}
      />
    </>
  )
}

function useTypingIndicator(roomId: number | null) {
  const typingUsers = useChatStore(state => state.typingUsers)
  const currentUser = useAuthStore(state => state.currentUser)

  const usersTyping = useMemo(() => {
    if (!roomId) return []
    const roomTyping = typingUsers.get(roomId) || []
    return roomTyping.filter(u => u.userId !== currentUser?.userId)
  }, [roomId, typingUsers, currentUser?.userId])

  if (usersTyping.length === 0) return null
  if (usersTyping.length === 1) return usersTyping[0].username
  if (usersTyping.length === 2) return `${usersTyping[0].username} 和 ${usersTyping[1].username}`
  return `${usersTyping[0].username} 和其他 ${usersTyping.length - 1} 人`
}

function HeaderBtn({ icon, onClick, active }: { icon: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-lg transition-[transform,background-color,color] duration-150",
        "hover:scale-105 active:scale-95",
        active
          ? "text-[var(--color-primary)] bg-[var(--color-primary)]/15 shadow-sm shadow-[var(--color-primary)]/20"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-tertiary)]"
      )}
    >
      {icon}
    </button>
  )
}

function VoiceChannelView({ channel }: { channel: Channel }) {
  const { message: messageApi } = App.useApp()
  const { currentUser } = useAuthStore()
  const { isCapturing, isSpeaking, audioLevel, joinVoice: storeJoinVoice, leaveVoice: storeLeaveVoice, isMuted: storeMuted, setMute: storeSetMute, error: voiceError, clearError } = useAudioStore()
  const [isConnected, setIsConnected] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [volume, setVolume] = useState(100)
  const [participants, setParticipants] = useState<VoiceSessionResponse[]>([])
  const [loading, setLoading] = useState(false)

  const roomId = Number(channel.serverId)

  useEffect(() => {
    setIsConnected(isCapturing)
  }, [isCapturing])

  useEffect(() => {
    if (voiceError) {
      messageApi.error(voiceError)
      clearError()
    }
  }, [voiceError, messageApi, clearError])

  useEffect(() => {
    if (isConnected && roomId) {
      const fetchParticipants = async () => {
        try {
          const result = await voiceService.getVoiceParticipants(roomId)
          setParticipants(result)
        } catch (err) {
          console.error('Failed to fetch voice participants:', err)
        }
      }
      fetchParticipants()
      const interval = setInterval(fetchParticipants, 5000)
      return () => clearInterval(interval)
    }
  }, [isConnected, roomId])

  const handleJoinVoice = async () => {
    if (!roomId) {
      messageApi.error('无效的语音频道')
      return
    }
    setLoading(true)
    try {
      await storeJoinVoice(roomId)
      messageApi.success('已加入语音频道')
    } catch (err) {
      console.error('[ChatView] Failed to join voice:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveVoice = async () => {
    if (!roomId) return
    try {
      await storeLeaveVoice(roomId)
      setIsDeafened(false)
      setParticipants([])
      messageApi.success('已离开语音频道')
    } catch (err) {
      console.error('[ChatView] Failed to leave voice:', err)
      messageApi.warning('已断开本地连接')
    }
  }

  const handleSetMute = async () => {
    try {
      await storeSetMute(!storeMuted)
    } catch (err) {
      console.error('Failed to set mute:', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-base)]">
      <div className="h-[var(--header-height)] px-4 flex items-center gap-4 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-base)]">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isConnected ? "bg-[var(--color-primary)]/20" : "bg-[var(--color-bg-tertiary)]"
          )}>
            <AudioOutlined className={cn(
              "text-lg",
              isConnected ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
            )} />
          </div>
          <span className="font-semibold text-[var(--color-text-normal)]">{channel.name}</span>
          {isConnected && (
            <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-[var(--color-online)]/20 text-[var(--color-online)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-online)] animate-pulse" />
              已连接
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={isConnected ? handleLeaveVoice : handleJoinVoice}
            disabled={loading}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
              isConnected
                ? "bg-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/90 text-white"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? '连接中...' : isConnected ? '断开' : '加入语音'}
          </button>
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

      <div className="flex-1 flex min-h-0">
        {/* Voice status area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Voice status bar when connected */}
          {isConnected && (
            <div className="px-4 py-2 bg-[var(--color-primary)]/10 border-b border-[var(--color-primary)]/20 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-online)] animate-pulse" />
                <span className="text-sm text-[var(--color-text-normal)]">语音通话中</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {currentUser && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-bg-tertiary)]">
                    <Avatar size={20} className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]">
                      {currentUser.username.charAt(0)}
                    </Avatar>
                    <span className="text-xs text-[var(--color-text-normal)]">{currentUser.username}</span>
                    {storeMuted && <AudioMutedOutlined className="text-xs text-[var(--color-dnd)]" />}
                  </div>
                )}
                {participants.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-bg-tertiary)]">
                    <Avatar size={20} className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]">
                      {p.username.charAt(0)}
                    </Avatar>
                    <span className="text-xs text-[var(--color-text-normal)]">{p.username}</span>
                  </div>
                ))}
                {participants.length > 3 && (
                  <span className="text-xs text-[var(--color-text-muted)]">+{participants.length - 3}</span>
                )}
              </div>
            </div>
          )}

          {/* Empty state for voice channel */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AudioOutlined className="text-4xl text-[var(--color-text-muted)] mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-[var(--color-text-normal)] mb-2">{channel.name}</h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              {isConnected ? '语音通话中' : '点击上方按钮加入语音频道开始通话'}
            </p>
          </div>
        </div>

        {/* Voice participants sidebar - only when connected */}
        {isConnected && (
          <div className="w-[240px] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-[var(--color-border)]">
              <h4 className="text-sm font-semibold text-[var(--color-text-normal)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-online)] animate-pulse" />
                语音参与者
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[var(--color-bg-darker)] text-xs">
                  {participants.length + 1}
                </span>
              </h4>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
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
            </div>

            <div className="p-3 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-2">
                <SoundOutlined className="text-[var(--color-text-muted)] text-sm" />
                <span className="text-xs text-[var(--color-text-muted)]">输出音量</span>
                <span className="text-xs text-[var(--color-primary)] ml-auto">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-[var(--color-bg-darker)] rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${volume}%, var(--color-bg-darker) ${volume}%)`
                }}
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
      "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200",
      "hover:bg-[var(--color-bg-tertiary)]",
      speaking && "bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/30"
    )}>
      <div className="relative">
        <Avatar
          size={36}
          className={cn(
            "transition-all duration-200",
            speaking && "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg-secondary)]"
          )}
          style={{
            background: speaking
              ? `linear-gradient(135deg, var(--color-primary), var(--color-accent, #7b2dff))`
              : `linear-gradient(135deg, var(--color-avatar-gradient-start), var(--color-avatar-gradient-end))`
          }}
        >
          {name.charAt(0)}
        </Avatar>
        {speaking && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-[var(--color-primary)]" />
        )}
        {audioLevel !== undefined && audioLevel > 0 && !muted && (
          <div
            className="absolute inset-0 rounded-full border-2 border-[var(--color-primary)] transition-all duration-75"
            style={{
              transform: `scale(${1 + audioLevel / 200})`,
              opacity: 0.3 + (audioLevel / 100) * 0.7,
            }}
          />
        )}
        {muted && (
          <div className="absolute inset-0 rounded-full bg-[var(--color-overlay)] flex items-center justify-center">
            <AudioMutedOutlined className="text-xs text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-normal)] truncate">
            {name}
          </span>
          {isCurrentUser && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
              你
            </span>
          )}
        </div>
        {audioLevel !== undefined && !muted && (
          <div className="w-full h-1 bg-[var(--color-bg-darker)] rounded-full overflow-hidden mt-1">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${audioLevel}%`,
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent, #7b2dff))'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatView
