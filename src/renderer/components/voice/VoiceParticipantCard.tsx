import { Avatar } from 'antd'
import { AudioMutedOutlined } from '@ant-design/icons'
import { memo } from 'react'
import { cn } from '@renderer/utils/cn'

export interface VoiceParticipantCardProps {
  /** Display name of the participant */
  readonly name: string
  /** Whether the participant is currently speaking */
  readonly speaking: boolean
  /** Whether the participant is muted */
  readonly muted: boolean
  /** Whether this card represents the current user */
  readonly isCurrentUser?: boolean
  /** Audio level (0-100), used to render the speaking indicator */
  readonly audioLevel?: number
}

/**
 * VoiceParticipantCard - a single voice participant row.
 *
 * Extracted from ChatView's local `VoiceParticipant` helper so that
 * VoicePage and other components can reuse it.
 */
export const VoiceParticipantCard = memo(function VoiceParticipantCard({
  name,
  speaking,
  muted,
  isCurrentUser,
  audioLevel,
}: VoiceParticipantCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200',
        'hover:bg-[var(--color-bg-tertiary)]',
        speaking && 'bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/30',
      )}
    >
      <div className="relative">
        <Avatar
          size={36}
          className={cn(
            'transition-all duration-200',
            speaking && 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg-secondary)]',
          )}
          style={{
            background: speaking
              ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent, #7b2dff))'
              : 'linear-gradient(135deg, var(--color-avatar-gradient-start), var(--color-avatar-gradient-end))',
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
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent, #7b2dff))',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
})

export default VoiceParticipantCard
