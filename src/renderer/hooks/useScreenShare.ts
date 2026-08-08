import { useRef, useCallback, useEffect } from 'react'
import { App } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { useRoomStore } from '../stores/serverStore'
import { useMediaStore } from '../stores/mediaStore'
import { screenShareService, voiceService } from '../services'
import { WebRTCManager } from '../utils/webrtcManager'
import { wsConnection } from '../services/wsConnection'
import type { WebRTCSignalRequest } from '@shared/types/api'

export function useScreenShare() {
  const { message } = App.useApp()
  const { currentUser } = useAuthStore()
  const { currentRoomId } = useRoomStore()
  const {
    localStream,
    isSharing,
    remoteScreens,
    setLocalStream,
    setIsSharing,
    addRemoteScreen,
    removeRemoteScreen,
    clearAll,
  } = useMediaStore()

  const webrtcManagerRef = useRef<WebRTCManager | null>(null)
  const unsubsRef = useRef<Array<() => void>>([])

  // Initialize WebRTC manager
  const initWebRTCManager = useCallback(() => {
    if (!currentUser?.id || webrtcManagerRef.current) return

    const manager = new WebRTCManager(
      Number(currentUser.id),
      async (signal: WebRTCSignalRequest) => {
        const ws = wsConnection.getCurrentWs()
        if (!ws) return
        try {
          ws.send({
            type: 'webrtc_signal',
            payload: signal,
          })
        } catch (err) {
          console.error('Failed to send WebRTC signal:', err)
        }
      },
      (userId: number, username: string, stream: MediaStream) => {
        addRemoteScreen(userId, username, stream)
        message.info(`${username} 开始共享屏幕`)
      },
      (userId: number) => {
        removeRemoteScreen(userId)
      }
    )

    webrtcManagerRef.current = manager
  }, [currentUser?.id, addRemoteScreen, removeRemoteScreen, message])

  // Register WebSocket listeners for screen share events on the shared connection
  useEffect(() => {
    if (!currentRoomId || !currentUser) return

    // Unregister previous handlers
    unsubsRef.current.forEach(unsub => unsub())
    unsubsRef.current = []

    // Wait for the shared WS to be available, then register handlers
    const registerHandlers = () => {
      const ws = wsConnection.getCurrentWs()
      if (!ws) {
        // Retry shortly - the shared connection may still be establishing
        setTimeout(registerHandlers, 500)
        return
      }

      // Listen for WebRTC signals
      unsubsRef.current.push(
        ws.on('webrtc_signal', (data: unknown) => {
          const signal = data as { fromUserId: number; fromUsername: string; signal: WebRTCSignalRequest }
          webrtcManagerRef.current?.handleSignal(
            signal.fromUserId,
            signal.fromUsername,
            signal.signal
          )
        })
      )

      // Listen for screen share started event
      unsubsRef.current.push(
        ws.on('screen_share_started', (data: unknown) => {
          const info = data as { userId: number; username: string }
          message.info(`${info.username} 开始共享屏幕`)
        })
      )

      // Listen for screen share stopped event
      unsubsRef.current.push(
        ws.on('screen_share_stopped', (data: unknown) => {
          const info = data as { userId: number }
          removeRemoteScreen(info.userId)
        })
      )
    }

    registerHandlers()

    return () => {
      unsubsRef.current.forEach(unsub => unsub())
      unsubsRef.current = []
    }
  }, [currentRoomId, currentUser, removeRemoteScreen, message])

  useEffect(() => {
    initWebRTCManager()
    return () => {
      webrtcManagerRef.current?.closeAll()
      webrtcManagerRef.current = null
    }
  }, [initWebRTCManager])

  // Start screen share using getDisplayMedia (modern API)
  // sourceId is kept for backward compatibility but ignored -
  // getDisplayMedia shows the system picker dialog
  const startScreenShare = useCallback(async (_sourceId?: string) => {
    if (!currentRoomId) return

    let stream: MediaStream | null = null
    try {
      try {
        await voiceService.joinVoice(Number(currentRoomId))
      } catch {
        // Ignore voice join error, continue with screen share
      }

      // Use getDisplayMedia - the standard API for screen capture.
      // This works in modern Electron without desktopCapturer source IDs.
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 },
        },
        audio: true,
      })

      setLocalStream(stream)
      setIsSharing(true)

      // Notify others via the shared WebSocket
      const ws = wsConnection.getCurrentWs()
      ws?.send({
        type: 'screen_share_start',
        userId: currentUser?.id,
        username: currentUser?.username,
      })

      await screenShareService.startScreenShare(Number(currentRoomId))

      message.success('屏幕共享已开始')
    } catch (err) {
      console.error('Screen share error:', err)
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      setLocalStream(null)
      setIsSharing(false)

      let errorMessage = '开始屏幕共享失败'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        if (axiosErr.response?.data?.message) {
          errorMessage = axiosErr.response.data.message
        }
      }
      message.error(errorMessage)
    }
  }, [currentRoomId, setLocalStream, setIsSharing, message, currentUser?.id, currentUser?.username])

  const stopScreenShare = useCallback(async () => {
    if (!currentRoomId) return

    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
        setLocalStream(null)
      }

      webrtcManagerRef.current?.stopScreenShare()

      const ws = wsConnection.getCurrentWs()
      ws?.send({
        type: 'screen_share_stop',
        userId: currentUser?.id,
      })

      await screenShareService.stopScreenShare(Number(currentRoomId))

      setIsSharing(false)
      message.success('屏幕共享已停止')
    } catch (err) {
      console.error('Stop screen share error:', err)
      message.error('停止屏幕共享失败')
    }
  }, [currentRoomId, localStream, setLocalStream, setIsSharing, message, currentUser?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll()
      webrtcManagerRef.current?.closeAll()
    }
  }, [clearAll])

  return {
    localStream,
    isSharing,
    remoteScreens,
    startScreenShare,
    stopScreenShare,
  }
}
