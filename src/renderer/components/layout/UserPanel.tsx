import { useState } from 'react'
import { App } from 'antd'
import { AudioOutlined, AudioMutedOutlined, SoundOutlined, DesktopOutlined, StopOutlined, CustomerServiceOutlined, SettingOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { useScreenShare } from '@renderer/hooks/useScreenShare'
import { useAudioShare } from '@renderer/hooks/useAudioShare'
import { ScreenSharePicker } from '../screen/ScreenSharePicker'
import { ScreenSharePreview } from '../screen/ScreenSharePreview'
import { AudioSharePicker } from '../audio/AudioSharePicker'
import { AudioSettings } from '../settings/AudioSettings'

export function UserPanel() {
  const { message: messageApi } = App.useApp()
  const { currentServerId } = useServerStore()
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
    if (!currentServerId) {
      messageApi.warning('请先选择一个房间')
      return
    }

    if (isSharing) {
      // Stop screen share
      handleStopScreenShare()
    } else {
      // Show screen picker
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
    if (!currentServerId) {
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
      <div className="h-[52px] bg-[var(--color-bg-darker)] px-2 flex items-center justify-center gap-2 flex-shrink-0">
        <button
          onClick={handleScreenShareClick}
          disabled={screenShareLoading}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--color-bg-tertiary)]",
            isSharing ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]",
            screenShareLoading && "opacity-50 cursor-not-allowed"
          )}
          title={isSharing ? '停止屏幕共享' : '开始屏幕共享'}
        >
          {isSharing ? <StopOutlined /> : <DesktopOutlined />}
        </button>
        <button
          onClick={handleAudioShareClick}
          disabled={audioShareLoading}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--color-bg-tertiary)]",
            isAudioSharing ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]",
            audioShareLoading && "opacity-50 cursor-not-allowed"
          )}
          title={isAudioSharing ? '停止音频分享' : '开始音频分享'}
        >
          {isAudioSharing ? <StopOutlined /> : <CustomerServiceOutlined />}
        </button>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--color-bg-tertiary)]",
            isMuted ? "text-[var(--color-dnd)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"
          )}
          title={isMuted ? '取消静音' : '静音'}
        >
          {isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
        </button>
        <button
          onClick={() => setIsDeafened(!isDeafened)}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--color-bg-tertiary)]",
            isDeafened ? "text-[var(--color-dnd)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"
          )}
          title={isDeafened ? '取消耳聋' : '耳聋'}
        >
          <SoundOutlined />
        </button>
        <button
          onClick={() => setShowAudioSettings(true)}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--color-bg-tertiary)]",
            "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"
          )}
          title="音频设置"
        >
          <SettingOutlined />
        </button>
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