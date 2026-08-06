import { useEffect, useRef, useState } from 'react'
import { cn } from '@renderer/utils/cn'

interface ScreenPreviewProps {
  /** MediaStream to display */
  stream: MediaStream | null
  /** Optional title/label for the preview */
  title?: string
  /** Whether this is the local preview (shows controls) */
  isLocal?: boolean
  /** Aspect ratio for the preview container */
  aspectRatio?: 'video' | 'square' | 'auto'
  /** Callback when the preview is clicked */
  onClick?: () => void
  /** Optional className */
  className?: string
}

/**
 * ScreenPreview - Generic screen sharing preview component
 *
 * Displays a MediaStream in a styled container with rounded corners.
 * Used for both local preview and remote screen viewing.
 */
export default function ScreenPreview({
  stream,
  title,
  isLocal = false,
  aspectRatio = 'video',
  onClick,
  className,
}: ScreenPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (stream) {
      video.srcObject = stream
      video
        .play()
        .then(() => {
          setIsPlaying(true)
          setError(null)
        })
        .catch((err) => {
          console.error('Failed to play video:', err)
          setError('无法播放视频流')
          setIsPlaying(false)
        })
    } else {
      video.srcObject = null
      setIsPlaying(false)
    }

    return () => {
      if (video) {
        video.srcObject = null
      }
    }
  }, [stream])

  const aspectRatioClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'square'
        ? 'aspect-square'
        : ''

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden',
        'bg-black',
        'border border-[var(--color-border)]',
        'transition-all duration-300',
        onClick && 'cursor-pointer hover:shadow-xl hover:shadow-[var(--color-bg-darkest)]/20',
        className
      )}
      onClick={onClick}
    >
      {/* Video element */}
      <div className={cn('relative w-full', aspectRatioClass)}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-contain"
        />

        {/* Loading state */}
        {!isPlaying && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div
              className={cn(
                'w-8 h-8 rounded-full border-2 border-[var(--color-primary)]',
                'border-t-transparent animate-spin'
              )}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-[var(--color-dnd)] mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.834-1-2.332-1-3.166 0L4.094 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
            </div>
          </div>
        )}

        {/* Title overlay */}
        {title && (
          <div
            className={cn(
              'absolute top-3 left-3 px-3 py-1.5 rounded-lg',
              'bg-black/50 backdrop-blur-sm',
              'text-xs font-medium text-white'
            )}
          >
            {title}
          </div>
        )}

        {/* Local indicator */}
        {isLocal && (
          <div
            className={cn(
              'absolute top-3 right-3 px-3 py-1.5 rounded-lg',
              'bg-[var(--color-primary)]/80 backdrop-blur-sm',
              'text-xs font-medium text-white',
              'flex items-center gap-1.5'
            )}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            正在共享
          </div>
        )}

        {/* Click to expand hint */}
        {onClick && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-black/0 hover:bg-black/20',
              'transition-all duration-300',
              'opacity-0 hover:opacity-100'
            )}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2 text-white text-sm font-medium">
              点击放大
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
