import { useEffect, useRef } from 'react'
import { Card, Avatar } from 'antd'
import type { RemoteScreen } from '@renderer/stores/webrtcStore'

interface RemoteScreenViewProps {
  screen: RemoteScreen
}

export function RemoteScreenView({ screen }: RemoteScreenViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && screen.stream) {
      const video = videoRef.current
      video.srcObject = screen.stream
      video.play().catch(err => {
        console.error('Failed to play remote video:', err)
      })
    }
  }, [screen.stream])

  useEffect(() => {
    const video = videoRef.current
    return () => {
      if (video) {
        video.srcObject = null
      }
    }
  }, [])

  return (
    <Card
      size="small"
      className="bg-[var(--color-bg-secondary)] border-[var(--color-border)]"
      styles={{ body: { padding: '8px' } }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar size={24} className="bg-gradient-to-br from-blue-500 to-purple-600">
          {screen.username.charAt(0).toUpperCase()}
        </Avatar>
        <span className="text-sm text-[var(--color-text-normal)]">{screen.username}</span>
        <span className="text-xs text-[var(--color-primary)]">正在共享</span>
      </div>
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    </Card>
  )
}