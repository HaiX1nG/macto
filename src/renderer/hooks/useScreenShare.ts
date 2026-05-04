import { useRef, useCallback, useEffect } from 'react'
import { App } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { useServerStore } from '../stores/serverStore'
import { useWebRTCStore } from '../stores/webrtcStore'
import { screenShareService, voiceService } from '../services'
import { WebRTCManager } from '../utils/webrtcManager'
import type { WebRTCSignalRequest } from '@shared/types/api'
import WebSocketService from '../services/websocketService'

export function useScreenShare() {
  const { message } = App.useApp()
  const { currentUser } = useAuthStore()
  const { currentServerId } = useServerStore()
  const {
    localStream,
    isSharing,
    remoteScreens,
    setLocalStream,
    setIsSharing,
    addRemoteScreen,
    removeRemoteScreen,
    clearAll,
  } = useWebRTCStore()

  const webrtcManagerRef = useRef<WebRTCManager | null>(null)
  const wsRef = useRef<WebSocketService | null>(null)

  // Initialize WebRTC manager
  const initWebRTCManager = useCallback(() => {
    if (!currentUser?.userId || webrtcManagerRef.current) return

    const manager = new WebRTCManager(
      currentUser.userId,
      // onSignal - send signal through WebSocket
      async (signal: WebRTCSignalRequest) => {
        if (!currentServerId) return
        try {
          wsRef.current?.send({
            type: 'webrtc_signal',
            payload: signal,
          })
        } catch (err) {
          console.error('Failed to send WebRTC signal:', err)
        }
      },
      // onRemoteStream - received remote screen stream
      (userId: number, username: string, stream: MediaStream) => {
        addRemoteScreen(userId, username, stream)
        message.info(`${username} 开始共享屏幕`)
      },
      // onDisconnected - remote user stopped sharing
      (userId: number) => {
        removeRemoteScreen(userId)
      }
    )

    webrtcManagerRef.current = manager
  }, [currentUser?.userId, currentServerId, addRemoteScreen, removeRemoteScreen, message])

  // Setup WebSocket listeners for WebRTC signals
  useEffect(() => {
    if (!currentServerId || !currentUser) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    // Connect to WebSocket for signaling
    const wsUrl = `ws://localhost:8080/ws?token=${token}&room_id=${currentServerId}`
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
  }, [currentServerId, currentUser, removeRemoteScreen, message])

  // Initialize WebRTC manager
  useEffect(() => {
    initWebRTCManager()
    return () => {
      webrtcManagerRef.current?.closeAll()
      webrtcManagerRef.current = null
    }
  }, [initWebRTCManager])

  // Start screen share
  const startScreenShare = useCallback(async (sourceId: string) => {
    if (!currentServerId) return

    let stream: MediaStream | null = null
    try {
      // First, join the voice room (required for screen share)
      try {
        await voiceService.joinVoice(Number(currentServerId))
      } catch {
        // Continue even if voice join fails - user might already be in the room
      }

      // Get the screen stream with audio
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

      // Store local stream
      setLocalStream(stream)
      setIsSharing(true)

      // Notify backend via WebSocket
      wsRef.current?.send({
        type: 'screen_share_start',
        userId: currentUser?.userId,
        username: currentUser?.username,
      })

      // Also notify backend via HTTP API
      await screenShareService.startScreenShare(Number(currentServerId))

      message.success('屏幕共享已开始')
    } catch (err) {
      console.error('Screen share error:', err)
      // Clean up stream if it was created
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
  }, [currentServerId, setLocalStream, setIsSharing, message, currentUser?.userId, currentUser?.username])

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    if (!currentServerId) return

    try {
      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
        setLocalStream(null)
      }

      // Close WebRTC connections
      webrtcManagerRef.current?.stopScreenShare()

      // Notify backend via WebSocket
      wsRef.current?.send({
        type: 'screen_share_stop',
        userId: currentUser?.userId,
      })

      // Also notify backend via HTTP API
      await screenShareService.stopScreenShare(Number(currentServerId))

      setIsSharing(false)
      message.success('屏幕共享已停止')
    } catch (err) {
      console.error('Stop screen share error:', err)
      message.error('停止屏幕共享失败')
    }
  }, [currentServerId, localStream, setLocalStream, setIsSharing, message, currentUser?.userId])

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