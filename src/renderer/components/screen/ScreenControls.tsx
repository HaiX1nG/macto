import { useState } from 'react'
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

interface ScreenControlsProps {
  /** Whether screen sharing is currently paused */
  isPaused: boolean
  /** Callback to toggle pause/resume */
  onPauseToggle: () => void
  /** Callback to stop sharing */
  onStop: () => void
  /** Callback to open settings */
  onSettings?: () => void
  /** Callback to toggle fullscreen */
  onFullscreenToggle?: () => void
  /** Whether currently in fullscreen mode */
  isFullscreen?: boolean
  /** Optional className */
  className?: string
}

/**
 * ScreenControls - Floating control bar for screen sharing
 *
 * Centered floating controls with pause, stop, settings, and fullscreen buttons.
 * Styled with dark glassmorphism effect.
 */
export default function ScreenControls({
  isPaused,
  onPauseToggle,
  onStop,
  onSettings,
  onFullscreenToggle,
  isFullscreen = false,
  className,
}: ScreenControlsProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2',
        'z-50',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'flex items-center gap-2 p-2',
          'bg-black/50 backdrop-blur-md',
          'rounded-full',
          'border border-white/10',
          'transition-all duration-300 ease-out',
          isHovered && 'bg-black/70 shadow-2xl shadow-black/30'
        )}
      >
        {/* Pause/Resume Button */}
        <button
          onClick={onPauseToggle}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'transition-all duration-200 ease-out',
            'hover:scale-110 active:scale-90',
            isPaused
              ? 'bg-[var(--color-idle)]/80 hover:bg-[var(--color-idle)]'
              : 'bg-white/10 hover:bg-white/20'
          )}
          title={isPaused ? '继续共享' : '暂停共享'}
        >
          {isPaused ? (
            <PlayCircleOutlined className="text-white text-lg" />
          ) : (
            <PauseCircleOutlined className="text-white text-lg" />
          )}
        </button>

        {/* Stop Button */}
        <button
          onClick={onStop}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'bg-[var(--color-dnd)]/80 hover:bg-[var(--color-dnd)]',
            'transition-all duration-200 ease-out',
            'hover:scale-110 active:scale-90'
          )}
          title="停止共享"
        >
          <StopOutlined className="text-white text-lg" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/20" />

        {/* Settings Button */}
        {onSettings && (
          <button
            onClick={onSettings}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-white/10 hover:bg-white/20',
              'transition-all duration-200 ease-out',
              'hover:scale-110 active:scale-90'
            )}
            title="设置"
          >
            <SettingOutlined className="text-white text-lg" />
          </button>
        )}

        {/* Fullscreen Button */}
        {onFullscreenToggle && (
          <button
            onClick={onFullscreenToggle}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-white/10 hover:bg-white/20',
              'transition-all duration-200 ease-out',
              'hover:scale-110 active:scale-90'
            )}
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? (
              <FullscreenExitOutlined className="text-white text-lg" />
            ) : (
              <FullscreenOutlined className="text-white text-lg" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
