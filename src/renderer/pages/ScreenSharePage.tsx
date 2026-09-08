import type { ReactNode } from 'react'
import { useMemo, useCallback } from 'react'
import { useMediaStore } from '@renderer/stores/mediaStore'
import ScreenShareView from '@renderer/components/screen/ScreenShareView'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

/**
 * ScreenSharePage - 屏幕分享页容器。
 *
 * 连接 mediaStore，读取 localStream/remoteScreens/isSharing 状态，
 * 调用 startSharing/stopSharing actions，将状态和回调作为 props 传给 ScreenShareView 展示组件。
 */
export function ScreenSharePage(_props: ViewPageProps): ReactNode {
  const localStream = useMediaStore((s) => s.localStream)
  const remoteScreens = useMediaStore((s) => s.remoteScreens)
  const isSharing = useMediaStore((s) => s.isSharing)
  const currentRoomId = useMediaStore((s) => s.currentRoomId)
  const startSharing = useMediaStore((s) => s.startSharing)
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

  const handleStart = useCallback(() => {
    if (currentRoomId !== null) {
      void startSharing(currentRoomId)
    }
  }, [currentRoomId, startSharing])

  const handleStop = useCallback(() => {
    if (currentRoomId !== null) {
      void stopSharing(currentRoomId)
    }
  }, [currentRoomId, stopSharing])

  return (
    <ScreenShareView
      localStream={localStream}
      remoteScreens={remoteScreensArray}
      isSharing={isSharing}
      hasRemoteScreens={remoteScreensArray.length > 0}
      isPaused={!isSharing}
      onStart={handleStart}
      onStop={handleStop}
    />
  )
}

export default ScreenSharePage
