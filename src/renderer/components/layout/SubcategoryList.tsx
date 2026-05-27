import { cn } from '@renderer/utils/cn'
import { UserOutlined, UserAddOutlined } from '@ant-design/icons'
import { getAvatarGradient, getAvatarInitial, isValidAvatarUrl } from '@renderer/utils/avatar'
import { statusColorMap, getAudioStatusLabel } from '@renderer/utils/status'
import type { SubcategoryParticipant } from '@shared/types/participant'

interface Subcategory {
  id: string
  name: string
  type: 'voice' | 'video'
  icon: React.ReactNode
  participants: SubcategoryParticipant[]
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
      'w-64 bg-[var(--color-bg-secondary)]',
      'flex flex-col border-r border-[var(--color-border)]',
      'transition-colors duration-150'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-normal)] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          分区
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCreateSubcategory}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
              'bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] active:bg-[var(--color-accent)]',
              'text-white rounded-xl text-sm font-semibold',
              'transition-all duration-150',
              'hover:scale-[1.01] active:scale-[0.99]'
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
            'bg-[var(--color-bg-tertiary)]',
            'flex items-center justify-center mb-4'
          )}>
            <UserOutlined className="text-2xl text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">暂无分区</p>
          <button
            onClick={onCreateSubcategory}
            className={cn(
              'text-sm text-[var(--color-primary)] font-medium',
              'hover:underline underline-offset-2',
              'transition-all duration-150'
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
    voice: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
    video: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  }

  return (
    <div>
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
          'transition-all duration-150',
          isActive
            ? cn(
                'bg-[var(--color-primary)]/10',
                'border-l-2 border-[var(--color-primary)]',
                'shadow-sm'
              )
            : 'hover:bg-[var(--color-bg-tertiary)]'
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
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-text-normal)]'
        )}>
          {subcategory.name}
        </span>
        <span className={cn(
          'text-xs px-2 py-1 rounded-full',
          'bg-[var(--color-bg-tertiary)]',
          'text-[var(--color-text-muted)]'
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
  participant: SubcategoryParticipant
}

function ParticipantItem({ participant }: ParticipantItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'hover:bg-[var(--color-bg-tertiary)]',
        'cursor-pointer transition-colors duration-150 group'
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center',
            'text-xs font-bold text-white shadow-sm',
            getAvatarGradient(participant.name),
            participant.isMuted && 'grayscale opacity-60'
          )}
        >
          {isValidAvatarUrl(participant.avatar) ? (
            <img src={participant.avatar} alt={participant.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            getAvatarInitial(participant.name)
          )}
        </div>
        {/* Status Indicator */}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full',
          'border-2 border-[var(--color-bg-secondary)]',
          statusColorMap[participant.status]
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--color-text-normal)] truncate">
          {participant.name}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {getAudioStatusLabel(participant.isMuted ?? false, participant.isDeafened ?? false, false)}
        </div>
      </div>

      {/* Mute Icon */}
      {participant.isMuted && (
        <div className="w-5 h-5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
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