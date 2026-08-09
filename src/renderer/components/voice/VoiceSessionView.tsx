import { useState, useCallback, useEffect } from 'react'
import { Empty } from 'antd'
import { cn } from '@renderer/utils/cn'
import type { UserStatus } from '@shared/types/auth'
import VoiceParticipantList from './ParticipantList'
import AudioWaveform from './AudioWaveform'
import VoiceControls from './VoiceControls'

/** Local participant interface for voice session display */
interface Participant {
  id: string
  name: string
  username?: string
  avatar?: string
  isOnline: boolean
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  status?: UserStatus
}

interface VoiceSessionViewProps {
  /** Session ID */
  sessionId: string
  /** Session name */
  sessionName?: string
  /** List of participants */
  participants: Participant[]
  /** Whether current user is muted */
  isMuted: boolean
  /** Current volume level */
  volume: number
  /** Audio devices */
  devices?: MediaDeviceInfo[]
  /** Selected device ID */
  selectedDeviceId?: string
  /** Optional analyser node for waveform */
  analyserNode?: AnalyserNode | null
  /** Callback when mute state changes */
  onMuteToggle: () => void
  /** Callback when volume changes */
  onVolumeChange: (volume: number) => void
  /** Callback when device changes */
  onDeviceChange?: (deviceId: string) => void
  /** Callback when user leaves session */
  onLeaveSession: () => void
  /** Callback when participant is clicked */
  onParticipantClick?: (participant: Participant) => void
  /** Optional className */
  className?: string
}

/**
 * VoiceSessionView - Main voice session display component
 *
 * Displays participants in a grid layout with bottom controls
 * and optional side waveform visualization.
 *
 * Moved from src/renderer/components/pages/VoiceSessionPage.tsx.
 */
export default function VoiceSessionView({
  sessionId,
  sessionName,
  participants,
  isMuted,
  volume,
  devices = [],
  selectedDeviceId,
  analyserNode,
  onMuteToggle,
  onVolumeChange,
  onDeviceChange,
  onLeaveSession,
  onParticipantClick,
  className,
}: VoiceSessionViewProps) {
  const [showWaveform, setShowWaveform] = useState(true)
  const [audioData, setAudioData] = useState<number[]>([])

  // Simulate audio data for demonstration when no analyser is provided
  useEffect(() => {
    if (analyserNode) return

    const interval = setInterval(() => {
      const data = Array.from({ length: 60 }, () => Math.random() * 0.8 + 0.1)
      setAudioData(data)
    }, 50)

    return () => clearInterval(interval)
  }, [analyserNode])

  const handleParticipantClick = useCallback(
    (participant: Participant) => {
      onParticipantClick?.(participant)
    },
    [onParticipantClick]
  )

  return (
    <div
      className={cn(
        'flex flex-col h-full w-full',
        'bg-[var(--color-bg-base)]',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-6 py-4',
          'border-b border-[var(--color-border)]',
          'bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-3 h-3 rounded-full bg-[var(--color-online)]',
              'animate-pulse shadow-lg shadow-[var(--color-online)]/30'
            )}
          />
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {sessionName || '语音会话'}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              {participants.length} 位参与者 · ID: {sessionId}
            </p>
          </div>
        </div>

        {/* Toggle waveform button */}
        <button
          onClick={() => setShowWaveform(!showWaveform)}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium',
            'transition-all duration-200',
            showWaveform
              ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]',
            'hover:scale-105 active:scale-95'
          )}
        >
          {showWaveform ? '隐藏波形' : '显示波形'}
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Participant Grid */}
        <div className="flex-1 overflow-y-auto">
          {participants.length > 0 ? (
            <VoiceParticipantList
              participants={participants}
              onParticipantClick={handleParticipantClick}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Empty
                description="暂无参与者"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </div>

        {/* Side Waveform Panel */}
        {showWaveform && (
          <div
            className={cn(
              'w-80 flex-shrink-0 border-l border-[var(--color-border)]',
              'bg-[var(--color-bg-secondary)]/30 backdrop-blur-sm',
              'flex flex-col gap-4 p-4',
              'transition-all duration-300 ease-out'
            )}
          >
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              音频波形
            </h3>
            <AudioWaveform
              audioData={analyserNode ? undefined : audioData}
              analyserNode={analyserNode || undefined}
              height={160}
            />

            {/* Mini participant list in sidebar */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                参与者 ({participants.length})
              </h3>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-xl',
                      'transition-all duration-200',
                      'hover:bg-[var(--color-bg-tertiary)]/50',
                      'cursor-pointer'
                    )}
                    onClick={() => handleParticipantClick(participant)}
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        !participant.isOnline && 'bg-[var(--color-offline)]',
                        participant.isOnline && participant.isSpeaking && 'bg-[var(--color-online)] animate-pulse',
                        participant.isOnline && !participant.isSpeaking && 'bg-[var(--color-bg-tertiary)]'
                      )}
                    />
                    <span className="text-sm text-[var(--color-text-primary)] truncate">
                      {participant.username || participant.name}
                    </span>
                    {participant.isMuted && (
                      <span className="text-xs text-[var(--color-dnd)] ml-auto">
                        静音
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <VoiceControls
        isMuted={isMuted}
        volume={volume}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onMuteToggle={onMuteToggle}
        onVolumeChange={onVolumeChange}
        onDeviceChange={onDeviceChange}
        onLeaveSession={onLeaveSession}
      />
    </div>
  )
}
