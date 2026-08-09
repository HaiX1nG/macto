import type { ReactNode } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Avatar, App } from 'antd'
import {
  AudioOutlined,
  AudioMutedOutlined,
  SoundOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useServerStore } from '@renderer/stores/serverStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { useMediaStore } from '@renderer/stores/mediaStore'
import { useVoiceStore } from '@renderer/stores/voiceStore'
import { useUIStore } from '@renderer/stores/uiStore'
import { voiceService } from '@renderer/services'
import { HeaderButton } from '@renderer/components/ui/HeaderButton'
import { VoiceParticipantCard } from '@renderer/components/voice/VoiceParticipantCard'
import { NoChannelSelected } from '@renderer/components/ui/EmptyState'
import { cn } from '@renderer/utils/cn'
import type { ViewPageProps } from '@renderer/config/viewRegistry'
import type { Channel } from '@shared/types/channel'
import type { VoiceParticipant } from '@shared/types/voice'

/**
 * VoicePage - 语音频道会话页。
 *
 * 从 ChatView 的 VoiceChannelView 提取而来。负责语音频道的
 * join/leave/mute 操作、参与者列表与音量控制。
 */
export function VoicePage({ params }: ViewPageProps): ReactNode {
  const { message: messageApi } = App.useApp()
  const { currentServer } = useServerStore()
  const { currentChannelId } = useUIStore()
  const { currentUser } = useAuthStore()
  const { isMuted: storeMuted, setMute: storeSetMute, isSpeaking, error: voiceError, clearError } = useVoiceStore()
  const { isCapturing, startCapture, stopCapture } = useMediaStore()

  const [isConnected, setIsConnected] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [volume, setVolume] = useState(100)
  const [participants, setParticipants] = useState<VoiceParticipant[]>([])
  const [loading, setLoading] = useState(false)

  const currentRoom = currentServer
  const targetChannelId = params.channelId ?? currentChannelId ?? undefined

  const channels: Channel[] = currentRoom?.channels ?? []
  const currentChannel = channels.find((c) => c.id === targetChannelId)

  const roomId = currentChannel ? currentChannel.serverId : 0

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

  const handleJoinVoice = useCallback(async () => {
    if (!roomId) {
      messageApi.error('无效的语音频道')
      return
    }
    setLoading(true)
    try {
      await voiceService.joinVoice(roomId)
      await startCapture(roomId)
      messageApi.success('已加入语音频道')
    } catch (err) {
      console.error('[VoicePage] Failed to join voice:', err)
    } finally {
      setLoading(false)
    }
  }, [roomId, startCapture, messageApi])

  const handleLeaveVoice = useCallback(async () => {
    if (!roomId) return
    try {
      // stopCapture handles leaveVoice API call and WebRTC cleanup
      await stopCapture()
      setIsDeafened(false)
      setParticipants([])
      messageApi.success('已离开语音频道')
    } catch (err) {
      console.error('[VoicePage] Failed to leave voice:', err)
      messageApi.warning('已断开本地连接')
    }
  }, [roomId, stopCapture, messageApi])

  const handleSetMute = useCallback(async () => {
    try {
      await storeSetMute(!storeMuted)
    } catch (err) {
      console.error('Failed to set mute:', err)
    }
  }, [storeMuted, storeSetMute])

  const handleDeafenToggle = useCallback(() => {
    setIsDeafened((prev) => !prev)
  }, [])

  if (!currentRoom || !currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-base)]">
        <NoChannelSelected />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-base)]">
      <div className="h-[var(--header-height)] px-4 flex items-center gap-4 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-base)]">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isConnected ? 'bg-[var(--color-primary)]/20' : 'bg-[var(--color-bg-tertiary)]',
            )}
          >
            <AudioOutlined
              className={cn(
                'text-lg',
                isConnected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
              )}
            />
          </div>
          <span className="font-semibold text-[var(--color-text-normal)]">{currentChannel.name}</span>
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
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              isConnected
                ? 'bg-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/90 text-white'
                : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white',
              loading && 'opacity-50 cursor-not-allowed',
            )}
          >
            {loading ? '连接中...' : isConnected ? '断开' : '加入语音'}
          </button>
          {isConnected && (
            <>
              <HeaderButton
                icon={storeMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                onClick={handleSetMute}
                active={storeMuted}
                label={storeMuted ? '取消静音' : '静音'}
              />
              <HeaderButton
                icon={<SoundOutlined />}
                onClick={handleDeafenToggle}
                active={isDeafened}
                label="耳聋"
              />
            </>
          )}
          <HeaderButton icon={<UserOutlined />} label="用户" />
          <HeaderButton icon={<SettingOutlined />} label="设置" />
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
                {participants.slice(0, 3).map((p) => (
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
            <h3 className="text-lg font-semibold text-[var(--color-text-normal)] mb-2">{currentChannel.name}</h3>
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
                <VoiceParticipantCard
                  name={currentUser.username}
                  speaking={isSpeaking}
                  muted={storeMuted}
                  isCurrentUser
                />
              )}
              {participants
                .filter((p) => p.userId !== currentUser?.id)
                .map((p) => (
                  <VoiceParticipantCard key={p.id} name={p.username} speaking={false} muted={false} />
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
                  background: `linear-gradient(to right, var(--color-primary) ${volume}%, var(--color-bg-darker) ${volume}%)`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoicePage
