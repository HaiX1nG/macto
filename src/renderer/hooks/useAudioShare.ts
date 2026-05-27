import { useRef, useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { useRoomStore } from '../stores/serverStore'
import { useMediaStore } from '../stores/mediaStore'
import WebSocketService from '../services/websocketService'
import type { WebRTCSignalRequest } from '@shared/types/api'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function useAudioShare() {
  const { message } = App.useApp()
  const { currentUser } = useAuthStore()
  const { currentRoomId } = useRoomStore()
  const { addRemoteScreen, removeRemoteScreen } = useMediaStore()

  const [isAudioSharing, setIsAudioSharing] = useState(false)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<number, RTCPeerConnection>>(new Map())
  const wsRef = useRef<WebSocketService | null>(null)

  const handleOffer = useCallback(async (fromUserId: number, fromUsername: string, offerPayload: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    peerConnectionsRef.current.set(fromUserId, pc)

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      addRemoteScreen(fromUserId, fromUsername, stream)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send({
          type: 'webrtc_signal',
          payload: {
            type: 'ice-candidate',
            targetId: fromUserId,
            payload: JSON.stringify(event.candidate.toJSON()),
          },
        })
      }
    }

    const offer = JSON.parse(offerPayload) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    wsRef.current?.send({
      type: 'webrtc_signal',
      payload: {
        type: 'answer',
        targetId: fromUserId,
        payload: JSON.stringify(answer),
      },
    })
  }, [addRemoteScreen])

  const handleAnswer = useCallback(async (fromUserId: number, answerPayload: string) => {
    const pc = peerConnectionsRef.current.get(fromUserId)
    if (!pc) return

    const answer = JSON.parse(answerPayload) as RTCSessionDescriptionInit
    await pc.setRemoteDescription(new RTCSessionDescription(answer))
  }, [])

  const handleIceCandidate = useCallback(async (fromUserId: number, candidatePayload: string) => {
    const pc = peerConnectionsRef.current.get(fromUserId)
    if (!pc) return

    const candidate = JSON.parse(candidatePayload) as RTCIceCandidateInit
    await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }, [])

  const handleSignal = useCallback(async (fromUserId: number, fromUsername: string, signal: WebRTCSignalRequest) => {
    switch (signal.type) {
      case 'offer':
        await handleOffer(fromUserId, fromUsername, signal.payload)
        break
      case 'answer':
        await handleAnswer(fromUserId, signal.payload)
        break
      case 'ice-candidate':
        await handleIceCandidate(fromUserId, signal.payload)
        break
    }
  }, [handleOffer, handleAnswer, handleIceCandidate])

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

      ws.on('audio_share_started', (data: unknown) => {
        const info = data as { userId: number; username: string }
        message.info(`${info.username} 开始分享音频`)
      })

      ws.on('audio_share_stopped', (data: unknown) => {
        const info = data as { userId: number }
        const pc = peerConnectionsRef.current.get(info.userId)
        if (pc) {
          pc.close()
          peerConnectionsRef.current.delete(info.userId)
        }
        removeRemoteScreen(info.userId)
      })

      ws.on('webrtc_signal', (data: unknown) => {
        const signal = data as { fromUserId: number; fromUsername: string; signal: WebRTCSignalRequest }
        handleSignal(signal.fromUserId, signal.fromUsername, signal.signal)
      })
    })

    return () => {
      ws.disconnect()
      wsRef.current = null
    }
  }, [currentRoomId, currentUser, removeRemoteScreen, message, handleSignal])

  const startAudioShare = useCallback(async (sourceId: string) => {
    if (!currentRoomId) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          },
        } as MediaTrackConstraints,
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          },
        } as MediaTrackConstraints,
      })

      const audioTracks = stream.getAudioTracks()
      const videoTracks = stream.getVideoTracks()

      videoTracks.forEach(track => track.stop())

      const audioStream = new MediaStream(audioTracks)

      audioStreamRef.current = audioStream
      setIsAudioSharing(true)

      wsRef.current?.send({
        type: 'audio_share_start',
        userId: currentUser?.userId,
        username: currentUser?.username,
      })

      message.success('音频分享已开始')
    } catch (err) {
      console.error('Audio share error:', err)
      message.error('开始音频分享失败')
    }
  }, [currentRoomId, currentUser?.userId, currentUser?.username, message])

  const stopAudioShare = useCallback(async () => {
    if (!currentRoomId) return

    try {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }

      peerConnectionsRef.current.forEach(pc => pc.close())
      peerConnectionsRef.current.clear()

      setIsAudioSharing(false)

      wsRef.current?.send({
        type: 'audio_share_stop',
        userId: currentUser?.userId,
      })

      message.success('音频分享已停止')
    } catch (err) {
      console.error('Stop audio share error:', err)
      message.error('停止音频分享失败')
    }
  }, [currentRoomId, currentUser?.userId, message])

  useEffect(() => {
    const audioStream = audioStreamRef.current
    const peerConnections = peerConnectionsRef.current
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
      }
      peerConnections.forEach(pc => pc.close())
    }
  }, [])

  return {
    isAudioSharing,
    startAudioShare,
    stopAudioShare,
  }
}