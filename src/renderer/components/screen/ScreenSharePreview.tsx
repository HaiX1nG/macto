import { useEffect, useRef } from 'react'
import { Modal, Button } from 'antd'
import { StopOutlined } from '@ant-design/icons'

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
      open={true}
      title="屏幕共享预览"
      footer={[
        <Button key="stop" danger icon={<StopOutlined />} onClick={onStop}>
          停止共享
        </Button>,
      ]}
      closable={false}
      width={800}
      styles={{
        body: {
          backgroundColor: 'var(--color-bg-secondary)',
          padding: '8px',
        },
      }}
      centered
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