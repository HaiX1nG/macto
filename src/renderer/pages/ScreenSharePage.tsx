import type { ReactNode } from 'react'
import { useMemo, useCallback } from 'react'
import { useMediaStore } from '@renderer/stores/mediaStore'
import ScreenShareView from '@renderer/components/screen/ScreenShareView'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

/**
 * ScreenSharePage - 屏幕分享页容器。
 *
 * 连接 mediaStore，读取 localStream/remoteScreens/isSharing 状态，
 * 调用 stopSharing action，将状态和回调作为 props 传给 ScreenShareView 展示组件。
 */
export function ScreenSharePage(_props: ViewPageProps): ReactNode {
  const localStream = useMediaStore((s) => s.localStream)
  const remoteScreens = useMediaStore((s) => s.remoteScreens)
  const isSharing = useMediaStore((s) => s.isSharing)
  const currentRoomId = useMediaStore((s) => s.currentRoomId)
  const stopSharing = useMediaStore((s) => s.stopSharing)

  // Map mediaStore remoteScreens (Map<number, RemoteScreen>) to ScreenShareView's array format
  const remoteScreensArray = useMemo(() => {
    return Array.from(remoteScreens.values()).map((rs) => ({
      id: String(rs.userId),
      stream: rs.stream,
      participant: {
        id: String(rs.userId),
        name: rs.username,
        username: rs.username,
        isOnline: true,
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
      },
      isPaused: false,
    }))
  }, [remoteScreens])

  const handleStop = useCallback(() => {
    if (currentRoomId !== null) {
      void stopSharing(currentRoomId)
    }
  }, [currentRoomId, stopSharing])

  // mediaStore 暂无 pause 概念，暂停按钮为占位 no-op
  const handlePauseToggle = useCallback(() => {
    // TODO: 接入 mediaStore 的 pause/resume action（Phase 2）
  }, [])

  return (
    <ScreenShareView
      localStream={localStream}
      remoteScreens={remoteScreensArray}
      isPaused={!isSharing}
      onPauseToggle={handlePauseToggle}
      onStop={handleStop}
    />
  )
}

export default ScreenSharePage
