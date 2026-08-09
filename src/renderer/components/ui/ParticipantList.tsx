import { cn } from '@renderer/utils/cn'
import { Badge } from './Badge'
import { getAvatarGradient, getAvatarInitial, isValidAvatarUrl } from '@renderer/utils/avatar'
import { statusColorsWithShadow, getAudioStatusLabel } from '@renderer/utils/status'
import type { UserStatus } from '@shared/types/auth'

/** Local participant interface for UI display */
interface Participant {
  id: string
  name: string
  username?: string
  avatar?: string
  isOnline: boolean
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  isScreenSharing?: boolean
  isStreaming?: boolean
  status?: UserStatus
}

interface ParticipantListProps {
  participants: Participant[]
  className?: string
  onParticipantClick?: (participant: Participant) => void
}

export const ParticipantList = ({
  participants,
  className,
  onParticipantClick
}: ParticipantListProps) => {
  const onlineParticipants = participants.filter(p => p.isOnline)
  const offlineParticipants = participants.filter(p => !p.isOnline)

  return (
    <div className={cn('space-y-5', className)}>
      {/* Online Participants */}
      {onlineParticipants.length > 0 && (
        <div>
          <h3 className="px-4 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-online)] animate-pulse" />
            在线 ({onlineParticipants.length})
          </h3>
          <div className="space-y-1">
            {onlineParticipants.map(participant => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                onClick={() => onParticipantClick?.(participant)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Offline Participants */}
      {offlineParticipants.length > 0 && (
        <div>
          <h3 className="px-4 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-offline)]" />
            离线 ({offlineParticipants.length})
          </h3>
          <div className="space-y-1">
            {offlineParticipants.map(participant => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                onClick={() => onParticipantClick?.(participant)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ParticipantItemProps {
  participant: Participant
  onClick?: () => void
}

const ParticipantItem = ({ participant, onClick }: ParticipantItemProps) => {
  const displayName = participant.username || participant.name

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'hover:bg-[var(--color-bg-darker)]',
        'transition-all duration-200 cursor-pointer',
        'group',
        !participant.isOnline && 'opacity-60'
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          'text-white text-sm font-bold shadow-lg',
          getAvatarGradient(displayName, 'simple')
        )}>
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
        {/* Speaking Indicator */}
        {participant.isSpeaking && participant.isOnline && (
          <div className={cn(
            'absolute -bottom-1 -right-1 w-4 h-4 rounded-full',
            'border-2 border-[var(--color-bg-darker)]',
            statusColorsWithShadow.speaking
          )} />
        )}
        {/* Online Indicator */}
        {!participant.isSpeaking && participant.isOnline && (
          <div className={cn(
            'absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full',
            'border-2 border-[var(--color-bg-darker)]',
            statusColorsWithShadow.online
          )} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-semibold truncate',
            'text-[var(--color-text-primary)]',
            !participant.isOnline && 'text-[var(--color-text-muted)]'
          )}>
            {displayName}
          </span>
          {participant.isScreenSharing && (
            <Badge variant="purple" size="sm">
              屏幕
            </Badge>
          )}
          {participant.isStreaming && (
            <Badge variant="error" size="sm">
              直播
            </Badge>
          )}
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {getAudioStatusLabel(participant.isMuted, participant.isDeafened, participant.isSpeaking)}
        </div>
      </div>

      {/* Status Icons */}
      <div className={cn(
        'flex items-center gap-2',
        'opacity-0 group-hover:opacity-100',
        'transition-opacity duration-200'
      )}>
        {participant.isMuted && (
          <div className="w-5 h-5 rounded-full bg-[var(--color-dnd)]/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-[var(--color-dnd)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 005 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {participant.isDeafened && (
          <div className="w-5 h-5 rounded-full bg-[var(--color-dnd)]/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-[var(--color-dnd)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.586a1 1 0 011.414 0l9.9 9.9a1 1 0 01-1.414 1.414l-9.9-9.9a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}