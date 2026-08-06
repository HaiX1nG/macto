import { cn } from '@renderer/utils/cn'
import { getAvatarGradient, getAvatarInitial, isValidAvatarUrl } from '@renderer/utils/avatar'
import type { Participant } from '@shared/types/participant'

interface VoiceParticipantListProps {
  participants: Participant[]
  className?: string
  onParticipantClick?: (participant: Participant) => void
}

/**
 * VoiceParticipantList - Grid layout participant list for voice sessions
 *
 * Displays participants in a responsive grid with avatar, username, and audio status.
 * Used in VoiceSessionPage for the main participant grid view.
 */
export default function VoiceParticipantList({
  participants,
  className,
  onParticipantClick,
}: VoiceParticipantListProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4',
        className
      )}
    >
      {participants.map((participant) => (
        <ParticipantCard
          key={participant.id}
          participant={participant}
          onClick={() => onParticipantClick?.(participant)}
        />
      ))}
    </div>
  )
}

interface ParticipantCardProps {
  participant: Participant
  onClick?: () => void
}

function ParticipantCard({ participant, onClick }: ParticipantCardProps) {
  const displayName = participant.username || participant.name

  // Audio status color
  const getStatusColor = () => {
    if (!participant.isOnline) return 'bg-[var(--color-offline)]'
    if (participant.isSpeaking) return 'bg-[var(--color-online)]'
    if (participant.isMuted) return 'bg-[var(--color-dnd)]'
    return 'bg-[var(--color-bg-tertiary)]'
  }

  // Audio status label
  const getStatusLabel = () => {
    if (!participant.isOnline) return '离线'
    if (participant.isSpeaking) return '说话中'
    if (participant.isMuted) return '静音'
    return ''
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-3 p-4 rounded-2xl',
        'bg-[var(--color-bg-secondary)]/50',
        'border border-[var(--color-border)]',
        'transition-all duration-300 ease-out',
        'hover:bg-[var(--color-bg-secondary)]',
        'hover:shadow-lg hover:shadow-[var(--color-bg-darkest)]/10',
        'hover:scale-[1.02]',
        'cursor-pointer',
        onClick && 'active:scale-95'
      )}
    >
      {/* Avatar with status indicator */}
      <div className="relative">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            'text-white text-lg font-bold shadow-lg',
            getAvatarGradient(displayName, 'simple')
          )}
        >
          {isValidAvatarUrl(participant.avatar) ? (
            <img
              src={participant.avatar}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getAvatarInitial(displayName)
          )}
        </div>
        {/* Audio status dot */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full',
            'border-2 border-[var(--color-bg-base)]',
            'transition-all duration-300',
            getStatusColor(),
            participant.isSpeaking && 'animate-pulse shadow-lg'
          )}
        />
      </div>

      {/* Username */}
      <div className="text-center">
        <span
          className={cn(
            'text-sm font-semibold truncate block max-w-[120px]',
            'text-[var(--color-text-primary)]',
            !participant.isOnline && 'text-[var(--color-text-muted)]'
          )}
        >
          {displayName}
        </span>
      </div>

      {/* Audio status text */}
      {getStatusLabel() && (
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            'transition-all duration-300',
            participant.isSpeaking
              ? 'bg-[var(--color-online)]/20 text-[var(--color-online)]'
              : participant.isMuted
                ? 'bg-[var(--color-dnd)]/20 text-[var(--color-dnd)]'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
          )}
        >
          {getStatusLabel()}
        </span>
      )}
    </div>
  )
}
