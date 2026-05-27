import { useRef, useCallback, useEffect } from 'react'
import { App } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { useRoomStore } from '../stores/serverStore'
import { useMediaStore } from '../stores/mediaStore'
import { screenShareService, voiceService } from '../services'
import { WebRTCManager } from '../utils/webrtcManager'
import type { WebRTCSignalRequest } from '@shared/types/api'
import WebSocketService from '../services/websocketService'

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
  const wsRef = useRef<WebSocketService | null>(null)

  // Initialize WebRTC manager
  const initWebRTCManager = useCallback(() => {
    if (!currentUser?.userId || webrtcManagerRef.current) return

    const manager = new WebRTCManager(
      currentUser.userId,
      async (signal: WebRTCSignalRequest) => {
        if (!currentRoomId) return
        try {
          wsRef.current?.send({
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
  }, [currentUser?.userId, currentRoomId, addRemoteScreen, removeRemoteScreen, message])

  // Setup WebSocket listeners for WebRTC signals
  useEffect(() => {
    if (!currentRoomId || !currentUser) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    const wsUrl = `ws://localhost:8080/ws?token=${token}&room_id=${currentRoomId}`
    const ws = new WebSocketService({
      url: wsUrl,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
    })

    ws.connect().then(() => {
      wsRef.current = ws

      // Listen for WebRTC signals
      ws.on('webrtc_signal', (data: unknown) => {
        const signal = data as { fromUserId: number; fromUsername: string; signal: WebRTCSignalRequest }
        webrtcManagerRef.current?.handleSignal(
          signal.fromUserId,
          signal.fromUsername,
          signal.signal
        )
      })

      // Listen for screen share started event
      ws.on('screen_share_started', (data: unknown) => {
        const info = data as { userId: number; username: string }
        message.info(`${info.username} 开始共享屏幕`)
      })

      // Listen for screen share stopped event
      ws.on('screen_share_stopped', (data: unknown) => {
        const info = data as { userId: number }
        removeRemoteScreen(info.userId)
      })
    })

    return () => {
      ws.disconnect()
      wsRef.current = null
    }
  }, [currentRoomId, currentUser, removeRemoteScreen, message])

  useEffect(() => {
    initWebRTCManager()
    return () => {
      webrtcManagerRef.current?.closeAll()
      webrtcManagerRef.current = null
    }
  }, [initWebRTCManager])

  // Start screen share
  const startScreenShare = useCallback(async (sourceId: string) => {
    if (!currentRoomId) return

    let stream: MediaStream | null = null
    try {
      try {
        await voiceService.joinVoice(Number(currentRoomId))
      } catch {
        // Ignore voice join error, continue with screen share
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
          },
        } as MediaTrackConstraints,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            maxWidth: 1920,
            maxHeight: 1080,
            maxFrameRate: 30,
          },
        } as MediaTrackConstraints,
      })

      console.error('Got screen stream:', stream)
      console.error('Video tracks:', stream.getVideoTracks())
      console.error('Audio tracks:', stream.getAudioTracks())

      setLocalStream(stream)
      setIsSharing(true)

      wsRef.current?.send({
        type: 'screen_share_start',
        userId: currentUser?.userId,
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
  }, [currentRoomId, setLocalStream, setIsSharing, message, currentUser?.userId, currentUser?.username])

  const stopScreenShare = useCallback(async () => {
    if (!currentRoomId) return

    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
        setLocalStream(null)
      }

      webrtcManagerRef.current?.stopScreenShare()

      wsRef.current?.send({
        type: 'screen_share_stop',
        userId: currentUser?.userId,
      })

      await screenShareService.stopScreenShare(Number(currentRoomId))

      setIsSharing(false)
      message.success('屏幕共享已停止')
    } catch (err) {
      console.error('Stop screen share error:', err)
      message.error('停止屏幕共享失败')
    }
  }, [currentRoomId, localStream, setLocalStream, setIsSharing, message, currentUser?.userId])

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