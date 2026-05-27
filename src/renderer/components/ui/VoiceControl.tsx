import type { ReactNode } from 'react'
import { cn } from '@renderer/utils/cn'

interface VoiceControlPanelProps {
  children: ReactNode
  className?: string
}

export const VoiceControlPanel = ({ children, className }: VoiceControlPanelProps) => {
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0',
      'bg-[var(--color-bg-base)]/95',
      'backdrop-blur-xl',
      'border-t border-[var(--color-border)]',
      'p-5 z-50',
      'shadow-2xl shadow-[var(--color-bg-darkest)]/30',
      className
    )}>
      {children}
    </div>
  )
}

export const VoiceControls = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-center gap-5">
    {children}
  </div>
)

interface VoiceControlButtonProps {
  children: ReactNode
  active?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'danger'
  onClick?: () => void
  label?: string
}

export const VoiceControlButton = ({
  children,
  active = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  onClick,
  label
}: VoiceControlButtonProps) => {
  const sizes = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  }

  const variants = {
    default: active
      ? cn(
          'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 active:bg-[var(--color-primary)]/80',
          'text-white',
          'shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40'
        )
      : cn(
          'bg-[var(--color-bg-tertiary)]',
          'text-[var(--color-text-muted)]',
          'hover:bg-[var(--color-bg-darker)]',
          'hover:text-[var(--color-text-normal)]'
        ),
    danger: active
      ? cn(
          'bg-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/90 active:bg-[var(--color-dnd)]/80',
          'text-white',
          'shadow-lg shadow-[var(--color-dnd)]/30 hover:shadow-[var(--color-dnd)]/40'
        )
      : cn(
          'bg-[var(--color-bg-tertiary)]',
          'text-[var(--color-text-muted)]',
          'hover:bg-[var(--color-dnd)]/20',
          'hover:text-[var(--color-dnd)]'
        ),
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-2xl flex flex-col items-center justify-center gap-1',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95 hover:scale-105',
        'group',
        sizes[size],
        variants[variant]
      )}
    >
      <div className={cn(
        'transition-transform duration-200',
        active && 'animate-pulse',
        'group-hover:scale-110'
      )}>
        {children}
      </div>
      {label && (
        <span className="text-[10px] font-medium opacity-80">
          {label}
        </span>
      )}
    </button>
  )
}

interface VolumeControlProps {
  label?: string
  value: number
  onChange: (value: number) => void
  icon?: ReactNode
  muted?: boolean
  showValue?: boolean
}

export const VolumeControl = ({
  label,
  value,
  onChange,
  icon,
  muted = false,
  showValue = true
}: VolumeControlProps) => {
  return (
    <div className="flex items-center gap-4 w-full max-w-md">
      {icon && (
        <div className={cn(
          'text-[var(--color-text-muted)]',
          muted && 'text-[var(--color-dnd)]'
        )}>
          {icon}
        </div>
      )}
      <div className="flex-1">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={muted}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-[var(--color-bg-tertiary)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'accent-[var(--color-primary)]'
          )}
          style={{
            backgroundImage: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${value}%, var(--color-bg-tertiary) ${value}%, var(--color-bg-tertiary) 100%)`,
          }}
        />
      </div>
      {showValue && (
        <span className={cn(
          'text-sm font-medium w-12 text-right',
          'text-[var(--color-text-muted)]',
          muted && 'text-[var(--color-dnd)]'
        )}>
          {value}%
        </span>
      )}
      {label && (
        <span className="text-xs text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
    </div>
  )
}

interface VolumeMeterProps {
  level: number
  muted?: boolean
  className?: string
}

export const VolumeMeter = ({
  level,
  muted = false,
  className
}: VolumeMeterProps) => {
  const bars = 10
  const activeBars = Math.round((level / 100) * bars)

  return (
    <div className={cn('flex items-end gap-0.5 h-4', className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-75',
            i < activeBars
              ? muted
                ? 'bg-[var(--color-dnd)]'
                : i < bars * 0.7
                  ? 'bg-[var(--color-online)]'
                  : i < bars * 0.9
                    ? 'bg-[var(--color-idle)]'
                    : 'bg-[var(--color-dnd)]'
              : 'bg-[var(--color-bg-tertiary)]'
          )}
          style={{
            height: `${((i + 1) / bars) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}