import { useState } from 'react'
import { App } from 'antd'
import { AudioOutlined, AudioMutedOutlined, SoundOutlined, DesktopOutlined, StopOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { screenShareService } from '@renderer/services'
import { ScreenSharePicker } from '../screen/ScreenSharePicker'

export function UserPanel() {
  const { message: messageApi } = App.useApp()
  const { currentServerId } = useServerStore()

  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenShareLoading, setScreenShareLoading] = useState(false)
  const [showScreenPicker, setShowScreenPicker] = useState(false)

  const handleScreenShareClick = () => {
    if (!currentServerId) {
      messageApi.warning('请先选择一个房间')
      return
    }

    if (isScreenSharing) {
      // Stop screen share
      handleStopScreenShare()
    } else {
      // Show screen picker
      setShowScreenPicker(true)
    }
  }

  const handleStartScreenShare = async (_sourceId: string) => {
    if (!currentServerId) return

    setShowScreenPicker(false)
    setScreenShareLoading(true)
    try {
      await screenShareService.startScreenShare(Number(currentServerId))
      setIsScreenSharing(true)
      messageApi.success('屏幕共享已开始')
    } catch (err) {
      console.error('Screen share error:', err)
      messageApi.error('开始屏幕共享失败')
    } finally {
      setScreenShareLoading(false)
    }
  }

  const handleStopScreenShare = async () => {
    if (!currentServerId) return

    setScreenShareLoading(true)
    try {
      await screenShareService.stopScreenShare(Number(currentServerId))
      setIsScreenSharing(false)
      messageApi.success('屏幕共享已停止')
    } catch (err) {
      console.error('Screen share error:', err)
      messageApi.error('停止屏幕共享失败')
    } finally {
      setScreenShareLoading(false)
    }
  }

  return (
    <>
      <div className="h-[52px] bg-[var(--color-bg-darker)] px-2 flex items-center justify-center gap-2 flex-shrink-0">
        <button
          onClick={handleScreenShareClick}
          disabled={screenShareLoading}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--color-bg-tertiary)]",
            isScreenSharing ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]",
            screenShareLoading && "opacity-50 cursor-not-allowed"
          )}
          title={isScreenSharing ? '停止屏幕共享' : '开始屏幕共享'}
        >
          {isScreenSharing ? <StopOutlined /> : <DesktopOutlined />}
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
      </div>

      <ScreenSharePicker
        open={showScreenPicker}
        onSelect={handleStartScreenShare}
        onCancel={() => setShowScreenPicker(false)}
      />
    </>
  )
}
