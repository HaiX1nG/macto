import { useState } from 'react'
import { cn } from '@renderer/utils/cn'
import { AudioOutlined, VideoCameraOutlined, DesktopOutlined, SoundOutlined, AudioMutedOutlined } from '@ant-design/icons'

interface ControlButton {
  id: string
  icon: React.ReactNode
  label: string
  active: boolean
  onToggle: () => void
}

export function ChannelControlPanel() {
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [volume, setVolume] = useState(70)

  const controls: ControlButton[] = [
    {
      id: 'mic',
      icon: isMuted ? <AudioMutedOutlined /> : <AudioOutlined />,
      label: '麦克风',
      active: !isMuted,
      onToggle: () => setIsMuted(!isMuted)
    },
    {
      id: 'speaker',
      icon: isDeafened ? <AudioMutedOutlined /> : <SoundOutlined />,
      label: '扬声器',
      active: !isDeafened,
      onToggle: () => setIsDeafened(!isDeafened)
    },
    {
      id: 'video',
      icon: isScreenSharing ? <VideoCameraOutlined /> : <DesktopOutlined />,
      label: '屏幕分享',
      active: isScreenSharing,
      onToggle: () => setIsScreenSharing(!isScreenSharing)
    }
  ]

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0',
      'bg-[var(--color-bg-base)]/95',
      'backdrop-blur-xl',
      'border-t border-[var(--color-border)]',
      'p-5 z-50',
      'shadow-2xl shadow-black/10',
      'transition-colors duration-200'
    )}>
      <div className="max-w-4xl mx-auto">
        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-6 mb-6">
          {controls.map((control) => (
            <ControlButton
              key={control.id}
              control={control}
            />
          ))}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center justify-center gap-4 px-4">
          {isDeafened ? (
            <AudioMutedOutlined className="text-[var(--color-text-muted)]" />
          ) : (
            <SoundOutlined className="text-[var(--color-text-muted)]" />
          )}
          <div className="flex-1 max-w-md">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              disabled={isDeafened}
              className={cn(
                'w-full h-2 rounded-full appearance-none cursor-pointer',
                'bg-[var(--color-bg-tertiary)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'accent-[var(--color-primary)]'
              )}
              style={{
                backgroundImage: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${volume}%, var(--color-bg-tertiary) ${volume}%, var(--color-bg-tertiary) 100%)`,
              }}
            />
          </div>
          <span className={cn(
            'text-sm font-medium w-12 text-right',
            'text-[var(--color-text-muted)]',
            isDeafened && 'text-[var(--color-dnd)]'
          )}>
            {volume}%
          </span>
        </div>
      </div>
    </div>
  )
}

interface ControlButtonProps {
  control: ControlButton
}

function ControlButton({ control }: ControlButtonProps) {
  return (
    <button
      onClick={control.onToggle}
      className={cn(
        'flex flex-col items-center gap-2 px-6 py-4 rounded-2xl',
        'transition-[transform,box-shadow] duration-150 group',
        'hover:scale-105 active:scale-95',
        control.active
          ? cn(
              'bg-[var(--color-primary)] text-white',
              'shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-[var(--color-primary)]/40'
            )
          : cn(
              'bg-[var(--color-bg-tertiary)]',
              'text-[var(--color-text-muted)]',
              'hover:bg-[var(--color-border)]'
            )
      )}
    >
      <div className={cn(
        'transition-transform duration-200',
        'group-hover:scale-110',
        control.active && 'animate-pulse'
      )}>
        <span className="text-2xl">{control.icon}</span>
      </div>
      <span className="text-xs font-medium">{control.label}</span>
    </button>
  )
}