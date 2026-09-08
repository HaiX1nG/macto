import { useEffect, useRef } from 'react'
import { Modal } from '@renderer/components/ui/Modal'
import { cn } from '@renderer/utils/cn'

interface ScreenSharePreviewProps {
  stream: MediaStream | null
  onStop: () => void
}

function VideoPlayer({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      console.error('VideoPlayer: Setting srcObject')
      video.srcObject = stream
      // Force play
      const playPromise = video.play()
      playPromise.catch(err => {
        console.error('VideoPlayer: Play failed:', err)
      })
    }
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-contain"
    />
  )
}

export function ScreenSharePreview({ stream, onStop }: ScreenSharePreviewProps) {
  if (!stream) return null

  return (
    <Modal
      isOpen={true}
      onClose={onStop}
      title="屏幕共享预览"
      size="xl"
      showCloseButton={false}
      footer={
        <button
          onClick={onStop}
          className={cn(
            'px-5 py-2.5 rounded-xl font-medium',
            'bg-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/80',
            'text-[var(--color-bg-base)]',
            'transition-colors duration-150 ease-out',
            'flex items-center gap-2'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          停止共享
        </button>
      }
    >
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <VideoPlayer key={stream.id} stream={stream} />
        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
          正在共享
        </div>
      </div>
    </Modal>
  )
}