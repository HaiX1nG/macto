import { useState, useCallback } from 'react'
import { Empty } from 'antd'
import { cn } from '@renderer/utils/cn'
import type { Participant } from '@shared/types/participant'
import ScreenPreview from './ScreenPreview'

interface ScreenView {
  /** Unique identifier for this screen view */
  id: string
  /** Stream to display */
  stream: MediaStream | null
  /** Participant sharing this screen */
  participant: Participant
  /** Whether this screen is currently active/paused */
  isPaused?: boolean
}

interface ViewerGridProps {
  /** Array of screen views to display */
  screens: ScreenView[]
  /** Callback when a screen is clicked */
  onScreenClick?: (screen: ScreenView) => void
  /** Callback when a screen's pause state should be toggled */
  onPauseToggle?: (screenId: string) => void
  /** Optional className */
  className?: string
}

/**
 * ViewerGrid - Multi-screen viewing grid for screen sharing
 *
 * Displays multiple screen shares in a responsive grid layout.
 * Supports viewing multiple participants' screens simultaneously.
 */
export default function ViewerGrid({
  screens,
  onScreenClick,
  onPauseToggle,
  className,
}: ViewerGridProps) {
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null)

  const handleScreenClick = useCallback(
    (screen: ScreenView) => {
      setSelectedScreen((prev) => (prev === screen.id ? null : screen.id))
      onScreenClick?.(screen)
    },
    [onScreenClick]
  )

  // Determine grid columns based on screen count
  const getGridCols = () => {
    const count = screens.length
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2'
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  // Get aspect ratio based on layout
  const getAspectRatio = () => {
    if (screens.length === 1) return 'video'
    if (screens.length === 2) return 'video'
    return 'video'
  }

  return (
    <div
      className={cn(
        'w-full h-full overflow-y-auto p-4',
        className
      )}
    >
      {screens.length > 0 ? (
        <div className={cn('grid gap-4', getGridCols())}>
          {screens.map((screen) => (
            <div
              key={screen.id}
              className={cn(
                'relative transition-all duration-300',
                selectedScreen === screen.id && 'col-span-full'
              )}
            >
              <ScreenPreview
                stream={screen.stream}
                title={screen.participant.username || screen.participant.name}
                isLocal={false}
                aspectRatio={getAspectRatio() as 'video' | 'square' | 'auto'}
                onClick={() => handleScreenClick(screen)}
                className={cn(
                  'transition-all duration-300',
                  selectedScreen === screen.id && 'ring-2 ring-[var(--color-primary)]'
                )}
              />

              {/* Pause overlay */}
              {screen.isPaused && (
                <div
                  className={cn(
                    'absolute inset-0 flex items-center justify-center',
                    'bg-black/50 backdrop-blur-sm rounded-xl',
                    'pointer-events-none'
                  )}
                >
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 text-white mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-white font-medium">已暂停</p>
                  </div>
                </div>
              )}

              {/* Participant info bar */}
              <div
                className={cn(
                  'absolute bottom-3 left-3 right-3',
                  'flex items-center justify-between',
                  'px-3 py-2 rounded-lg',
                  'bg-black/50 backdrop-blur-sm'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      'text-xs font-bold text-white',
                      'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]'
                    )}
                  >
                    {(screen.participant.username || screen.participant.name)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <span className="text-sm text-white font-medium">
                    {screen.participant.username || screen.participant.name}
                  </span>
                </div>

                {/* Pause toggle button */}
                {onPauseToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPauseToggle(screen.id)
                    }}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      'bg-white/20 hover:bg-white/30',
                      'transition-all duration-200',
                      'active:scale-90'
                    )}
                  >
                    {screen.isPaused ? (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Empty
            description="暂无屏幕共享"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      )}
    </div>
  )
}
