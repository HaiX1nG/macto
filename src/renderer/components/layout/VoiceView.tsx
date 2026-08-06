/**
 * @deprecated 此组件已在页面结构重塑（Phase 1A-1D）中弃用。
 * 由 src/renderer/pages/VoicePage + NavigationShell 替代。
 * 后续清理阶段将删除此文件，请勿在新代码中引用。
 *
 * VoiceView Component
 *
 * The voice channel view for real-time voice communication.
 */

import React from 'react'
import { Button, Typography, Slider } from 'antd'
import { AudioOutlined, AudioMutedOutlined, SoundOutlined, SettingOutlined, VideoCameraOutlined, UserAddOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { Skeleton, SkeletonAvatar } from '@renderer/components/ui/Skeleton'
import { getAvatarGradient, getAvatarInitial } from '@renderer/utils/avatar'
import { statusColorMap, getStatusLabel } from '@renderer/utils/status'
import { PlaylistPanel } from '@renderer/components/playlist/PlaylistPanel'
import type { VoiceParticipant } from '@shared/types/participant'

const { Text } = Typography

interface VoiceViewProps {
  participants: VoiceParticipant[]
  roomId?: number
  onMuteToggle?: (participantId: string) => void
  onVolumeChange?: (participantId: string, volume: number) => void
  onDeviceSettings?: () => void
  currentVolume?: number
  loading?: boolean
}

export const VoiceView: React.FC<VoiceViewProps> = ({
  participants = [],
  roomId,
  onMuteToggle,
  onVolumeChange,
  onDeviceSettings,
  currentVolume = 70,
  loading = false,
}) => {
  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary)] animate-fade-in will-change-[opacity]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={cn(
          'h-[var(--header-height)] bg-[var(--color-bg-base)]',
          'border-b border-[var(--color-border)]',
          'flex items-center justify-between px-6',
          'sticky top-0 z-10',
          'transition-colors duration-200'
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-[var(--color-primary)]/10',
              'flex items-center justify-center',
              'text-[var(--color-primary)]'
            )}>
              <AudioOutlined className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-normal)]">语音频道</h1>
              <Text className="text-xs text-[var(--color-text-muted)]">实时语音交流</Text>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-[var(--color-online)]/10',
              'text-[var(--color-online)]',
              'text-sm font-medium'
            )}>
              <span className="w-2 h-2 bg-[var(--color-online)] rounded-full animate-pulse" />
              {participants.length} 人在线
            </div>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={onDeviceSettings}
              className={cn(
                'w-10 h-10 rounded-xl',
                'text-[var(--color-text-muted)]',
                'hover:bg-[var(--color-bg-tertiary)]',
                'hover:text-[var(--color-primary)]'
              )}
            />
          </div>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 p-6 overflow-y-auto pb-32">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-6 bg-[var(--color-bg-base)] border border-[var(--color-border)]">
                  <div className="flex flex-col items-center gap-4">
                    <SkeletonAvatar size={96} />
                    <Skeleton variant="rect" width="75%" height={18} />
                    <Skeleton variant="text" width="50%" height={14} />
                    <div className="w-full mt-2">
                      <Skeleton variant="rect" width="100%" height={40} className="rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : participants.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                iconType="audio"
                title="暂无参与者"
                description="邀请朋友加入语音频道，开始实时交流"
                action={{
                  label: '邀请朋友',
                  onClick: () => {},
                  icon: <UserAddOutlined />,
                  variant: 'primary',
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {participants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  onMuteToggle={onMuteToggle}
                  onVolumeChange={onVolumeChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className={cn(
          'fixed bottom-0 left-0 right-0',
          'bg-[var(--color-bg-base)]/95',
          'backdrop-blur-xl',
          'border-t border-[var(--color-border)]',
          'p-5 z-50',
          'shadow-2xl shadow-black/10',
          'transition-colors duration-200'
        )}>
          <div className="max-w-4xl mx-auto">
            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <ControlButton icon={<AudioOutlined />} label="麦克风" active />
              <ControlButton icon={<SoundOutlined />} label="扬声器" active />
              <ControlButton icon={<VideoCameraOutlined />} label="屏幕分享" />
            </div>
            {/* Volume Slider */}
            <div className="flex items-center justify-center gap-4">
              <SoundOutlined className="text-[var(--color-text-muted)]" />
              <Slider
                value={currentVolume}
                min={0}
                max={100}
                className="flex-1 max-w-md"
              />
              <span className="text-sm font-medium text-[var(--color-text-muted)] w-12 text-right">
                {currentVolume}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Sidebar */}
      {roomId && (
        <div className={cn(
          'w-80 border-l border-[var(--color-border)]',
          'bg-[var(--color-bg-secondary)]',
          'hidden lg:block',
          'overflow-y-auto'
        )}>
          <div className="p-4">
            <PlaylistPanel roomId={roomId} />
          </div>
        </div>
      )}
    </div>
  )
}

interface ParticipantCardProps {
  participant: VoiceParticipant
  onMuteToggle?: (id: string) => void
  onVolumeChange?: (id: string, volume: number) => void
}

const ParticipantCard = ({ participant, onMuteToggle, onVolumeChange }: ParticipantCardProps) => {

  return (
    <div className={cn(
      'bg-[var(--color-bg-base)] rounded-2xl p-6',
      'border border-[var(--color-border)]',
      'hover:border-[var(--color-primary)]',
      'hover:shadow-xl hover:-translate-y-1',
      'transition-[transform,box-shadow,border-color] duration-200 group'
    )}>
      <div className="flex flex-col items-center gap-5">
        {/* Avatar */}
        <div className="relative">
          <div className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center',
            'text-3xl font-bold text-white shadow-lg',
            getAvatarGradient(participant.name, 'extended')
          )}>
            {getAvatarInitial(participant.name)}
          </div>
          {participant.isMuted && (
            <div className={cn(
              'absolute -top-2 -right-2 w-8 h-8 rounded-full',
              'bg-[var(--color-dnd)] flex items-center justify-center',
              'text-white border-4 border-[var(--color-bg-base)]',
              'shadow-lg'
            )}>
              <AudioMutedOutlined className="text-sm" />
            </div>
          )}
          {/* Status Indicator */}
          <div className={cn(
            'absolute bottom-1 right-1 w-5 h-5 rounded-full',
            'border-3 border-[var(--color-bg-base)]',
            statusColorMap[participant.status]
          )} />
        </div>

        {/* Name */}
        <div className="text-center w-full">
          <h3 className="text-lg font-semibold text-[var(--color-text-normal)]">
            {participant.name}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {participant.status !== 'online' ? getStatusLabel(participant.status) : participant.isMuted ? '已静音' : '说话中'}
          </p>
        </div>

        {/* Volume */}
        {participant.volume !== undefined && (
          <div className="w-full px-2">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-xs text-[var(--color-text-muted)]">音量</Text>
              <Text className="text-xs font-medium text-[var(--color-text-normal)]">
                {participant.volume}%
              </Text>
            </div>
            <Slider
              value={participant.volume}
              onChange={(value) => {
                if (typeof value === 'number') {
                  onVolumeChange?.(participant.id, value)
                }
              }}
              min={0}
              max={100}
              className="w-full"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <button
            onClick={() => onMuteToggle?.(participant.id)}
            className={cn(
              'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
              'transition-all duration-200 shadow-lg',
              participant.isMuted
                ? 'bg-[var(--color-online)] hover:opacity-90 text-white shadow-[var(--color-online)]/30'
                : 'bg-[var(--color-primary)] hover:opacity-90 text-white shadow-[var(--color-primary)]/30'
            )}
          >
            {participant.isMuted ? '取消静音' : '静音'}
          </button>
          <button className={cn(
            'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
            'bg-[var(--color-bg-tertiary)]',
            'hover:bg-[var(--color-border)]',
            'text-[var(--color-text-normal)]',
            'transition-[background-color,transform] duration-150'
          )}>
            拉黑
          </button>
        </div>
      </div>
    </div>
  )
}

interface ControlButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
}

const ControlButton = ({ icon, label, active = false }: ControlButtonProps) => (
  <button className={cn(
    'flex flex-col items-center gap-2 px-6 py-4 rounded-2xl',
    'transition-all duration-200 group',
    'hover:scale-105 active:scale-95',
    active
      ? cn(
          'bg-[var(--color-primary)] text-white',
          'shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40'
        )
      : cn(
          'bg-[var(--color-bg-tertiary)]',
          'text-[var(--color-text-muted)]',
          'hover:bg-[var(--color-border)]'
        )
  )}>
    <div className={cn(
      'transition-transform group-hover:scale-110',
      active && 'animate-pulse'
    )}>
      <span className="text-2xl">{icon}</span>
    </div>
    <span className="text-xs font-medium">{label}</span>
  </button>
)
