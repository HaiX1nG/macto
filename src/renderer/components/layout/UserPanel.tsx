import { useState } from 'react'
import { App } from 'antd'
import { AudioOutlined, AudioMutedOutlined, SoundOutlined, DesktopOutlined, StopOutlined, CustomerServiceOutlined, SettingOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useUIStore } from '@renderer/stores/uiStore'
import { useMediaStore } from '@renderer/stores/mediaStore'
import { useVoiceStore } from '@renderer/stores/voiceStore'
import { ScreenSharePreview } from '../screen/ScreenSharePreview'
import { AudioSettings } from '../settings/AudioSettings'

const USER_PANEL_HEIGHT = 60
const CONTROL_BUTTON_SIZE = 40

export function UserPanel() {
  const { message: messageApi } = App.useApp()
  const { currentChannelId } = useUIStore()
  const { isSharing, localStream, startSharing, stopSharing } = useMediaStore()
  const { isMuted, setMute } = useVoiceStore()

  const [isDeafened, setIsDeafened] = useState(false)
  const [screenShareLoading, setScreenShareLoading] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)

  const handleScreenShareClick = () => {
    if (!currentChannelId) {
      messageApi.warning('请先选择一个频道')
      return
    }

    if (isSharing) {
      void handleStopScreenShare()
    } else {
      void handleStartScreenShare()
    }
  }

  const handleStartScreenShare = async () => {
    setScreenShareLoading(true)
    try {
      await startSharing(currentChannelId!)
    } catch (_err) {
      messageApi.error('屏幕共享失败')
    } finally {
      setScreenShareLoading(false)
    }
  }

  const handleStopScreenShare = async () => {
    setScreenShareLoading(true)
    try {
      await stopSharing(currentChannelId!)
    } finally {
      setScreenShareLoading(false)
    }
  }

  return (
    <>
      <div
        className="bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-darker)] px-3 flex items-center justify-center gap-2.5 flex-shrink-0 border-t border-[var(--color-border)] transition-colors duration-300 ease-out"
        style={{ height: USER_PANEL_HEIGHT }}
      >
        <ControlButton
          onClick={handleScreenShareClick}
          disabled={screenShareLoading}
          isActive={isSharing}
          activeColor="primary"
          title={isSharing ? '停止屏幕共享' : '开始屏幕共享'}
          icon={isSharing ? <StopOutlined /> : <DesktopOutlined />}
        />

        <ControlButton
          onClick={() => setShowAudioSettings(true)}
          title="音频设置"
          icon={<CustomerServiceOutlined />}
        />

        <div className="w-px h-6 bg-[var(--color-border)]" />

        <ControlButton
          onClick={() => setMute(!isMuted)}
          isActive={isMuted}
          activeColor="danger"
          title={isMuted ? '取消静音' : '静音'}
          icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
        />

        <ControlButton
          onClick={() => setIsDeafened(!isDeafened)}
          isActive={isDeafened}
          activeColor="danger"
          title={isDeafened ? '取消耳聋' : '耳聋'}
          icon={<SoundOutlined />}
        />

        <div className="w-px h-6 bg-[var(--color-border)]" />

        <ControlButton
          onClick={() => setShowAudioSettings(true)}
          title="设置"
          icon={<SettingOutlined />}
        />
      </div>

      <ScreenSharePreview
        stream={isSharing ? localStream : null}
        onStop={handleStopScreenShare}
      />

      <AudioSettings
        open={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />
    </>
  )
}

interface ControlButtonProps {
  onClick: () => void
  disabled?: boolean
  isActive?: boolean
  activeColor?: 'primary' | 'danger'
  title: string
  icon: React.ReactNode
}

function ControlButton({ onClick, disabled, isActive, activeColor = 'primary', title, icon }: ControlButtonProps) {
  const activeStyles = {
    primary: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-sm shadow-[var(--color-primary)]/20',
    danger: 'bg-[var(--color-dnd)]/15 text-[var(--color-dnd)] shadow-sm shadow-[var(--color-dnd)]/20',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative rounded-xl flex items-center justify-center",
        "transition-all duration-150 ease-out",
        "hover:scale-105 active:scale-95",
        "will-change-transform",
        isActive
          ? activeStyles[activeColor]
          : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-darker)]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{ width: CONTROL_BUTTON_SIZE, height: CONTROL_BUTTON_SIZE }}
      title={title}
    >
      <span className="text-lg">{icon}</span>
      {isActive && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--color-primary)] rounded-full animate-pulse" />
      )}
    </button>
  )
}
