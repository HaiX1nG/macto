import { useState, useCallback, useEffect, useRef } from 'react'
import { Empty } from 'antd'
import { cn } from '@renderer/utils/cn'
import type { Participant } from '@shared/types/participant'
import ScreenPreview from '@renderer/components/screen/ScreenPreview'
import ScreenControls from '@renderer/components/screen/ScreenControls'
import ViewerGrid from '@renderer/components/screen/ViewerGrid'

type ViewMode = 'fullscreen' | 'pip' | 'grid'

interface ScreenShareViewProps {
  /** Local media stream for screen sharing */
  localStream: MediaStream | null
  /** Remote screen streams with participant info */
  remoteScreens: Array<{
    id: string
    stream: MediaStream | null
    participant: Participant
    isPaused?: boolean
  }>
  /** Current view mode */
  viewMode?: ViewMode
  /** Callback to toggle pause */
  onPauseToggle: () => void
  /** Callback to stop sharing */
  onStop: () => void
  /** Callback for settings */
  onSettings?: () => void
  /** Whether currently paused */
  isPaused: boolean
  /** Whether currently in fullscreen */
  isFullscreen?: boolean
  /** Callback to toggle fullscreen */
  onFullscreenToggle?: () => void
  /** Optional className */
  className?: string
}

/**
 * ScreenShareView - Main screen sharing display component
 *
 * Supports fullscreen and picture-in-picture modes with floating controls.
 * Displays local screen share and remote screen shares.
 *
 * Moved from src/renderer/components/pages/ScreenSharePage.tsx.
 */
export default function ScreenShareView({
  localStream,
  remoteScreens,
  viewMode = 'fullscreen',
  onPauseToggle,
  onStop,
  onSettings,
  isPaused,
  isFullscreen = false,
  onFullscreenToggle,
  className,
}: ScreenShareViewProps) {
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode)
  const [pipPosition, setPipPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Combine local and remote screens for grid view
  const allScreens = [
    ...(localStream
      ? [
          {
            id: 'local',
            stream: localStream,
            participant: {
              id: 'local',
              name: '本地共享',
              username: '本地共享',
              isOnline: true,
              isMuted: false,
              isDeafened: false,
              isSpeaking: false,
            } as Participant,
            isPaused,
          },
        ]
      : []),
    ...remoteScreens,
  ]

  // Handle drag for PiP
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - pipPosition.x,
      y: e.clientY - pipPosition.y,
    }
  }, [pipPosition])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      setPipPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      })
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden',
        'bg-[var(--color-bg-base)]',
        currentViewMode === 'fullscreen' && 'bg-black',
        className
      )}
    >
      {/* Fullscreen / Main View */}
      {currentViewMode === 'fullscreen' && localStream && (
        <div className="w-full h-full">
          <ScreenPreview
            stream={localStream}
            title="本地屏幕"
            isLocal
            className="w-full h-full rounded-none border-none"
          />
        </div>
      )}

      {/* Grid View - All screens */}
      {currentViewMode === 'grid' && (
        <ViewerGrid
          screens={allScreens}
          className="h-full"
        />
      )}

      {/* Picture-in-Picture View */}
      {currentViewMode === 'pip' && localStream && (
        <>
          {/* Main content area (could be remote screen or empty) */}
          <div className="w-full h-full flex items-center justify-center">
            {remoteScreens.length > 0 ? (
              <ScreenPreview
                stream={remoteScreens[0].stream}
                title={remoteScreens[0].participant.username || remoteScreens[0].participant.name}
                className="w-full h-full rounded-none border-none"
              />
            ) : (
              <Empty
                description="等待远程屏幕共享"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>

          {/* Draggable PiP */}
          <div
            className={cn(
              'absolute w-64 aspect-video cursor-move',
              'transition-shadow duration-200',
              isDragging && 'shadow-2xl',
              'z-40'
            )}
            style={{
              left: pipPosition.x,
              top: pipPosition.y,
            }}
            onMouseDown={handleMouseDown}
          >
            <ScreenPreview
              stream={localStream}
              title="本地"
              isLocal
              className="pointer-events-none"
            />
          </div>
        </>
      )}

      {/* No local stream state */}
      {!localStream && remoteScreens.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <Empty
            description="没有正在进行的屏幕共享"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      )}

      {/* View mode indicator */}
      <div
        className={cn(
          'absolute top-4 left-4 z-30',
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-black/50 backdrop-blur-sm',
          'text-xs text-white font-medium'
        )}
      >
        <div className="w-2 h-2 rounded-full bg-[var(--color-online)] animate-pulse" />
        {currentViewMode === 'fullscreen' && '全屏模式'}
        {currentViewMode === 'pip' && '画中画模式'}
        {currentViewMode === 'grid' && '网格模式'}
      </div>

      {/* View mode switcher */}
      <div
        className={cn(
          'absolute top-4 right-4 z-30',
          'flex items-center gap-1 p-1 rounded-lg',
          'bg-black/50 backdrop-blur-sm'
        )}
      >
        {(['fullscreen', 'pip', 'grid'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setCurrentViewMode(mode)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              currentViewMode === mode
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
          >
            {mode === 'fullscreen' && '全屏'}
            {mode === 'pip' && '画中画'}
            {mode === 'grid' && '网格'}
          </button>
        ))}
      </div>

      {/* Floating Controls */}
      {localStream && (
        <ScreenControls
          isPaused={isPaused}
          onPauseToggle={onPauseToggle}
          onStop={onStop}
          onSettings={onSettings}
          onFullscreenToggle={onFullscreenToggle}
          isFullscreen={isFullscreen}
        />
      )}
    </div>
  )
}
