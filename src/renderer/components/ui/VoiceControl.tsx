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
      'bg-white/95 dark:bg-[#0a0a0f]/95',
      'backdrop-blur-xl',
      'border-t border-gray-200 dark:border-gray-800',
      'p-5 z-50',
      'shadow-2xl shadow-black/10 dark:shadow-black/50',
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
          'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
          'text-white',
          'shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40'
        )
      : cn(
          'bg-gray-100 dark:bg-[#1a1a25]',
          'text-gray-600 dark:text-gray-400',
          'hover:bg-gray-200 dark:hover:bg-[#2a2a35]',
          'hover:text-gray-900 dark:hover:text-white'
        ),
    danger: active
      ? cn(
          'bg-red-600 hover:bg-red-700 active:bg-red-800',
          'text-white',
          'shadow-lg shadow-red-600/30 hover:shadow-red-600/40'
        )
      : cn(
          'bg-gray-100 dark:bg-[#1a1a25]',
          'text-gray-600 dark:text-gray-400',
          'hover:bg-red-50 dark:hover:bg-red-900/20',
          'hover:text-red-600 dark:hover:text-red-400'
        ),
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-2xl flex flex-col items-center justify-center gap-1',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
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
          'text-gray-400 dark:text-gray-500',
          muted && 'text-red-400'
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
            'bg-gray-200 dark:bg-gray-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'accent-blue-600 dark:accent-blue-500'
          )}
          style={{
            backgroundImage: `linear-gradient(to right, #1890ff 0%, #1890ff ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
          }}
        />
      </div>
      {showValue && (
        <span className={cn(
          'text-sm font-medium w-12 text-right',
          'text-gray-600 dark:text-gray-400',
          muted && 'text-red-400'
        )}>
          {value}%
        </span>
      )}
      {label && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
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
                ? 'bg-red-500'
                : i < bars * 0.7
                  ? 'bg-green-500'
                  : i < bars * 0.9
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              : 'bg-gray-300 dark:bg-gray-600'
          )}
          style={{
            height: `${((i + 1) / bars) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}