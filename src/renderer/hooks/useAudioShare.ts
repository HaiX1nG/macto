import { useRef, useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { useAuthStore } from '../stores/authStore'
import { useRoomStore } from '../stores/serverStore'
import { useMediaStore } from '../stores/mediaStore'
import { wsConnection } from '../services/wsConnection'
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
  const unsubsRef = useRef<Array<() => void>>([])

  const handleOffer = useCallback(async (fromUserId: number, fromUsername: string, offerPayload: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    peerConnectionsRef.current.set(fromUserId, pc)

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      addRemoteScreen(fromUserId, fromUsername, stream)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const ws = wsConnection.getCurrentWs()
        ws?.send({
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

    const ws = wsConnection.getCurrentWs()
    ws?.send({
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

  // Register WebSocket listeners on the shared connection
  useEffect(() => {
    if (!currentRoomId || !currentUser) return

    unsubsRef.current.forEach(unsub => unsub())
    unsubsRef.current = []

    const registerHandlers = () => {
      const ws = wsConnection.getCurrentWs()
      if (!ws) {
        setTimeout(registerHandlers, 500)
        return
      }

      unsubsRef.current.push(
        ws.on('audio_share_started', (data: unknown) => {
          const info = data as { userId: number; username: string }
          message.info(`${info.username} 开始分享音频`)
        })
      )

      unsubsRef.current.push(
        ws.on('audio_share_stopped', (data: unknown) => {
          const info = data as { userId: number }
          const pc = peerConnectionsRef.current.get(info.userId)
          if (pc) {
            pc.close()
            peerConnectionsRef.current.delete(info.userId)
          }
          removeRemoteScreen(info.userId)
        })
      )

      unsubsRef.current.push(
        ws.on('webrtc_signal', (data: unknown) => {
          const signal = data as { fromUserId: number; fromUsername: string; signal: WebRTCSignalRequest }
          handleSignal(signal.fromUserId, signal.fromUsername, signal.signal)
        })
      )
    }

    registerHandlers()

    return () => {
      unsubsRef.current.forEach(unsub => unsub())
      unsubsRef.current = []
    }
  }, [currentRoomId, currentUser, removeRemoteScreen, message, handleSignal])

  // Start audio share using getDisplayMedia to capture system audio.
  // sourceId is kept for backward compatibility but ignored.
  const startAudioShare = useCallback(async (_sourceId?: string) => {
    if (!currentRoomId) return

    try {
      // Use getDisplayMedia with audio:true to capture system audio.
      // We request video:true (required by some implementations) but
      // immediately stop video tracks - we only need audio.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      const audioTracks = stream.getAudioTracks()
      const videoTracks = stream.getVideoTracks()

      // Stop video tracks - we only want audio
      videoTracks.forEach(track => track.stop())

      if (audioTracks.length === 0) {
        message.warning('未捕获到音频轨道，请确保在共享时勾选了"共享音频"选项')
        stream.getTracks().forEach(track => track.stop())
        return
      }

      const audioStream = new MediaStream(audioTracks)

      audioStreamRef.current = audioStream
      setIsAudioSharing(true)

      const ws = wsConnection.getCurrentWs()
      ws?.send({
        type: 'audio_share_start',
        userId: currentUser?.id,
        username: currentUser?.username,
      })

      message.success('音频分享已开始')
    } catch (err) {
      console.error('Audio share error:', err)
      message.error('开始音频分享失败')
    }
  }, [currentRoomId, currentUser?.id, currentUser?.username, message])

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

      const ws = wsConnection.getCurrentWs()
      ws?.send({
        type: 'audio_share_stop',
        userId: currentUser?.id,
      })

      message.success('音频分享已停止')
    } catch (err) {
      console.error('Stop audio share error:', err)
      message.error('停止音频分享失败')
    }
  }, [currentRoomId, currentUser?.id, message])

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
