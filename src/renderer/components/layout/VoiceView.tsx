/**
 * VoiceView Component
 *
 * The voice channel view for real-time voice communication.
 */

import React from 'react'
import { Button, Typography, Slider } from 'antd'
import { AudioOutlined, AudioMutedOutlined, SoundOutlined, SettingOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

const { Text } = Typography

interface Participant {
  id: string
  name: string
  status: 'online' | 'away' | 'busy'
  isMuted?: boolean
  volume?: number
}

interface VoiceViewProps {
  participants: Participant[]
  onMuteToggle?: (participantId: string) => void
  onVolumeChange?: (participantId: string, volume: number) => void
  onDeviceSettings?: () => void
  currentVolume?: number
}

export const VoiceView: React.FC<VoiceViewProps> = ({
  participants = [],
  onMuteToggle,
  onVolumeChange,
  onDeviceSettings,
  currentVolume = 70,
}) => {
  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary-light)] dark:bg-[var(--color-bg-dark)] transition-colors duration-300">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={cn(
          'h-16 bg-white dark:bg-[var(--color-bg-dark)]',
          'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
          'flex items-center justify-between px-6',
          'sticky top-0 z-10',
          'transition-colors duration-300'
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
              'flex items-center justify-center',
              'text-[var(--color-primary)] dark:text-[var(--color-primary)]'
            )}>
              <AudioOutlined className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">语音频道</h1>
              <Text type="secondary" className="text-xs">实时语音交流</Text>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-[var(--color-success-light)] dark:bg-[var(--color-success-light)]/10',
              'text-[var(--color-success)] dark:text-[var(--color-success)]',
              'text-sm font-medium'
            )}>
              <span className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse" />
              {participants.length} 人在线
            </div>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={onDeviceSettings}
              className={cn(
                'w-10 h-10 rounded-xl',
                'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
                'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
                'hover:text-[var(--color-primary)] dark:hover:text-[var(--color-primary)]'
              )}
            />
          </div>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 p-6 overflow-y-auto pb-32">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={cn(
                'w-24 h-24 rounded-3xl',
                'bg-gradient-to-br from-[var(--color-primary)] to-purple-600',
                'flex items-center justify-center mb-6',
                'shadow-2xl shadow-[var(--color-primary)]/30'
              )}>
                <AudioOutlined className="text-5xl text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-3">
                暂无参与者
              </h3>
              <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-8 max-w-md">
                邀请朋友加入语音频道，开始实时交流
              </p>
              <Button
                type="primary"
                size="large"
                className="px-10 rounded-xl font-semibold"
              >
                邀请朋友
              </Button>
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
          'bg-white/95 dark:bg-[var(--color-bg-dark)]/95',
          'backdrop-blur-lg',
          'border-t border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
          'p-5 z-50',
          'shadow-2xl shadow-black/10 dark:shadow-black/50',
          'transition-colors duration-300'
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
              <SoundOutlined className="text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)]" />
              <Slider
                value={currentVolume}
                onChange={onVolumeChange}
                min={0}
                max={100}
                className="flex-1 max-w-md"
              />
              <span className="text-sm font-medium text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] w-12 text-right">
                {currentVolume}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ParticipantCardProps {
  participant: Participant
  onMuteToggle?: (id: string) => void
  onVolumeChange?: (id: string, volume: number) => void
}

const ParticipantCard = ({ participant, onMuteToggle, onVolumeChange }: ParticipantCardProps) => {
  const statusColors = {
    online: 'bg-green-500 shadow-green-500/30',
    away: 'bg-yellow-500 shadow-yellow-500/30',
    busy: 'bg-red-500 shadow-red-500/30',
  }

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-cyan-500 to-blue-600',
    ]
    return gradients[name.charCodeAt(0) % gradients.length]
  }

  return (
    <div className={cn(
      'bg-white dark:bg-[var(--color-bg-tertiary-dark)] rounded-2xl p-6',
      'border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'hover:border-[var(--color-primary)] dark:hover:border-[var(--color-primary)]',
      'hover:shadow-xl hover:-translate-y-1',
      'transition-all duration-300 group'
    )}>
      <div className="flex flex-col items-center gap-5">
        {/* Avatar */}
        <div className="relative">
          <div className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center',
            'text-3xl font-bold text-white shadow-lg',
            getAvatarGradient(participant.name),
            statusColors[participant.status]
          )}>
            {participant.name.charAt(0).toUpperCase()}
          </div>
          {participant.isMuted && (
            <div className={cn(
              'absolute -top-2 -right-2 w-8 h-8 rounded-full',
              'bg-red-500 flex items-center justify-center',
              'text-white border-4 border-white dark:border-[#1a1a25]',
              'shadow-lg'
            )}>
              <AudioMutedOutlined className="text-sm" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center w-full">
          <h3 className="text-lg font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
            {participant.name}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mt-1">
            {participant.isMuted ? '已静音' : '说话中'}
          </p>
        </div>

        {/* Volume */}
        {participant.volume !== undefined && (
          <div className="w-full px-2">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">音量</Text>
              <Text className="text-xs font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
                {participant.volume}%
              </Text>
            </div>
            <Slider
              value={participant.volume}
              onChange={(value) => onVolumeChange?.(participant.id, value)}
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
                ? 'bg-[var(--color-success)] hover:bg-[var(--color-success-hover)] text-white shadow-[var(--color-success)]/30'
                : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-[var(--color-primary)]/30'
            )}
          >
            {participant.isMuted ? '取消静音' : '静音'}
          </button>
          <button className={cn(
            'flex-1 px-4 py-3 rounded-xl text-sm font-semibold',
            'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
            'hover:bg-[var(--color-border-light)] dark:hover:bg-[var(--color-border-dark)]',
            'text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
            'transition-all duration-200'
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
          'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
          'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
          'hover:bg-[var(--color-border-light)] dark:hover:bg-[var(--color-border-dark)]'
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