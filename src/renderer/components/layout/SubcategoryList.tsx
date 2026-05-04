import { cn } from '@renderer/utils/cn'
import { UserOutlined, UserAddOutlined } from '@ant-design/icons'

interface Subcategory {
  id: string
  name: string
  type: 'voice' | 'video'
  icon: React.ReactNode
  participants: Participant[]
}

interface Participant {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'busy'
  isMuted?: boolean
  isDeafened?: boolean
}

interface SubcategoryListProps {
  subcategories: Subcategory[]
  activeSubcategoryId?: string
  onSubcategoryClick?: (subcategory: Subcategory) => void
  onCreateSubcategory?: () => void
}

export function SubcategoryList({ subcategories, activeSubcategoryId, onSubcategoryClick, onCreateSubcategory }: SubcategoryListProps) {
  return (
    <div className={cn(
      'w-64 bg-[var(--color-bg-secondary-light)] dark:bg-[var(--color-bg-dark)]',
      'flex flex-col border-r border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
      'transition-colors duration-300'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          分区
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCreateSubcategory}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
              'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
              'text-white rounded-xl text-sm font-semibold',
              'transition-all duration-200',
              'shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40',
              'hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            <UserAddOutlined />
            <span>创建</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {subcategories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className={cn(
            'w-16 h-16 rounded-2xl',
            'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
            'flex items-center justify-center mb-4'
          )}>
            <UserOutlined className="text-2xl text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)]" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] mb-2">暂无分区</p>
          <button
            onClick={onCreateSubcategory}
            className={cn(
              'text-sm text-[var(--color-primary)] dark:text-[var(--color-primary)] font-medium',
              'hover:underline underline-offset-2',
              'transition-all duration-200'
            )}
          >
            点击创建
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {subcategories.map((subcategory) => (
            <SubcategoryItem
              key={subcategory.id}
              subcategory={subcategory}
              isActive={activeSubcategoryId === subcategory.id}
              onClick={() => onSubcategoryClick?.(subcategory)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SubcategoryItemProps {
  subcategory: Subcategory
  isActive?: boolean
  onClick?: () => void
}

function SubcategoryItem({ subcategory, isActive, onClick }: SubcategoryItemProps) {
  const typeStyles = {
    voice: 'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10 text-[var(--color-primary)] dark:text-[var(--color-primary)]',
    video: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  }

  return (
    <div>
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
          'transition-all duration-200',
          isActive
            ? cn(
                'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
                'border-r-4 border-[var(--color-primary)]',
                'shadow-sm'
              )
            : 'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]'
        )}
      >
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          typeStyles[subcategory.type]
        )}>
          {subcategory.icon}
        </div>
        <span className={cn(
          'flex-1 font-medium truncate',
          isActive
            ? 'text-[var(--color-primary)] dark:text-[var(--color-primary)]'
            : 'text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]'
        )}>
          {subcategory.name}
        </span>
        <span className={cn(
          'text-xs px-2 py-1 rounded-full',
          'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
          'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]'
        )}>
          {subcategory.participants.length}
        </span>
      </button>

      {/* Participants */}
      {subcategory.participants.length > 0 && (
        <div className="pl-4 pr-2 py-2 space-y-1">
          {subcategory.participants.map((participant) => (
            <ParticipantItem key={participant.id} participant={participant} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ParticipantItemProps {
  participant: Participant
}

function ParticipantItem({ participant }: ParticipantItemProps) {
  const statusColors = {
    online: 'bg-[var(--color-success)] shadow-[var(--color-success)]/30',
    away: 'bg-[var(--color-warning)] shadow-[var(--color-warning)]/30',
    busy: 'bg-[var(--color-error)] shadow-[var(--color-error)]/30',
  }

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'bg-gradient-to-br from-[var(--color-primary)] to-purple-600',
      'bg-gradient-to-br from-[var(--color-success)] to-teal-600',
      'bg-gradient-to-br from-orange-500 to-[var(--color-error)]',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-cyan-500 to-[var(--color-primary)]',
    ]
    return gradients[name.charCodeAt(0) % gradients.length]
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'hover:bg-[var(--color-border-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
        'cursor-pointer transition-colors group'
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center',
            'text-xs font-bold text-white shadow-md',
            getAvatarGradient(participant.name),
            participant.isMuted && 'grayscale opacity-60'
          )}
        >
          {participant.avatar ? (
            <img src={participant.avatar} alt={participant.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            participant.name.charAt(0).toUpperCase()
          )}
        </div>
        {/* Status Indicator */}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full',
          'border-2 border-white dark:border-[#1a1a25]',
          statusColors[participant.status]
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] truncate">
          {participant.name}
        </div>
        <div className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
          {participant.isMuted ? '静音' : participant.isDeafened ? '免提' : '说话中'}
        </div>
      </div>

      {/* Mute Icon */}
      {participant.isMuted && (
        <div className="w-5 h-5 text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)] opacity-0 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        </div>
      )}
    </div>
  )
}