import { cn } from '@renderer/utils/cn'
import { Badge } from './Badge'

interface ParticipantListProps {
  participants: Participant[]
  className?: string
  onParticipantClick?: (participant: Participant) => void
}

export interface Participant {
  id: string
  username: string
  avatar?: string
  isOnline: boolean
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  isStreaming?: boolean
  isScreenSharing?: boolean
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
          <h3 className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
          <h3 className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
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
  const statusColors = {
    online: 'bg-green-500 shadow-green-500/30',
    offline: 'bg-gray-400',
    speaking: 'bg-blue-500 shadow-blue-500/30 animate-pulse',
  }

  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-cyan-500 to-blue-600',
      'bg-gradient-to-br from-amber-500 to-orange-600',
    ]
    const index = username.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'hover:bg-gray-100 dark:hover:bg-[#1a1a25]',
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
          getAvatarColor(participant.username)
        )}>
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            participant.username.charAt(0).toUpperCase()
          )}
        </div>
        {/* Speaking Indicator */}
        {participant.isSpeaking && participant.isOnline && (
          <div className={cn(
            'absolute -bottom-1 -right-1 w-4 h-4 rounded-full',
            'border-2 border-white dark:border-[#1a1a25]',
            statusColors.speaking
          )} />
        )}
        {/* Online Indicator */}
        {!participant.isSpeaking && participant.isOnline && (
          <div className={cn(
            'absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full',
            'border-2 border-white dark:border-[#1a1a25]',
            statusColors.online
          )} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-semibold truncate',
            'text-gray-900 dark:text-white',
            !participant.isOnline && 'text-gray-500 dark:text-gray-400'
          )}>
            {participant.username}
          </span>
          {participant.isScreenSharing && (
            <Badge variant="purple" size="small">
              屏幕
            </Badge>
          )}
          {participant.isStreaming && (
            <Badge variant="error" size="small">
              直播
            </Badge>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {participant.isMuted ? '静音' : participant.isDeafened ? '免提' : participant.isSpeaking ? '说话中...' : '在线'}
        </div>
      </div>

      {/* Status Icons */}
      <div className={cn(
        'flex items-center gap-2',
        'opacity-0 group-hover:opacity-100',
        'transition-opacity duration-200'
      )}>
        {participant.isMuted && (
          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 005 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {participant.isDeafened && (
          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.586a1 1 0 011.414 0l9.9 9.9a1 1 0 01-1.414 1.414l-9.9-9.9a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}