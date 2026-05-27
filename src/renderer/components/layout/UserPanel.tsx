import { useState } from 'react'
import { App } from 'antd'
import { AudioOutlined, AudioMutedOutlined, SoundOutlined, DesktopOutlined, StopOutlined, CustomerServiceOutlined, SettingOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useRoomStore } from '@renderer/stores/serverStore'
import { useScreenShare } from '@renderer/hooks/useScreenShare'
import { useAudioShare } from '@renderer/hooks/useAudioShare'
import { ScreenSharePicker } from '../screen/ScreenSharePicker'
import { ScreenSharePreview } from '../screen/ScreenSharePreview'
import { AudioSharePicker } from '../audio/AudioSharePicker'
import { AudioSettings } from '../settings/AudioSettings'

const USER_PANEL_HEIGHT = 60
const CONTROL_BUTTON_SIZE = 40

export function UserPanel() {
  const { message: messageApi } = App.useApp()
  const { currentRoomId } = useRoomStore()
  const { localStream, isSharing, startScreenShare, stopScreenShare } = useScreenShare()
  const { isAudioSharing, startAudioShare, stopAudioShare } = useAudioShare()

  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [screenShareLoading, setScreenShareLoading] = useState(false)
  const [showScreenPicker, setShowScreenPicker] = useState(false)
  const [audioShareLoading, setAudioShareLoading] = useState(false)
  const [showAudioPicker, setShowAudioPicker] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)

  const handleScreenShareClick = () => {
    if (!currentRoomId) {
      messageApi.warning('请先选择一个房间')
      return
    }

    if (isSharing) {
      handleStopScreenShare()
    } else {
      setShowScreenPicker(true)
    }
  }

  const handleStartScreenShare = async (sourceId: string) => {
    setShowScreenPicker(false)
    setScreenShareLoading(true)
    await startScreenShare(sourceId)
    setScreenShareLoading(false)
  }

  const handleStopScreenShare = async () => {
    setScreenShareLoading(true)
    await stopScreenShare()
    setScreenShareLoading(false)
  }

  const handleAudioShareClick = () => {
    if (!currentRoomId) {
      messageApi.warning('请先选择一个房间')
      return
    }

    if (isAudioSharing) {
      handleStopAudioShare()
    } else {
      setShowAudioPicker(true)
    }
  }

  const handleStartAudioShare = async (deviceId: string) => {
    setShowAudioPicker(false)
    setAudioShareLoading(true)
    await startAudioShare(deviceId)
    setAudioShareLoading(false)
  }

  const handleStopAudioShare = async () => {
    setAudioShareLoading(true)
    await stopAudioShare()
    setAudioShareLoading(false)
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
          onClick={handleAudioShareClick}
          disabled={audioShareLoading}
          isActive={isAudioSharing}
          activeColor="primary"
          title={isAudioSharing ? '停止音频分享' : '开始音频分享'}
          icon={isAudioSharing ? <StopOutlined /> : <CustomerServiceOutlined />}
        />

        <div className="w-px h-6 bg-[var(--color-border)]" />

        <ControlButton
          onClick={() => setIsMuted(!isMuted)}
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
          title="音频设置"
          icon={<SettingOutlined />}
        />
      </div>

      <ScreenSharePicker
        open={showScreenPicker}
        onSelect={handleStartScreenShare}
        onCancel={() => setShowScreenPicker(false)}
      />

      <AudioSharePicker
        open={showAudioPicker}
        onSelect={handleStartAudioShare}
        onCancel={() => setShowAudioPicker(false)}
      />

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