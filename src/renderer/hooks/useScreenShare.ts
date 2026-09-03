import { useRef, useCallback, useEffect } from 'react'
import { App } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useMediaStore } from '../stores/mediaStore'
import { voiceService } from '../services'
import { WebRTCManager } from '../utils/webrtcManager'
import { wsConnection } from '../services/wsConnection'
import type { WebRTCSignalRequest } from '@shared/types/voice'

export function useScreenShare() {
  const { message } = App.useApp()
  const { currentUser } = useAuthStore()
  const currentChannelId = useUIStore((s) => s.currentChannelId)
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

  // Initialize WebRTC manager for screen share
  const initWebRTCManager = useCallback(() => {
    if (!currentUser?.id || webrtcManagerRef.current) return

    const manager = new WebRTCManager(
      currentUser.id,
      async (signal: WebRTCSignalRequest) => {
        const ws = wsConnection.getCurrentWs()
        if (!ws) return
        try {
          ws.sendWebRTCSignal(signal.type, signal.targetId ?? 0, signal.payload, 'screen')
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
      },
      'screen'
    )

    webrtcManagerRef.current = manager
  }, [currentUser?.id, addRemoteScreen, removeRemoteScreen, message])

  // Register WebSocket listeners for screen share events on the shared connection
  useEffect(() => {
    if (!currentChannelId || !currentUser) return

    // Unregister previous handlers
    unsubsRef.current.forEach((unsub) => unsub())
    unsubsRef.current = []

    // Wait for the shared WS to be available, then register handlers
    const registerHandlers = () => {
      const ws = wsConnection.getCurrentWs()
      if (!ws) {
        // Retry shortly - the shared connection may still be establishing
        setTimeout(registerHandlers, 500)
        return
      }

      // Listen for screen share started event (new protocol: screen_share_start)
      unsubsRef.current.push(
        ws.on('screen_share_start', (data: unknown) => {
          const info = data as { channelId: number; userId: number }
          if (info.userId !== currentUser?.id) {
            message.info('有人开始共享屏幕')
          }
        })
      )

      // Listen for screen share stopped event (new protocol: screen_share_stop)
      unsubsRef.current.push(
        ws.on('screen_share_stop', (data: unknown) => {
          const info = data as { channelId: number; userId: number }
          removeRemoteScreen(info.userId)
        })
      )
    }

    registerHandlers()

    return () => {
      unsubsRef.current.forEach((unsub) => unsub())
      unsubsRef.current = []
    }
  }, [currentChannelId, currentUser, removeRemoteScreen, message])

  useEffect(() => {
    initWebRTCManager()
    return () => {
      webrtcManagerRef.current?.closeAll()
      webrtcManagerRef.current = null
    }
  }, [initWebRTCManager])

  // Start screen share using getDisplayMedia (modern API)
  const startScreenShare = useCallback(async (_sourceId?: string) => {
    if (!currentChannelId) return

    let stream: MediaStream | null = null
    try {
      try {
        await voiceService.joinVoice(currentChannelId)
      } catch {
        // Ignore voice join error, continue with screen share
      }

      // Use getDisplayMedia - the standard API for screen capture.
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

      // Notify others via the shared WebSocket (new protocol: { event, data })
      const ws = wsConnection.getCurrentWs()
      ws?.send({
        event: 'screen_share_start',
        data: {
          channelId: currentChannelId,
          userId: currentUser?.id,
        },
      })

      await voiceService.startScreenShare(currentChannelId)

      message.success('屏幕共享已开始')
    } catch (err) {
      console.error('Screen share error:', err)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
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
  }, [currentChannelId, setLocalStream, setIsSharing, message, currentUser?.id])

  const stopScreenShare = useCallback(async () => {
    if (!currentChannelId) return

    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
        setLocalStream(null)
      }

      webrtcManagerRef.current?.stopScreenShare()

      const ws = wsConnection.getCurrentWs()
      ws?.send({
        event: 'screen_share_stop',
        data: {
          channelId: currentChannelId,
          userId: currentUser?.id,
        },
      })

      await voiceService.stopScreenShare(currentChannelId)

      setIsSharing(false)
      message.success('屏幕共享已停止')
    } catch (err) {
      console.error('Stop screen share error:', err)
      message.error('停止屏幕共享失败')
    }
  }, [currentChannelId, localStream, setLocalStream, setIsSharing, message, currentUser?.id])

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
